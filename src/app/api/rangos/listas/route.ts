import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export interface ListaPrecioSummary {
  nombre: string
  activa: boolean
  tramosCount: number
  rangoMin: number
  rangoMax: number | null
  minPrecio: number
  maxPrecio: number
  creado_en?: string
  tramos: any[]
}

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Obtener todos los rangos existentes
    const { data: rangos, error } = await supabase
      .from('rangos_precio')
      .select('*')
      .order('rango_min', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(groupRangosByList(rangos || []))
  } catch (err: any) {
    console.error('Error en /api/rangos/listas:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

function groupRangosByList(rangos: any[]): ListaPrecioSummary[] {
  const map = new Map<string, any[]>()

  for (const r of rangos) {
    const listName = r.nombre || 'Lista General'
    if (!map.has(listName)) {
      map.set(listName, [])
    }
    map.get(listName)!.push(r)
  }

  const result: ListaPrecioSummary[] = []
  for (const [nombre, items] of map.entries()) {
    items.sort((a, b) => a.rango_min - b.rango_min)
    const isActiva = items.some(i => i.activo)
    const rMin = items.length ? items[0].rango_min : 0
    const rMax = items.length ? items[items.length - 1].rango_max : null
    const precios = items.map(i => Number(i.valor_unitario))
    const minPrecio = precios.length ? Math.min(...precios) : 0
    const maxPrecio = precios.length ? Math.max(...precios) : 0

    result.push({
      nombre,
      activa: isActiva,
      tramosCount: items.length,
      rangoMin: rMin,
      rangoMax: rMax,
      minPrecio,
      maxPrecio,
      creado_en: items[0]?.creado_en,
      tramos: items,
    })
  }

  // Ordenar: activa primero, luego por nombre
  result.sort((a, b) => {
    if (a.activa === b.activa) return a.nombre.localeCompare(b.nombre)
    return a.activa ? -1 : 1
  })

  return result
}
