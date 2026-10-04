import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { listaNombre } = body

    if (!listaNombre || typeof listaNombre !== 'string') {
      return NextResponse.json({ error: 'Nombre de lista inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Desactivar todos los rangos que no pertenezcan a esta lista
    const { error: errDeact } = await supabase
      .from('rangos_precio')
      .update({ activo: false })
      .neq('nombre', listaNombre)

    if (errDeact) {
      return NextResponse.json({ error: errDeact.message }, { status: 500 })
    }

    // 2. Activar todos los rangos de la lista elegida
    const { data: updated, error: errAct } = await supabase
      .from('rangos_precio')
      .update({ activo: true })
      .eq('nombre', listaNombre)
      .select()

    if (errAct) {
      return NextResponse.json({ error: errAct.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      listaNombre,
      tramosActivados: updated?.length || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
