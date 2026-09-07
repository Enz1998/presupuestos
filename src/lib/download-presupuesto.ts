import { downloadPresupuestoDeckPdf } from '@/lib/presupuesto-deck-pdf'
import type { Presupuesto } from '@/lib/supabase'

export async function downloadPresupuestoFile(
  id: string,
  format: 'pptx' | 'pdf'
): Promise<'downloaded'> {
  if (format === 'pdf') {
    const pRes = await fetch(`/api/generar/${id}`, { cache: 'no-store' })
    if (!pRes.ok) throw new Error('No se encontró el presupuesto')
    const presupuesto = (await pRes.json()) as Presupuesto
    await downloadPresupuestoDeckPdf(presupuesto)
    return 'downloaded'
  }

  const url = `/api/download/${id}?t=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    let message = 'Error al descargar'
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const buffer = await res.arrayBuffer()
  const disposition = res.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
  const pptxName = filenameMatch ? filenameMatch[1] : 'presupuesto.pptx'

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = pptxName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
  return 'downloaded'
}
