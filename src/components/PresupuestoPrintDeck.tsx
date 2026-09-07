'use client'

import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import type { Presupuesto } from '@/lib/supabase'

const SLIDE_COUNT = 13
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

function isElectronBrowser() {
  return /Electron/i.test(navigator.userAgent)
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

function paintSlide(img: HTMLImageElement, n: number, p: Presupuesto): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return img.src
  ctx.drawImage(img, 0, 0)
  const w = canvas.width
  const h = canvas.height

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

  return canvas.toDataURL('image/jpeg', 0.92)
}

export default function PresupuestoPrintDeck({ presupuesto }: { presupuesto: Presupuesto }) {
  const [slides, setSlides] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const electron = typeof navigator !== 'undefined' && isElectronBrowser()

  useEffect(() => {
    document.body.classList.add('pptx-print-mode')
    let cancelled = false

    ;(async () => {
      const urls: string[] = []
      for (let n = 1; n <= SLIDE_COUNT; n++) {
        const img = await loadImage(`/print-slides/${String(n).padStart(2, '0')}.png?v=3`)
        urls.push(n === 1 || n === 6 ? paintSlide(img, n, presupuesto) : img.src)
      }
      if (!cancelled) {
        setSlides(urls)
        setReady(true)
      }
    })()

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isElectronBrowser()) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        alert('El diálogo de imprimir cierra Cursor. Abrí esta URL en Chrome: Imprimir → Guardar como PDF.')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelled = true
      document.body.classList.remove('pptx-print-mode')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [presupuesto])

  const handlePrint = () => {
    if (isElectronBrowser()) {
      alert('Abrí esta página en Chrome o Safari. Ahí: Imprimir → Guardar como PDF.')
      return
    }
    window.print()
  }

  return (
    <div className="print-deck">
      <div className="pptx-print-toolbar sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Vista para imprimir</p>
          <p className="text-xs text-slate-500">
            {electron
              ? 'Abrí esta URL en Chrome. Imprimir → Guardar como PDF.'
              : 'En Chrome, elegí destino Guardar como PDF. Van las 13 diapositivas.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          disabled={!ready}
          className="btn-primary py-2 px-4 text-[13px] disabled:opacity-50"
        >
          <Printer size={16} />
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="print-deck-pages">
        {(slides.length ? slides : Array.from({ length: SLIDE_COUNT }, () => '')).map((src, i) => (
          <section key={i} className="print-slide">
            {src ? <img src={src} alt={`Diapositiva ${i + 1}`} /> : null}
          </section>
        ))}
      </div>
    </div>
  )
}
