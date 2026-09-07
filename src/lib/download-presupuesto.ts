export function openPresupuestoPrint(id: string) {
  const opened = window.open(`/presupuesto/${id}/imprimir`, '_blank', 'noopener,noreferrer')
  if (!opened) {
    throw new Error('Permití ventanas emergentes para abrir la vista de impresión')
  }
}

export async function downloadPresupuestoFile(
  id: string,
  format: 'pptx' | 'pdf'
): Promise<'downloaded' | 'print'> {
  if (format === 'pdf') {
    openPresupuestoPrint(id)
    return 'print'
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
  const filename = filenameMatch ? filenameMatch[1] : 'presupuesto.pptx'
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
  return 'downloaded'
}
