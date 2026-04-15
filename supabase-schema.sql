-- ============================================================
-- SCHEMA: App de Presupuestos Naaloo
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tabla de rangos de precio
CREATE TABLE rangos_precio (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre          TEXT NOT NULL,            -- ej: "1 a 50 usuarios"
  rango_min       INTEGER NOT NULL,         -- mínimo de usuarios (inclusivo)
  rango_max       INTEGER,                  -- máximo de usuarios (null = sin límite)
  valor_unitario  NUMERIC(12,2) NOT NULL,   -- precio por colaborador, en pesos sin IVA
  activo          BOOLEAN DEFAULT TRUE,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de rangos
-- valor_licencia = cantidad_usuarios × valor_unitario
-- El template actual: 212 usuarios × $2.190 = $464.280 (coincide con el PPTX)
INSERT INTO rangos_precio (nombre, rango_min, rango_max, valor_unitario) VALUES
  ('1 a 50 usuarios',      1,   50,  3000),
  ('51 a 100 usuarios',    51,  100, 2500),
  ('101 a 200 usuarios',   101, 200, 2300),
  ('201 a 300 usuarios',   201, 300, 2190),
  ('301 a 500 usuarios',   301, 500, 2000),
  ('Más de 500 usuarios',  501, NULL,1800);

-- Tabla de presupuestos generados
CREATE TABLE presupuestos (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_empresa        TEXT NOT NULL,
  cantidad_usuarios     INTEGER DEFAULT 212 NOT NULL,
  valor_unitario        NUMERIC(12,2),             -- precio por colaborador del rango aplicado
  valor_licencia        NUMERIC(12,2) NOT NULL,    -- cantidad_usuarios × valor_unitario
  descuento_porcentaje  INTEGER DEFAULT 25,
  descuento_meses       INTEGER DEFAULT 6,
  recurso_excedente     NUMERIC(12,2),             -- = valor_unitario (precio por usuario extra)
  valor_total_mensual   NUMERIC(12,2),             -- valor_licencia × (1 - descuento%)
  fecha_propuesta       DATE NOT NULL,
  rango_id              UUID REFERENCES rangos_precio(id),
  creado_en             TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_presupuestos_creado ON presupuestos(creado_en DESC);
CREATE INDEX idx_rangos_activo ON rangos_precio(activo, rango_min);

-- RLS permisivo para MVP sin auth
ALTER TABLE rangos_precio ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_rangos" ON rangos_precio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_presupuestos" ON presupuestos FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- MIGRACIÓN (si ya ejecutaste el schema anterior):
-- ============================================================
-- ALTER TABLE rangos_precio RENAME COLUMN valor_licencia TO valor_unitario;
-- ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(12,2);
