'use client'

import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import type { Presupuesto } from '@/lib/supabase'
import { SLIDE_COUNT, buildSlideDataUrls } from '@/lib/presupuesto-slides'

function isElectronBrowser() {
  return /Electron/i.test(navigator.userAgent)
}

export default function PresupuestoPrintDeck({ presupuesto }: { presupuesto: Presupuesto }) {
  const [slides, setSlides] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const electron = typeof navigator !== 'undefined' && isElectronBrowser()

  useEffect(() => {
    document.body.classList.add('pptx-print-mode')
    let cancelled = false

    ;(async () => {
      const urls = await buildSlideDataUrls(presupuesto)
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
