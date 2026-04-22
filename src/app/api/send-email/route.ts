import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generatePptx } from '@/lib/pptx-generator'
import { format } from 'date-fns'
import * as os from 'os'
import * as fs from 'fs/promises'
import * as path from 'path'
import nodemailer from 'nodemailer'
const ConvertApi = require('convertapi')

export async function POST(req: NextRequest) {
  try {
    const bodyReq = await req.json()
    const { id, to, subject, body, format: exportFormat = 'pdf' } = bodyReq

    if (!id || !to || !subject || !body) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 })
    }

    // Configuración de SMTP (Nodemailer)
    // Valores por defecto optimizados para Gmail
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = Number(process.env.SMTP_PORT) || 465
    const smtpSecure = process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : smtpPort === 465

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Verificar conexión antes de procesar archivos (evita trabajo innecesario si las credenciales fallan)
    try {
      await transporter.verify()
    } catch (verifyErr: any) {
      console.error('Error de verificación SMTP:', verifyErr)
      return NextResponse.json(
        { error: 'No se pudo conectar al servidor de correo. Revisá las credenciales SMTP en .env.local.', details: verifyErr?.message },
        { status: 500 }
      )
    }

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
        await fs.writeFile(tempPptxPath, pptxBuffer)

        const result = await ca.convert('pdf', {
          File: tempPptxPath
        }, 'pptx')
        
        const tempPdfPath = path.join(os.tmpdir(), `${tempId}.pdf`)
        await result.saveFiles(tempPdfPath)
        
        const pdfFileBuffer = await fs.readFile(tempPdfPath)
        finalBuffer = pdfFileBuffer
        
        filename = filename.replace('.pptx', '.pdf')
        contentType = 'application/pdf'

        fs.unlink(tempPptxPath).catch(console.error)
        fs.unlink(tempPdfPath).catch(console.error)
      } catch (convErr: any) {
        console.error('Error en conversion ConvertAPI:', convErr)
        fs.unlink(tempPptxPath).catch(() => {})
        
        return NextResponse.json({ 
          error: 'Error al convertir el presupuesto a PDF', 
          details: convErr?.message || 'Error desconocido' 
        }, { status: 500 })
      }
    }

    // 5. Enviar el correo con Nodemailer (texto plano + HTML)
    const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">${body.replace(/\n/g, '<br>')}</div>`

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Presupuestos Naaloo'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: body,
      html: htmlBody,
      attachments: [
        {
          filename: filename,
          content: Buffer.from(finalBuffer),
          contentType: contentType
        }
      ]
    });

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Error en send-email:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
