import JSZip from 'jszip'
import { readFileSync } from 'fs'
import path from 'path'
import { formatPeso } from './supabase'

export interface PptxData {
  nombreEmpresa: string       // "Luminitec SRL" – campo único, reemplaza ambos runs
  cantidadUsuarios: number    // 212
  valorLicencia: number       // 464280
  descuentoPorcentaje: number // 25
  descuentoMeses: number      // 6
  recursoExcedente: number    // 2190
  valorTotalMensual: number   // 342210
  fechaPropuesta: string      // "15/04/26"  (DD/MM/YY)
}

/**
 * Lee el template PPTX y reemplaza los valores en Slide 1 y Slide 6.
 * Retorna un Buffer con el PPTX modificado, listo para descargar.
 */
export async function generatePptx(data: PptxData): Promise<Buffer> {
  const hasDiscount = data.descuentoPorcentaje > 0
  const templateName = hasDiscount ? 'template_con_descuento.pptx' : 'template_sin_descuento.pptx'
  const templatePath = path.join(process.cwd(), 'public', templateName)
  const templateBuffer = readFileSync(templatePath)
  const zip = await JSZip.loadAsync(templateBuffer)

  // ── Slide 1: reemplazar [empresa] ─────────────────────────────
  const slide1 = zip.file('ppt/slides/slide1.xml')
  if (slide1) {
    let xml1 = await slide1.async('string')
    xml1 = xml1.replace(/\[empresa\]/g, escapeXml(data.nombreEmpresa))
    zip.file('ppt/slides/slide1.xml', xml1)
  }

  // ── Slide 6: reemplazar datos de propuesta ────────────────────────────
  const slide6 = zip.file('ppt/slides/slide6.xml')
  if (slide6) {
    let xml6 = await slide6.async('string')

    // Fecha: reemplazar "15/10/25" (placeholder en el nuevo template)
    // El template usa "15/10/25", lo reemplazamos por data.fechaPropuesta (DD/MM/YY)
    xml6 = xml6.replace(/15\/10\/25/g, data.fechaPropuesta)

    // Cantidad de usuarios: "Cantidad de usuarios: 350  "
    xml6 = xml6.replace(
      'Cantidad de usuarios: 350  ',
      `Cantidad de usuarios: ${data.cantidadUsuarios}  `
    )

    // Valor licencia: "154.000 + IVA "
    xml6 = xml6.replace(
      '154.000 + IVA ',
      `${formatPeso(data.valorLicencia)} + IVA `
    )

    // Recurso excedente: "2.400 + IVA"
    xml6 = xml6.replace(
      '2.400 + IVA',
      `${formatPeso(data.recursoExcedente)} + IVA`
    )

    if (hasDiscount) {
      // Precio con descuento: "$115.500 + IVA"
      xml6 = xml6.replace(
        '$115.500 + IVA',
        `$${formatPeso(data.valorTotalMensual)} + IVA`
      )

      // Porcentaje y meses: "Descuento de 25% por 3 meses"
      xml6 = xml6.replace(
        'Descuento de 25% por 3 meses',
        `Descuento de ${data.descuentoPorcentaje}% por ${data.descuentoMeses} meses`
      )

      // Valor total (en el cuadro inferior): "Bonificado por ahora  " (con 2 espacios)
      xml6 = xml6.replace(
        'Bonificado por ahora  ',
        `$${formatPeso(data.valorTotalMensual)} + IVA`
      )
    } else {
      // Valor total sin descuento: "Bonificado por ahora" (sin espacios extra)
      xml6 = xml6.replace(
        'Bonificado por ahora',
        `$${formatPeso(data.valorTotalMensual)} + IVA`
      )
    }

    zip.file('ppt/slides/slide6.xml', xml6)
  }

  // Generar buffer de salida
  const output = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return output
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
