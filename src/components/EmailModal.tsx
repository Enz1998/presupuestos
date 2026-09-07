'use client'
import { useState, useEffect } from 'react'
import { X, Send, File as FileIcon } from 'lucide-react'
import { pptxArrayBufferToPdf } from '@/lib/pptx-to-pdf-client'

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  presupuestoId: string | null
  empresa: string
}

export default function EmailModal({ isOpen, onClose, presupuestoId, empresa }: EmailModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState(`Presupuesto Naaloo - ${empresa}`)
  const [body, setBody] = useState(`Hola,\n\nAdjunto enviamos la propuesta comercial para ${empresa}.\n\nSaludos,\nEl equipo de Naaloo`)
  const [format, setFormat] = useState('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Update subject and body if empresa changes
  useEffect(() => {
    setSubject(`Presupuesto Naaloo - ${empresa}`)
    setBody(`Hola,\n\nAdjunto enviamos la propuesta comercial para ${empresa}.\n\nSaludos,\nEl equipo de Naaloo`)
  }, [empresa])

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!presupuestoId) return
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      let pdfBase64: string | undefined
      if (format === 'pdf') {
        const pptxRes = await fetch(`/api/download/${presupuestoId}?t=${Date.now()}`, { cache: 'no-store' })
        if (!pptxRes.ok) throw new Error('No se pudo generar la propuesta')
        const pptxBuf = await pptxRes.arrayBuffer()
        const pdfBytes = await pptxArrayBufferToPdf(pptxBuf)
        pdfBase64 = uint8ToBase64(pdfBytes)
      }

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: presupuestoId, to, subject, body, format, pdfBase64 }),
      })

      const data = await res.json()
      if (!res.ok) {
        const msg = data.details ? `${data.error} (${data.details})` : data.error
        throw new Error(msg || 'Error al enviar el correo')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setTo('')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadein">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--naaloo-slate-200)]">
          <h2 className="text-lg font-bold text-[var(--naaloo-slate-800)] flex items-center gap-2">
            <Send size={18} /> Enviar Presupuesto
          </h2>
          <button onClick={onClose} className="p-1 text-[var(--naaloo-slate-400)] hover:text-[var(--naaloo-slate-800)] rounded-md hover:bg-[var(--naaloo-slate-100)] transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSend} className="p-4 flex flex-col gap-4">
          {success && (
            <div className="alert alert-success py-2 text-[13px]">
              <span className="mr-2">✓</span> Correo enviado con éxito
            </div>
          )}
          {error && (
            <div className="alert alert-error py-2 text-[13px]">
              <span className="mr-2">⚠</span> {error}
            </div>
          )}

          <div>
            <label className="input-label text-[12px] mb-1 font-semibold">Destinatario (Email)</label>
            <input
              type="email"
              required
              className="input py-2"
              placeholder="cliente@empresa.com"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label text-[12px] mb-1 font-semibold">Asunto</label>
            <input
              type="text"
              required
              className="input py-2"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label text-[12px] mb-1 font-semibold">Cuerpo del correo</label>
            <textarea
              required
              rows={5}
              className="input py-2 shadow-sm resize-none custom-scrollbar"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label text-[12px] mb-1 font-semibold">Formato del Adjunto</label>
            <div className="flex gap-6 mt-1.5">
              <label className="flex items-center gap-2 text-[13px] text-[var(--naaloo-slate-600)] cursor-pointer hover:text-[var(--naaloo-text)]">
                <input type="radio" value="pdf" checked={format === 'pdf'} onChange={e => setFormat(e.target.value)} className="w-4 h-4 accent-[var(--naaloo-blue)]" />
                <FileIcon size={16} /> Documento PDF
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[var(--naaloo-slate-600)] cursor-pointer hover:text-[var(--naaloo-text)]">
                <input type="radio" value="pptx" checked={format === 'pptx'} onChange={e => setFormat(e.target.value)} className="w-4 h-4 accent-[var(--naaloo-blue)]" />
                <FileIcon size={16} /> Presentación PPTX
              </label>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-[var(--naaloo-slate-100)]">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 text-[13px] text-[var(--naaloo-slate-500)]">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary py-2 px-5 text-[13px] min-w-[120px]">
              {loading ? <div className="spinner w-4 h-4" /> : <><Send size={14} /> Enviar Correo</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
