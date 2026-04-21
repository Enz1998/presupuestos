'use client'
import { useState, useEffect } from 'react'
import { X, Send, File as FileIcon } from 'lucide-react'

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
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: presupuestoId, to, subject, body, format }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el correo')
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
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
            <div className="alert alert-success py-2 text-[13px] bg-green-50 text-green-800 border-green-200">
              <span className="mr-2">✓</span> Correo enviado con éxito
            </div>
          )}
          {error && (
            <div className="alert alert-error py-2 text-[13px] bg-red-50 text-red-800 border-red-200">
              <span className="mr-2">⚠</span> {error}
            </div>
          )}

          <div>
            <label className="input-label text-[12px] mb-1 font-semibold text-slate-700">Destinatario (Email)</label>
            <input
              type="email"
              required
              className="input py-2 shadow-sm border border-slate-300 rounded-md w-full px-3"
              placeholder="cliente@empresa.com"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label text-[12px] mb-1 font-semibold text-slate-700">Asunto</label>
            <input
              type="text"
              required
              className="input py-2 shadow-sm border border-slate-300 rounded-md w-full px-3"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label text-[12px] mb-1 font-semibold text-slate-700">Cuerpo del correo</label>
            <textarea
              required
              rows={5}
              className="input py-2 shadow-sm resize-none custom-scrollbar border border-slate-300 rounded-md w-full px-3"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label text-[12px] mb-1 font-semibold text-slate-700">Formato del Adjunto</label>
            <div className="flex gap-6 mt-1.5">
              <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer hover:text-slate-800">
                <input type="radio" value="pdf" checked={format === 'pdf'} onChange={e => setFormat(e.target.value)} className="w-4 h-4 accent-[#00B2FF]" />
                <FileIcon size={16} /> Documento PDF
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer hover:text-slate-800">
                <input type="radio" value="pptx" checked={format === 'pptx'} onChange={e => setFormat(e.target.value)} className="w-4 h-4 accent-[#00B2FF]" />
                <FileIcon size={16} /> Presentación PPTX
              </label>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-[var(--naaloo-slate-100)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[var(--naaloo-slate-500)] hover:text-[var(--naaloo-slate-800)] hover:bg-[var(--naaloo-slate-100)] rounded-md transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary py-2 px-5 shadow-sm text-[13px] flex items-center justify-center gap-2 min-w-[120px] bg-[#00B2FF] hover:bg-[#008FCC] text-white rounded-md transition-all">
              {loading ? <div className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Enviar Correo</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
