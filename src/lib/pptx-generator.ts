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
  const templatePath = path.join(process.cwd(), 'public', 'template.pptx')
  const templateBuffer = readFileSync(templatePath)
  const zip = await JSZip.loadAsync(templateBuffer)

  // ── Slide 1: reemplazar nombre de empresa ─────────────────────────────
  // XML: <a:t>Luminitec</a:t>...<a:t> SRL</a:t>
  // Strategy: reemplazar el run "Luminitec" con el nombre completo y vaciar " SRL"
  const slide1 = zip.file('ppt/slides/slide1.xml')
  if (slide1) {
    let xml1 = await slide1.async('string')
    xml1 = xml1.replace(
      /<a:t>Luminitec<\/a:t>/,
      `<a:t>${escapeXml(data.nombreEmpresa)}</a:t>`
    )
    xml1 = xml1.replace(/<a:t> SRL<\/a:t>/, '<a:t></a:t>')
    zip.file('ppt/slides/slide1.xml', xml1)
  }

  // ── Slide 6: reemplazar datos de propuesta ────────────────────────────
  const slide6 = zip.file('ppt/slides/slide6.xml')
  if (slide6) {
    let xml6 = await slide6.async('string')

    // Fecha: la fecha está fragmentada en runs: "14" "/" "04" "/2" "6"
    // Los reemplazamos por sus equivalentes de la fecha nueva (DD/MM/YY)
    const [dd, mm, yy] = parseFecha(data.fechaPropuesta)
    const yy0 = yy.charAt(0)  // ej: "2"
    const yy1 = yy.charAt(1)  // ej: "6"

    // Run día: <a:t>14</a:t>  (solo el que está junto a "Fecha:")
    xml6 = replaceInDateParagraph(xml6, '<a:t>14</a:t>', `<a:t>${dd}</a:t>`)
    // Run mes: <a:t>04</a:t>
    xml6 = replaceInDateParagraph(xml6, '<a:t>04</a:t>', `<a:t>${mm}</a:t>`)
    // Run "/2": primeros 2 chars del año
    xml6 = replaceInDateParagraph(xml6, '<a:t>/2</a:t>', `<a:t>/${yy0}</a:t>`)
    // Run "6": último char del año (dentro del párrafo de fecha)
    xml6 = replaceLastYearDigit(xml6, yy1)

    // Cantidad de usuarios: <a:t> 212</a:t>
    xml6 = xml6.replace(
      '<a:t> 212</a:t>',
      `<a:t> ${data.cantidadUsuarios}</a:t>`
    )

    // Valor licencia: <a:t>464.280</a:t>
    xml6 = xml6.replace(
      '<a:t>464.280</a:t>',
      `<a:t>${formatPeso(data.valorLicencia)}</a:t>`
    )

    // Recurso excedente: <a:t>2.190</a:t>
    xml6 = xml6.replace(
      '<a:t>2.190</a:t>',
      `<a:t>${formatPeso(data.recursoExcedente)}</a:t>`
    )

    if (!data.descuentoPorcentaje || data.descuentoPorcentaje === 0) {
      // Si no hay descuento, borrar cartelitos, precios tachados y recuadros (147, 148, 149, 150, 151)
      xml6 = xml6.replace(
        /<p:(sp|cxnSp)>(?:(?!<\/p:(sp|cxnSp)>)[\s\S])*?<p:cNvPr[^>]*?id="(?:147|148|149|150|151)"[^>]*?>(?:(?!<\/p:(sp|cxnSp)>)[\s\S])*?<\/p:(sp|cxnSp)>/g,
        ''
      )
    } else {
      // Descuento porcentaje: <a:t>25</a:t>
      xml6 = xml6.replace(
        '<a:t>25</a:t>',
        `<a:t>${data.descuentoPorcentaje}</a:t>`
      )

      // Descuento meses: <a:t> 6</a:t>
      xml6 = xml6.replace(
        '<a:t> 6</a:t>',
        `<a:t> ${data.descuentoMeses}</a:t>`
      )
    }

    // Valor total mensual: <a:t>342.210 </a:t>
    xml6 = xml6.replace(
      '<a:t>342.210 </a:t>',
      `<a:t>${formatPeso(data.valorTotalMensual)} </a:t>`
    )

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

// ── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Parsea "15/04/26" → ["15", "04", "26"]
 */
function parseFecha(fecha: string): [string, string, string] {
  const parts = fecha.split('/')
  return [
    (parts[0] || '15').padStart(2, '0'),
    (parts[1] || '04').padStart(2, '0'),
    (parts[2] || '26'),
  ]
}

/**
 * Reemplaza un tag <a:t> dentro del párrafo que contiene "Fecha:"
 */
function replaceInDateParagraph(xml: string, search: string, replace: string): string {
  // Partimos el XML en bloques <a:p>...</a:p> y solo tocamos el que tiene "Fecha:"
  return xml.replace(/<a:p[ >][\s\S]*?<\/a:p>/g, (paragraph) => {
    if (paragraph.includes('Fecha:') && paragraph.includes(search)) {
      return paragraph.replace(search, replace)
    }
    return paragraph
  })
}

/**
 * El último dígito del año ("6" en "/26") está en un run separado.
 * Lo reemplazamos dentro del párrafo de Fecha.
 */
function replaceLastYearDigit(xml: string, newDigit: string): string {
  return xml.replace(/<a:p[ >][\s\S]*?<\/a:p>/g, (paragraph) => {
    if (!paragraph.includes('Fecha:')) return paragraph
    // Dentro del párrafo de fecha, reemplazar <a:t>6</a:t> (el dígito suelto)
    return paragraph.replace(/<a:t>6<\/a:t>/, `<a:t>${newDigit}</a:t>`)
  })
}
