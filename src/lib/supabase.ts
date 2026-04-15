import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ──────────────────────────────────────────────────────────────────

export interface RangoPrecio {
  id: string
  nombre: string
  rango_min: number
  rango_max: number | null
  valor_unitario: number   // precio por colaborador (sin IVA)
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface Presupuesto {
  id: string
  numero_acuerdo: number
  version: number
  nombre_empresa: string
  cantidad_usuarios: number
  valor_licencia: number
  descuento_porcentaje: number
  descuento_meses: number
  recurso_excedente: number
  valor_total_mensual: number
  fecha_propuesta: string
  rango_id: string | null
  creado_en: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Dado un número de usuarios, devuelve el rango activo correspondiente.
 */
export function findRangoForUsuarios(
  rangos: RangoPrecio[],
  usuarios: number
): RangoPrecio | undefined {
  return rangos
    .filter((r) => r.activo)
    .find(
      (r) =>
        usuarios >= r.rango_min &&
        (r.rango_max === null || usuarios <= r.rango_max)
    )
}

/**
 * Redondea al múltiplo de 10 más cercano.
 */
export function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10
}

/**
 * Formatea número al estilo argentino: 464280 → "464.280"
 */
export function formatPeso(value: number): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
