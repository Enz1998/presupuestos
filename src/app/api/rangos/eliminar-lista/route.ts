import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { listaNombre } = body

    if (!listaNombre || typeof listaNombre !== 'string') {
      return NextResponse.json({ error: 'Nombre de lista requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Obtener los IDs de los tramos de esta lista
    const { data: tramos, error: errFetch } = await supabase
      .from('rangos_precio')
      .select('id, activo')
      .eq('nombre', listaNombre)

    if (errFetch || !tramos || tramos.length === 0) {
      return NextResponse.json({ error: 'No se encontraron tramos para esta lista' }, { status: 404 })
    }

    const tramoIds = tramos.map(t => t.id)

    // 2. Comprobar si algún presupuesto en el historial referencia alguno de estos tramos
    const { data: refs, error: errRefs } = await supabase
      .from('presupuestos')
      .select('id')
      .in('rango_id', tramoIds)
      .limit(1)

    if (refs && refs.length > 0) {
      // PROTECCIÓN DE BASE DE DATOS: No se borran filas para no romper el historial
      await supabase
        .from('rangos_precio')
        .update({ activo: false })
        .eq('nombre', listaNombre)

      return NextResponse.json({
        success: true,
        protegido: true,
        message: 'La lista no se eliminó físicamente porque tiene presupuestos asociados en el historial. Se desactivó de forma segura.',
      })
    }

    // 3. Si no tiene ninguna referencia en presupuestos, se puede eliminar de forma segura
    const { error: errDel } = await supabase
      .from('rangos_precio')
      .delete()
      .eq('nombre', listaNombre)

    if (errDel) {
      return NextResponse.json({ error: errDel.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      protegido: false,
      message: `Lista "${listaNombre}" eliminada correctamente.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
