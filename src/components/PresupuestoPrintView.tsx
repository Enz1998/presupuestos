'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import type { Presupuesto } from '@/lib/supabase'
import { buildPresupuestoPrintHtml } from '@/lib/presupuesto-print'
import { downloadPresupuestoClientPdf } from '@/lib/presupuesto-pdf-client'

export default function PresupuestoPrintView({
  presupuesto,
}: {
  presupuesto: Presupuesto
}) {
  const [downloading, setDownloading] = useState(false)
  const busyRef = useRef(false)

  const handleDownloadPdf = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setDownloading(true)
    try {
      await downloadPresupuestoClientPdf(presupuesto)
    } catch {
      alert('No se pudo generar el PDF')
    } finally {
      busyRef.current = false
      setDownloading(false)
    }
  }, [presupuesto])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        void handleDownloadPdf()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleDownloadPdf])

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Vista para imprimir</p>
          <p className="text-xs text-slate-500">
            Descargá el PDF. Si querés papel, abrí el archivo descargado. No uses Imprimir del navegador de Cursor: puede cerrar la app.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownloadPdf()}
          disabled={downloading}
          className="btn-primary py-2 px-4 text-[13px] disabled:opacity-60"
        >
          <Download size={16} />
          {downloading ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>
      <div
        className="p-6 md:p-10"
        dangerouslySetInnerHTML={{ __html: buildPresupuestoPrintHtml(presupuesto) }}
      />
    </div>
  )
}
