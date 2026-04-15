import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST /api/rangos/bulk-delete
export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No se enviaron IDs válidos' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('rangos_precio')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Error de Supabase en bulk-delete:', error)
      return NextResponse.json({ 
        error: error.message, 
        details: error.details 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error interno inesperado:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
