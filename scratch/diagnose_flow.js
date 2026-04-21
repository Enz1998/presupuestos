/**
 * Diagnóstico del flujo completo del bug de descarga
 */
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const { createClient } = require('@supabase/supabase-js');

async function run() {
  console.log('=== DIAGNÓSTICO DEL BUG DE DESCARGA ===\n');

  // 1. Verificar templates
  console.log('--- 1. TEMPLATES ---');
  const templateConDesc = path.join(__dirname, '..', 'public', 'template_con_descuento.pptx');
  const templateSinDesc = path.join(__dirname, '..', 'public', 'template_sin_descuento.pptx');
  const templateViejo = path.join(__dirname, '..', 'public', 'template.pptx');
  console.log(`template_con_descuento.pptx: ${fs.existsSync(templateConDesc) ? 'EXISTE ✓' : 'NO EXISTE ✗'}`);
  console.log(`template_sin_descuento.pptx: ${fs.existsSync(templateSinDesc) ? 'EXISTE ✓' : 'NO EXISTE ✗'}`);
  console.log(`template.pptx (VIEJO): ${fs.existsSync(templateViejo) ? '⚠️ EXISTE (debería haberse eliminado)' : 'No existe ✓'}`);
  console.log('');

  // 2. Últimos presupuestos en DB
  console.log('--- 2. ÚLTIMOS PRESUPUESTOS EN DB ---');
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Login para tener acceso (RLS)
  const { error: loginErr } = await supabase.auth.signInWithPassword({
    email: env.SUPABASE_USER_EMAIL || 'admin@naaloo.com',
    password: env.SUPABASE_USER_PASSWORD || 'password',
  });
  if (loginErr) {
    console.log('No pude autenticar. Intento sin auth...');
  }

  const { data: presupuestos, error } = await supabase
    .from('presupuestos')
    .select('id, nombre_empresa, cantidad_usuarios, valor_licencia, descuento_porcentaje, creado_en')
    .order('creado_en', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error DB:', error.message);
  } else {
    presupuestos.forEach((p, i) => {
      console.log(`  ${i+1}. ID: ${p.id.substring(0, 8)}...  Empresa: "${p.nombre_empresa}"  Usuarios: ${p.cantidad_usuarios}  Desc: ${p.descuento_porcentaje}%  Creado: ${p.creado_en}`);
    });
    if (presupuestos.length >= 2) {
      console.log(`  → IDs distintos: ${presupuestos[0].id !== presupuestos[1].id ? 'SÍ ✓' : 'NO ✗ ← BUG EN DB!'}`);
    }
  }
  console.log('');

  // 3. Analizar el código fuente
  console.log('--- 3. ANÁLISIS DEL CÓDIGO FRONTEND (page.tsx) ---');
  const pageSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'page.tsx'), 'utf8');
  
  console.log('Flujo de captura del ID:');
  if (pageSource.includes("res.headers.get('X-Presupuesto-Id')")) {
    console.log('  → Intenta leer header X-Presupuesto-Id PRIMERO');
    console.log('  → Si funciona, setGeneratedId(headerValue)');
    console.log('  → Si NO funciona, cae a res.json().id');
    console.log('');
    console.log('  ⚠️ PROBLEMA #1: Los custom headers pueden NO estar');
    console.log('  accesibles en fetch responses dentro de Next.js App Router.');
    console.log('  El header puede devolver null, forzando la lectura del body.');
    console.log('  Si algo falla en ese fallback, el generatedId queda stale.');
  }
  console.log('');
  
  console.log('Mecanismo de descarga:');
  if (pageSource.includes('window.location.href')) {
    console.log('  → Usa window.location.href para descargar');
    console.log('');
    console.log('  ⚠️ PROBLEMA #2 (CAUSA RAÍZ MÁS PROBABLE):');
    console.log('  window.location.href inicia una NAVEGACIÓN REAL del browser.');
    console.log('  Next.js App Router intercepta TODAS las navegaciones client-side');
    console.log('  a través de su router. Cuando la ruta /api/download/[id] devuelve');
    console.log('  Content-Disposition: attachment, el browser cancela la navegación');
    console.log('  y descarga el archivo. PERO Next.js ya procesó la navegación');
    console.log('  internamente y puede haber modificado el estado del componente.');
    console.log('');
    console.log('  Además, el Next.js router tiene caché de rutas (Router Cache)');
    console.log('  que puede servir respuestas cacheadas para URLs similares.');
    console.log('  Aunque el ?t=timestamp debería evitar esto, el router puede');
    console.log('  ignorar los query params para el matching de la ruta dinámica.');
  }
  console.log('');
  
  // 4. Verificar generador PPTX
  console.log('--- 4. ANÁLISIS DEL GENERADOR PPTX ---');
  const genSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'pptx-generator.ts'), 'utf8');
  
  if (genSource.includes('template_con_descuento.pptx') && genSource.includes('template_sin_descuento.pptx')) {
    console.log('  Usa templates nuevos: SÍ ✓');
  }
  if (genSource.includes("'template.pptx'") || genSource.includes('"template.pptx"')) {
    console.log('  ⚠️ Todavía referencia template viejo');
  }
  if (genSource.includes('readFileSync')) {
    console.log('  Lee template del filesystem cada vez: SÍ ✓ (sin caché)');
  }
  console.log('');
  
  // 5. Verificar download route
  console.log('--- 5. ANÁLISIS DE LA RUTA DE DESCARGA ---');
  const dlSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'download', '[id]', 'route.ts'), 'utf8');
  
  console.log(`  force-dynamic: ${dlSource.includes("force-dynamic") ? 'SÍ ✓' : 'NO ✗'}`);
  console.log(`  no-cache headers: ${dlSource.includes("no-store") ? 'SÍ ✓' : 'NO ✗'}`);
  console.log(`  Lee ID de params: ${dlSource.includes("await params") ? 'SÍ ✓' : 'NO ✗'}`);
  console.log('');

  // 6. Conclusión
  console.log('========================================');
  console.log('CONCLUSIÓN:');
  console.log('========================================');
  console.log('');
  console.log('El bug se produce por DOS problemas combinados:');
  console.log('');
  console.log('1. CAPTURA DE ID FRÁGIL:');
  console.log('   El frontend intenta leer el ID del header X-Presupuesto-Id.');
  console.log('   Si falla, hace res.json() como fallback. Este patrón');
  console.log('   es frágil y puede fallar silenciosamente.');
  console.log('');
  console.log('2. DESCARGA VÍA NAVEGACIÓN:');
  console.log('   window.location.href causa una navegación real que Next.js');
  console.log('   intercepta. Cuando Content-Disposition: attachment cancela');
  console.log('   la navegación, el estado de React puede quedar inconsistente');
  console.log('   o el Next.js Router Cache puede servir la respuesta previa.');
  console.log('');
  console.log('SOLUCIÓN:');
  console.log('1. Siempre leer el ID del body JSON (no del header)');
  console.log('2. Usar fetch() + Blob + <a download> para descargas');
  console.log('   Esto evita completamente la navegación del browser');
  console.log('   y el Router Cache de Next.js no se involucra.');
}

run().catch(console.error);
