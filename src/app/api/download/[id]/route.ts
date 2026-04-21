import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generatePptx } from '@/lib/pptx-generator'
import { format } from 'date-fns'
import * as os from 'os'
import * as fs from 'fs/promises'
import * as path from 'path'
const ConvertApi = require('convertapi')

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const exportFormat = searchParams.get('format') || 'pptx'

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

    let filename = `Presupuesto_Naaloo_${p.nombre_empresa.trim().replace(/[^a-z0-9]/gi, '_')}.pptx`
    let contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    let finalBuffer = pptxBuffer

    // 4. Si se pide PDF, usar archivos temporales para ConvertAPI
    if (exportFormat === 'pdf') {
      const ca = ConvertApi(process.env.CONVERTAPI_SECRET || '')
      const tempId = crypto.randomUUID()
      const tempPptxPath = path.join(os.tmpdir(), `${tempId}.pptx`)

      try {
        // Escribir Buffer a archivo temporal
        await fs.writeFile(tempPptxPath, pptxBuffer)

        // Convertir pasándole la ruta del archivo
        const result = await ca.convert('pdf', {
          File: tempPptxPath
        }, 'pptx')
        
        const file = result.file
        // Dependiendo de convertapi, a veces result.file.read() da error si no es stream. 
        // Por seguridad, guardamos el resultado a un archivo temporal PDF también y lo leemos, o usamos read() si está soportado.
        // Pero intentemos usar un guardado local para evitar bugs y fallos de streaming:
        const tempPdfPath = path.join(os.tmpdir(), `${tempId}.pdf`)
        await result.saveFiles(tempPdfPath)
        
        // Leer el PDF
        const pdfFileBuffer = await fs.readFile(tempPdfPath)
        finalBuffer = pdfFileBuffer
        
        filename = filename.replace('.pptx', '.pdf')
        contentType = 'application/pdf'

        // Limpiar archivos temporales (no esperamos a que termine para seguir)
        fs.unlink(tempPptxPath).catch(console.error)
        fs.unlink(tempPdfPath).catch(console.error)
      } catch (convErr: any) {
        console.error('Error en conversion ConvertAPI:', convErr)
        // Limpiar en caso de error
        fs.unlink(tempPptxPath).catch(() => {})
        
        const errorMessage = convErr?.message || 'Error desconocido'
        return NextResponse.json({ 
          error: 'Error al convertir a PDF', 
          details: errorMessage 
        }, { status: 500 })
      }
    }

    // 5. Retornar el archivo directamente
    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': finalBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (err) {
    console.error('Error en descarga:', err)
    return NextResponse.json({ error: 'Error al generar el archivo' }, { status: 500 })
  }
}
