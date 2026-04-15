import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generatePptx } from '@/lib/pptx-generator'
import { format } from 'date-fns'
import { convertPptxToPdf } from '@/lib/converter'
import path from 'path'
import fs from 'fs'
import os from 'os'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tempDir = os.tmpdir()
  const tempInput = path.join(tempDir, `presupuesto_${Date.now()}.pptx`)
  const tempOutput = path.join(tempDir, `presupuesto_${Date.now()}.pdf`)

  try {
    const { id } = await params

    // 1. Obtener datos
    const { data: p, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const fechaDate = new Date(p.fecha_propuesta + 'T12:00:00')
    const fechaFormateada = format(fechaDate, 'dd/MM/yy')

    // 2. Generar PPTX en memoria
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

    // 3. Escribir temporal para convertir
    fs.writeFileSync(tempInput, pptxBuffer)

    // 4. Convertir a PDF
    await convertPptxToPdf(tempInput, tempOutput)

    // 5. Leer el PDF resultante
    const pdfBuffer = fs.readFileSync(tempOutput)

    const filename = `Presupuesto Naaloo - ${p.nombre_empresa.trim().replace(/[^a-z0-9]/gi, ' ')}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (err) {
    console.error('Error en conversión:', err)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  } finally {
    // Limpieza de archivos temporales
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput)
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput)
    } catch (e) { console.error('Error cleaning temp files', e) }
  }
}
