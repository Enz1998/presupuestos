import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import initialPrices from '@/lib/precios-iniciales.json'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { activar = true, nombre = 'Lista con Aumento 20% - Octubre 2026' } = body

    const supabase = await createClient()

    // 1. Verificar si ya existe una lista con este nombre
    const { data: existing } = await supabase
      .from('rangos_precio')
      .select('id')
      .eq('nombre', nombre)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        error: `Ya existe una lista registrada con el nombre "${nombre}".`,
      }, { status: 400 })
    }

    // 2. Si se activa, desactivar las demás sin eliminar ninguna (integridad de presupuestos)
    if (activar) {
      await supabase
        .from('rangos_precio')
        .update({ activo: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // 3. Preparar los 52 tramos extraídos directamente del Excel oficial
    const payload = initialPrices.lista_aumento_20.map(t => ({
      nombre,
      rango_min: t.rango_min,
      rango_max: t.rango_max,
      valor_unitario: t.valor_unitario,
      activo: Boolean(activar),
    }))

    const { data: inserted, error: errInsert } = await supabase
      .from('rangos_precio')
      .insert(payload)
      .select()

    if (errInsert) {
      return NextResponse.json({ error: errInsert.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nombre,
      tramosInsertados: inserted?.length || 0,
      activa: Boolean(activar),
    })
  } catch (err: any) {
    console.error('Error al cargar lista 20%:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
