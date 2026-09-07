import type { Presupuesto } from '@/lib/supabase'

export const SLIDE_COUNT = 13
const FONT = 'Roboto, Arial, sans-serif'

function formatPeso(value: number): string {
  return Math.round(value).toLocaleString('es-AR').replace(/,/g, '.')
}

function formatFecha(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
) {
  let size = maxSize
  const words = text.split(/\s+/)
  const layout = (s: number) => {
    ctx.font = `500 ${s}px ${FONT}`
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= maxWidth) line = next
      else {
        if (line) lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
    return lines
  }
  let lines = layout(size)
  while (size > minSize && (lines.length > 2 || lines.some((line) => ctx.measureText(line).width > maxWidth))) {
    size -= 1
    lines = layout(size)
  }
  return { lines, size }
}

function fitLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight = '500'
) {
  let size = maxSize
  ctx.font = `${weight} ${size}px ${FONT}`
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1
    ctx.font = `${weight} ${size}px ${FONT}`
  }
  return size
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rw: number,
  rh: number,
  r: number
) {
  const radius = Math.min(r, rw / 2, rh / 2)
  ctx.beginPath()
  ctx.roundRect(x, y, rw, rh, radius)
}

function paintSlide(img: HTMLImageElement, n: number, p: Presupuesto): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return img.src
  ctx.drawImage(img, 0, 0)
  const w = canvas.width
  const h = canvas.height
  const hasDiscount = Number(p.descuento_porcentaje) > 0

  if (n === 1) {
    const x = w * 0.18
    const y = h * 0.658
    const boxW = w * 0.64
    const boxH = h * 0.07
    ctx.fillStyle = 'rgb(51, 141, 238)'
    ctx.fillRect(x, y, boxW, boxH)
    const title = `Propuesta Comercial para ${p.nombre_empresa}`
    const { lines, size } = wrapText(ctx, title, boxW * 0.96, boxH * 0.42, 14)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lineH = size * 1.2
    const startY = y + boxH / 2 - ((lines.length - 1) * lineH) / 2
    lines.forEach((line, i) => {
      ctx.font = `500 ${size}px ${FONT}`
      ctx.fillText(line, x + boxW / 2, startY + i * lineH)
    })
  }

  if (n === 6) {
    const fecha = `Fecha: ${formatFecha(p.fecha_propuesta)}`
    const usuarios = `Cantidad de usuarios: ${p.cantidad_usuarios}`
    const licencia = `Valor Licencia:  $${formatPeso(p.valor_licencia)} + IVA`
    const excedente = `Recurso excedente: $${formatPeso(p.recurso_excedente)} + IVA`

    ctx.textBaseline = 'middle'

    ctx.fillStyle = '#fff'
    ctx.fillRect(w * 0.788, h * 0.074, w * 0.16, h * 0.042)
    ctx.fillStyle = '#334155'
    ctx.textAlign = 'right'
    const fechaSize = fitLine(ctx, fecha, w * 0.15, h * 0.028, 12)
    ctx.font = `500 ${fechaSize}px ${FONT}`
    ctx.fillText(fecha, w * 0.938, h * 0.095)

    ctx.fillStyle = 'rgb(242, 250, 255)'
    ctx.fillRect(w * 0.152, h * 0.398, w * 0.303, h * 0.04)
    ctx.fillStyle = '#1e3a5f'
    ctx.textAlign = 'left'
    const userSize = fitLine(ctx, usuarios, w * 0.29, h * 0.026, 12)
    ctx.font = `500 ${userSize}px ${FONT}`
    ctx.fillText(usuarios, w * 0.159, h * 0.418)

    ctx.fillStyle = 'rgb(197, 229, 252)'
    ctx.fillRect(w * 0.132, h * 0.818, w * 0.213, h * 0.034)
    ctx.fillStyle = '#163a5f'
    ctx.textAlign = 'left'

    if (hasDiscount) {
      const originalPrice = `$${formatPeso(p.valor_licencia)} + IVA`
      const discountedPrice = `$${formatPeso(p.valor_total_mensual)} + IVA`
      const pill = `Descuento de ${p.descuento_porcentaje}% por ${p.descuento_meses} meses`
      const label = 'Valor Licencia:  '

      ctx.fillStyle = 'rgb(197, 229, 252)'
      ctx.fillRect(w * 0.125, h * 0.795, w * 0.206, h * 0.054)
      ctx.fillStyle = '#152F72'
      ctx.textAlign = 'left'
      const licSize = fitLine(ctx, label + originalPrice, w * 0.195, h * 0.022, 10, '600')
      ctx.font = `600 ${licSize}px ${FONT}`
      ctx.fillText(label + originalPrice, w * 0.132, h * 0.822)
      const prefixW = ctx.measureText(label).width
      const priceW = ctx.measureText(originalPrice).width
      ctx.strokeStyle = '#3AA0F8'
      ctx.lineWidth = Math.max(2, h * 0.0032)
      ctx.beginPath()
      ctx.moveTo(w * 0.132 + prefixW, h * 0.822)
      ctx.lineTo(w * 0.132 + prefixW + priceW, h * 0.822)
      ctx.stroke()

      const pillX = w * 0.172
      const pillY = h * 0.725
      const pillW = w * 0.247
      const pillH = h * 0.046
      ctx.fillStyle = '#3AA0F8'
      roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      const pillSize = fitLine(ctx, pill, pillW * 0.92, h * 0.02, 10, '700')
      ctx.font = `700 ${pillSize}px ${FONT}`
      ctx.fillText(pill, pillX + pillW / 2, pillY + pillH * 0.54)

      const boxX = w * 0.338
      const boxY = h * 0.808
      const boxW = w * 0.118
      const boxH = h * 0.04
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#3AA0F8'
      ctx.lineWidth = Math.max(2, h * 0.0024)
      roundRect(ctx, boxX, boxY, boxW, boxH, boxH * 0.22)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#152F72'
      const discSize = fitLine(ctx, discountedPrice, boxW * 0.92, h * 0.02, 9, '600')
      ctx.font = `600 ${discSize}px ${FONT}`
      ctx.fillText(discountedPrice, boxX + boxW / 2, boxY + boxH / 2)

      ctx.fillStyle = '#163a5f'
      ctx.textAlign = 'left'
      const excSize = fitLine(ctx, excedente, w * 0.198, h * 0.016, 9, '500')
      ctx.font = `500 ${excSize}px ${FONT}`
      ctx.fillText(excedente, w * 0.305, h * 0.888)
    } else {
      const licSize = fitLine(ctx, licencia, w * 0.2, h * 0.024, 11, '600')
      ctx.font = `600 ${licSize}px ${FONT}`
      ctx.fillText(licencia, w * 0.138, h * 0.836)

      ctx.fillStyle = 'rgb(197, 229, 252)'
      ctx.fillRect(w * 0.308, h * 0.9, w * 0.182, h * 0.032)
      ctx.fillStyle = '#163a5f'
      const excSize = fitLine(ctx, excedente, w * 0.175, h * 0.02, 10, '500')
      ctx.font = `500 ${excSize}px ${FONT}`
      ctx.fillText(excedente, w * 0.314, h * 0.917)
    }
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}

export async function buildSlideDataUrls(p: Presupuesto): Promise<string[]> {
  const urls: string[] = []
  for (let n = 1; n <= SLIDE_COUNT; n++) {
    const img = await loadImage(`/print-slides/${String(n).padStart(2, '0')}.png?v=3`)
    urls.push(n === 1 || n === 6 ? paintSlide(img, n, p) : img.src)
  }
  return urls
}
