import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generatePptx } from '@/lib/pptx-generator'
import { format } from 'date-fns'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const bodyReq = await req.json()
    const { id, to, subject, body, format: exportFormat = 'pdf', pdfBase64 } = bodyReq

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

    const baseName = `Presupuesto_Naaloo_${p.nombre_empresa.trim().replace(/[^a-z0-9]/gi, '_')}`

    let filename = `${baseName}.pptx`
    let contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    let finalBuffer: Buffer

    if (exportFormat === 'pdf') {
      if (typeof pdfBase64 !== 'string' || !pdfBase64) {
        return NextResponse.json({
          error: 'El PDF se genera en el navegador. Volvé a intentar el envío.',
        }, { status: 400 })
      }
      finalBuffer = Buffer.from(pdfBase64, 'base64')
      filename = `${baseName}.pdf`
      contentType = 'application/pdf'
    } else {
      const fechaDate = new Date(p.fecha_propuesta + 'T12:00:00')
      const fechaFormateada = format(fechaDate, 'dd/MM/yy')
      finalBuffer = await generatePptx({
        nombreEmpresa: p.nombre_empresa,
        cantidadUsuarios: p.cantidad_usuarios,
        valorLicencia: p.valor_licencia,
        descuentoPorcentaje: p.descuento_porcentaje,
        descuentoMeses: p.descuento_meses,
        recursoExcedente: p.recurso_excedente,
        valorTotalMensual: p.valor_total_mensual,
        fechaPropuesta: fechaFormateada,
      })
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
