import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { listaBaseNombre, nuevaListaNombre, porcentajeAumento, activar = false } = body

    if (!listaBaseNombre || !nuevaListaNombre || typeof porcentajeAumento !== 'number') {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    if (!nuevaListaNombre.trim()) {
      return NextResponse.json({ error: 'El nombre de la nueva lista no puede estar vacío' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Obtener los tramos de la lista base
    const { data: baseTramos, error: errFetch } = await supabase
      .from('rangos_precio')
      .select('*')
      .eq('nombre', listaBaseNombre)
      .order('rango_min', { ascending: true })

    if (errFetch || !baseTramos || baseTramos.length === 0) {
      return NextResponse.json({ error: 'No se encontraron tramos para la lista base seleccionada' }, { status: 404 })
    }

    // 2. Verificar que no exista ya una lista con el mismo nombre
    const { data: existing } = await supabase
      .from('rangos_precio')
      .select('id')
      .eq('nombre', nuevaListaNombre.trim())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe una lista con ese nombre. Elegí un nombre diferente.' }, { status: 400 })
    }

    // 3. Si se va a activar de inmediato, desactivar las demás
    if (activar) {
      await supabase
        .from('rangos_precio')
        .update({ activo: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // 4. Calcular nuevos tramos aplicando el aumento porcentual
    const factor = 1 + porcentajeAumento / 100
    const newTramos = baseTramos.map(t => {
      const nuevoPrecio = Math.round(Number(t.valor_unitario) * factor * 100) / 100
      return {
        nombre: nuevaListaNombre.trim(),
        rango_min: t.rango_min,
        rango_max: t.rango_max,
        valor_unitario: nuevoPrecio,
        activo: Boolean(activar),
      }
    })

    const { data: inserted, error: errInsert } = await supabase
      .from('rangos_precio')
      .insert(newTramos)
      .select()

    if (errInsert) {
      return NextResponse.json({ error: errInsert.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nuevaListaNombre: nuevaListaNombre.trim(),
      tramosCreados: inserted?.length || 0,
      activa: Boolean(activar),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
