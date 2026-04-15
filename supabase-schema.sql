-- ============================================================
-- SCHEMA: App de Presupuestos Naaloo
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tabla de rangos de precio
CREATE TABLE IF NOT EXISTS rangos_precio (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre          TEXT NOT NULL,
  rango_min       INTEGER NOT NULL,
  rango_max       INTEGER,
  valor_unitario  NUMERIC(12,2) NOT NULL,
  activo          BOOLEAN DEFAULT TRUE,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- Secuencia para número de acuerdo (arranca en 1001)
CREATE SEQUENCE IF NOT EXISTS acuerdos_seq START 1001;

-- Tabla de presupuestos generados
CREATE TABLE IF NOT EXISTS presupuestos (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_acuerdo        INTEGER DEFAULT nextval('acuerdos_seq'),
  version               INTEGER DEFAULT 1,
  nombre_empresa        TEXT NOT NULL,
  cantidad_usuarios     INTEGER DEFAULT 212 NOT NULL,
  valor_unitario        NUMERIC(12,2),
  valor_licencia        NUMERIC(12,2) NOT NULL,
  descuento_porcentaje  INTEGER DEFAULT 25,
  descuento_meses       INTEGER DEFAULT 6,
  recurso_excedente     NUMERIC(12,2),
  valor_total_mensual   NUMERIC(12,2),
  fecha_propuesta       DATE NOT NULL,
  rango_id              UUID REFERENCES rangos_precio(id) ON DELETE SET NULL,
  creado_en             TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_presupuestos_creado ON presupuestos(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_rangos_activo ON rangos_precio(activo, rango_min);

-- Habilitar RLS
ALTER TABLE rangos_precio ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: Solo usuarios autenticados pueden ver o modificar datos ==================
DROP POLICY IF EXISTS "allow_all_rangos" ON rangos_precio;
DROP POLICY IF EXISTS "allow_all_presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "allow_auth_rangos" ON rangos_precio;
DROP POLICY IF EXISTS "allow_auth_presupuestos" ON presupuestos;

CREATE POLICY "allow_auth_rangos" ON rangos_precio FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "allow_auth_presupuestos" ON presupuestos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- MIGRACIÓN SI YA TENÍAS LA BASE DE DATOS CREADA ANTERIORMENTE:
-- ============================================================
-- ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS numero_acuerdo INTEGER DEFAULT nextval('acuerdos_seq');
-- ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
-- 
-- (Al ejecutar todo este archivo, actualizará las políticas automáticamente y creará la secuencia)
