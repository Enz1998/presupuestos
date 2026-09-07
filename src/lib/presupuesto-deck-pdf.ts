import { PDFDocument } from 'pdf-lib'
import type { Presupuesto } from '@/lib/supabase'
import { presupuestoPdfFilename } from '@/lib/presupuesto-pdf-client'
import { buildSlideDataUrls } from '@/lib/presupuesto-slides'

export async function downloadPresupuestoDeckPdf(p: Presupuesto): Promise<void> {
  const urls = await buildSlideDataUrls(p)
  const pdf = await PDFDocument.create()

  for (const src of urls) {
    const bytes = new Uint8Array(await fetch(src).then((res) => res.arrayBuffer()))
    const image = src.startsWith('data:image/jpeg')
      ? await pdf.embedJpg(bytes)
      : await pdf.embedPng(bytes)
    const page = pdf.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }

  const out = await pdf.save()
  const blob = new Blob([Uint8Array.from(out)], { type: 'application/pdf' })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = presupuestoPdfFilename(p)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}
