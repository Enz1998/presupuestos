import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombreLista, tramos, activar = false } = body

    if (!nombreLista || !nombreLista.trim()) {
      return NextResponse.json({ error: 'El nombre de la lista es requerido' }, { status: 400 })
    }

    if (!Array.isArray(tramos) || tramos.length === 0) {
      return NextResponse.json({ error: 'La lista debe contener al menos un tramo' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verificar nombre único
    const { data: existing } = await supabase
      .from('rangos_precio')
      .select('id')
      .eq('nombre', nombreLista.trim())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe una lista con ese nombre. Elegí otro nombre.' }, { status: 400 })
    }

    // 2. Si se activa, desactivar las existentes
    if (activar) {
      await supabase
        .from('rangos_precio')
        .update({ activo: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // 3. Preparar e insertar tramos
    const payload = tramos.map((t: any) => ({
      nombre: nombreLista.trim(),
      rango_min: parseInt(t.rango_min),
      rango_max: t.rango_max != null && t.rango_max !== '' ? parseInt(t.rango_max) : null,
      valor_unitario: parseFloat(t.valor_unitario),
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
      nombreLista: nombreLista.trim(),
      tramosImportados: inserted?.length || 0,
      activa: Boolean(activar),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
