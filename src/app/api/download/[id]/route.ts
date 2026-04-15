import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generatePptx } from '@/lib/pptx-generator'
import { format } from 'date-fns'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()

    // 1. Obtener los datos del presupuesto de Supabase
    const { data: p, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !p) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    // 2. Formatear fecha para el PPTX: "2026-04-15" → "15/04/26"
    const fechaDate = new Date(p.fecha_propuesta + 'T12:00:00')
    const fechaFormateada = format(fechaDate, 'dd/MM/yy')

    // 3. Generar el Buffer del PPTX
    const pptxBuffer = await generatePptx({
      nombreEmpresa: p.nombre_empresa,
      cantidadUsuarios: p.cantidad_usuarios,
      valorLicencia: p.valor_licencia,
      descuentoPorcentaje: p.descuento_porcentaje,
      descuentoMeses: p.descuento_meses,
      recursoExcedente: p.recurso_excedente,
      valorTotalMensual: p.valor_total_mensual,
      fechaPropuesta: fechaFormateada,
    })

    const filename = `Presupuesto_Naaloo_${p.nombre_empresa.trim().replace(/[^a-z0-9]/gi, '_')}.pptx`

    // 4. Retornar el archivo PPTX directamente
    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pptxBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('Error en descarga:', err)
    return NextResponse.json({ error: 'Error al generar el archivo' }, { status: 500 })
  }
}
