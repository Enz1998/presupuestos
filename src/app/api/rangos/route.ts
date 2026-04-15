import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/rangos – listar todos los rangos ordenados por rango_min
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rangos_precio')
    .select('*')
    .order('rango_min', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// POST /api/rangos – crear nuevo rango
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nombre, rango_min, rango_max, valor_unitario } = body

  if (!nombre || rango_min == null || valor_unitario == null) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rangos_precio')
    .insert({ nombre, rango_min, rango_max: rango_max ?? null, valor_unitario })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
