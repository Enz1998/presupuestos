import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Presupuesto } from '@/lib/supabase'

function formatPeso(value: number): string {
  return Math.round(value).toLocaleString('es-AR').replace(/,/g, '.')
}

function formatFecha(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function toWinAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\u0000-\u00FF]/g, '?')
}

function drawText(
  page: PDFPage,
  text: string,
  opts: { x: number; y: number; size: number; font: PDFFont; color?: ReturnType<typeof rgb> }
) {
  page.drawText(toWinAnsi(text), {
    x: opts.x,
    y: opts.y,
    size: opts.size,
    font: opts.font,
    color: opts.color ?? rgb(0.12, 0.16, 0.23),
  })
}

export function presupuestoPdfFilename(p: Presupuesto): string {
  const empresa = p.nombre_empresa.trim().replace(/[^a-z0-9]/gi, '_')
  return `Presupuesto_Naaloo_${empresa}.pdf`
}

export async function buildPresupuestoClientPdf(p: Presupuesto): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const muted = rgb(0.39, 0.45, 0.55)
  const hasDiscount = Number(p.descuento_porcentaje) > 0

  let y = 780
  drawText(page, 'Propuesta comercial', { x: 50, y, size: 20, font: fontBold })
  y -= 18
  drawText(page, 'Naaloo  Presupuesto', { x: 50, y, size: 11, font, color: muted })

  y -= 36
  page.drawRectangle({
    x: 50,
    y: y - 58,
    width: 495,
    height: 78,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
  })

  const meta = [
    ['Empresa', p.nombre_empresa],
    ['Fecha', formatFecha(p.fecha_propuesta)],
    ['Acuerdo N', String(p.numero_acuerdo)],
    ['Version', `V${p.version}`],
  ] as const

  meta.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 66 + col * 250
    const my = y - 8 - row * 32
    drawText(page, label.toUpperCase(), { x, y: my, size: 8, font, color: muted })
    drawText(page, value, { x, y: my - 14, size: 12, font: fontBold })
  })

  y -= 110
  drawText(page, 'Concepto', { x: 50, y, size: 9, font, color: muted })
  drawText(page, 'Valor', { x: 420, y, size: 9, font, color: muted })
  y -= 8
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 0.8,
    color: rgb(0.89, 0.91, 0.94),
  })

  const rows: [string, string, boolean?][] = [
    ['Cantidad de usuarios', String(p.cantidad_usuarios)],
    ['Valor de licencia', `$${formatPeso(p.valor_licencia)} + IVA`],
    ['Recurso excedente', `$${formatPeso(p.recurso_excedente)} + IVA`],
  ]
  if (hasDiscount) {
    rows.push(['Descuento', `${p.descuento_porcentaje}% por ${p.descuento_meses} meses`])
  }
  rows.push(['Total mensual', `$${formatPeso(p.valor_total_mensual)} + IVA`, true])

  for (const [label, value, bold] of rows) {
    y -= 28
    const usedFont = bold ? fontBold : font
    const size = bold ? 13 : 11
    drawText(page, label, { x: 50, y, size, font: usedFont })
    const valueWidth = usedFont.widthOfTextAtSize(toWinAnsi(value), size)
    drawText(page, value, { x: 545 - valueWidth, y, size, font: usedFont })
    page.drawLine({
      start: { x: 50, y: y - 10 },
      end: { x: 545, y: y - 10 },
      thickness: 0.6,
      color: rgb(0.89, 0.91, 0.94),
    })
  }

  y -= 40
  drawText(page, 'Documento generado desde Presupuestos Naaloo.', {
    x: 50,
    y,
    size: 9,
    font,
    color: muted,
  })

  return pdf.save()
}

export async function downloadPresupuestoClientPdf(p: Presupuesto): Promise<void> {
  const bytes = await buildPresupuestoClientPdf(p)
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = presupuestoPdfFilename(p)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
