import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PATCH /api/generar/[id] – editar numero_acuerdo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { numero_acuerdo } = await req.json()
    const n = parseInt(numero_acuerdo)
    const supabase = await createClient()

    // 1. Actualizar el registro
    const { data, error } = await supabase
      .from('presupuestos')
      .update({ numero_acuerdo: n })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 2. Sincronizar la secuencia global para que el próximo sea n + 1
    // Nota: Esto requiere una función RPC en Supabase llamada 'set_agreement_sequence'
    // La crearemos en el schema. Por ahora intentamos continuar.
    await supabase.rpc('set_agreement_sequence', { next_val: n + 1 })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE /api/generar/[id] – eliminar presupuesto
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
