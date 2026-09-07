import { PDFDocument } from 'pdf-lib'

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            })
    )
  ).then(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
  )
}

export async function pptxArrayBufferToPdf(data: ArrayBuffer): Promise<Uint8Array> {
  const { init } = await import('pptx-preview')
  const html2canvas = (await import('html2canvas')).default

  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-14000px;top:0;z-index:-1;background:#fff;'
  document.body.appendChild(host)

  const viewer = init(host, { width: 1280, height: 720, mode: 'slide' })
  try {
    await viewer.preview(data)
    const count = viewer.slideCount
    if (!count) throw new Error('La propuesta no tiene diapositivas')

    const pdf = await PDFDocument.create()
    const pageWidth = 960
    const pageHeight = 540
    const slideRoot = viewer.htmlRender?.wrapper || viewer.wrapper || host

    for (let i = 0; i < count; i++) {
      viewer.renderSingleSlide(i)
      await waitForImages(slideRoot)
      await new Promise((resolve) => setTimeout(resolve, 80))

      const canvas = await html2canvas(slideRoot, {
        scale: 1.4,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const jpeg = canvas.toDataURL('image/jpeg', 0.88)
      const jpegBytes = await fetch(jpeg).then((res) => res.arrayBuffer())
      const image = await pdf.embedJpg(jpegBytes)
      const page = pdf.addPage([pageWidth, pageHeight])
      page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight })
    }

    return pdf.save()
  } finally {
    viewer.destroy()
    host.remove()
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

export async function downloadPptxAsPdf(pptxBuffer: ArrayBuffer, filename: string) {
  const pdfBytes = await pptxArrayBufferToPdf(pptxBuffer)
  const copy = new Uint8Array(pdfBytes)
  triggerDownload(new Blob([copy], { type: 'application/pdf' }), filename)
}

export function downloadBlob(buffer: ArrayBuffer, filename: string, mime: string) {
  triggerDownload(
    new Blob([buffer], { type: mime }),
    filename
  )
}
