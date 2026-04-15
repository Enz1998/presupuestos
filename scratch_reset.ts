import { createClient } from './src/utils/supabase/server'

async function reset() {
  const supabase = await createClient()
  
  console.log('Limpiando base de datos...')
  
  // Usamos rpc para ejecutar comandos SQL directos si están permitidos, 
  // o borramos todo de la tabla presupuestos.
  const { error: delError } = await supabase
    .from('presupuestos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Borra todo

  if (delError) {
    console.error('Error al borrar:', delError)
  } else {
    console.log('Tabla presupuestos limpia.')
  }

  // Para resetear la secuencia, lo ideal es hacerlo por SQL. 
  // Como no podemos ejecutar SQL arbitrario fácil por JS sin una función RPC,
  // el usuario puede ejecutarlo en el dashboard.
}

reset()
