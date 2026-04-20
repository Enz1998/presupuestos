'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { RangoPrecio, findRangoForUsuarios, roundToNearest10 } from '@/lib/supabase'
import { Building2, Key, BarChart3, FileText, Download, Mail } from 'lucide-react'
import EmailModal from '@/components/EmailModal'

import useSWR from 'swr'

// Helper for display formatting
function formatDisplay(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''
  return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Format for input: supports typing.
function formatCurrencyInput(val: string): string {
  // Remove all non-digits
  const clean = val.replace(/\D/g, '')
  if (!clean) return ''
  // Assume last 2 digits are cents
  const num = parseInt(clean) / 100
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCurrencyInput(val: string): number {
  if (!val) return 0
  // AR uses . for thousands and , for decimals. 
  // We need to remove . and replace , with . for parseFloat
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
}

function getTodayISO(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function HomePage() {
  const { data: rangosData, isLoading: loadingRangos } = useSWR('/api/rangos', fetcher);
  const rangos: RangoPrecio[] = Array.isArray(rangosData) ? rangosData : [];

  const rangeRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Formulario
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [fecha, setFecha] = useState(getTodayISO())
  const [cantidadUsuarios, setCantidadUsuarios] = useState<number | string>('')
  const [valorLicenciaDisplay, setValorLicenciaDisplay] = useState('') 
  const [valorLicenciaRaw, setValorLicenciaRaw] = useState<number>(0)
  const [descuentoPct, setDescuentoPct] = useState<number | string>('')
  const [descuentoMeses, setDescuentoMeses] = useState<number | string>('')

  // Calculados
  const [rangoActivo, setRangoActivo] = useState<RangoPrecio | null>(null)
  const [recursoExcedente, setRecursoExcedente] = useState<number>(0)
  const [valorTotal, setValorTotal] = useState<number>(0)

  // UI state
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

  // Auto-selection when usuarios change
  useEffect(() => {
    const usuarios = Number(cantidadUsuarios) || 0
    if (rangos.length === 0 || !usuarios) return
    const rango = findRangoForUsuarios(rangos, usuarios)
    if (rango) {
      setRangoActivo(rango)
      const calculatedLicencia = Math.round(usuarios * rango.valor_unitario)
      setValorLicenciaRaw(calculatedLicencia)
      // Format with decimals for the input
      setValorLicenciaDisplay(calculatedLicencia.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    } else {
      setRangoActivo(null)
    }
  }, [cantidadUsuarios, rangos])

  // Scroll to active range (centered)
  useEffect(() => {
    if (rangoActivo && rangeRefs.current[rangoActivo.id]) {
      const row = rangeRefs.current[rangoActivo.id];
      const container = tableContainerRef.current;
      if (row && container) {
        // Manual centering within the overflow container
        const rowTop = row.offsetTop;
        const rowHeight = row.offsetHeight;
        const containerHeight = container.offsetHeight;
        container.scrollTo({
          top: rowTop - (containerHeight / 2) + (rowHeight / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [rangoActivo])

  // Recalculate totals
  useEffect(() => {
    const usuarios = Number(cantidadUsuarios) || 0
    const pct = Number(descuentoPct) || 0
    
    const excedente = rangoActivo
      ? rangoActivo.valor_unitario
      : (usuarios > 0 && valorLicenciaRaw > 0
          ? roundToNearest10(valorLicenciaRaw / usuarios)
          : 0)
    const total = Math.round(valorLicenciaRaw * (1 - pct / 100))
    setRecursoExcedente(excedente)
    setValorTotal(total)
  }, [valorLicenciaRaw, cantidadUsuarios, descuentoPct, rangoActivo])

  const handleValorLicenciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setValorLicenciaDisplay(formatted)
    setValorLicenciaRaw(parseCurrencyInput(formatted))
    setRangoActivo(null) // manual override
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!nombreEmpresa.trim()) { setError('Por favor, ingresá el nombre de la empresa.'); return }
    if (Number(cantidadUsuarios) < 1) { setError('La cantidad de usuarios debe ser mayor a 0.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_empresa: nombreEmpresa.trim(),
          cantidad_usuarios: Number(cantidadUsuarios),
          valor_licencia: valorLicenciaRaw,
          descuento_porcentaje: Number(descuentoPct) || 0,
          descuento_meses: Number(descuentoMeses) || 1,
          fecha_propuesta: fecha,
          rango_id: rangoActivo?.id ?? null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al generar el presupuesto')
      }

      const presupuestoId = res.headers.get('X-Presupuesto-Id');
      if (presupuestoId) {
        setGeneratedId(presupuestoId)
      } else {
        const data = await res.json();
        setGeneratedId(data.id)
      }
      setSuccess(true)
      // No redirect anymore, we show download buttons
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [nombreEmpresa, cantidadUsuarios, valorLicenciaRaw, descuentoPct, descuentoMeses, fecha, rangoActivo])

  return (
    <div className="flex flex-col h-full md:max-h-[85vh]">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-[var(--naaloo-slate-800)] mb-0.5 tracking-tight">
          Nueva Propuesta Comercial
        </h1>
        <p className="text-[var(--naaloo-slate-500)] text-[13px]">
          Configure client details, licensing, and pricing tiers below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-stretch flex-1 min-h-0">
        
        {/* LEFT COLUMN: Data Entry */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Client Data Module */}
          <div className="panel-soft p-4 flex-shrink-0">
            <h2 className="section-title text-[14px] mb-3">
              <Building2 size={16} className="text-[var(--naaloo-slate-500)]" />
              Client Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[12px]" htmlFor="nombre_empresa">Nombre de Empresa</label>
                <input
                  id="nombre_empresa"
                  type="text"
                  className="input shadow-sm py-1.5"
                  placeholder="Ej. Acme Corp"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="input-label text-[12px]" htmlFor="fecha_propuesta">Fecha de la Propuesta</label>
                <input
                  id="fecha_propuesta"
                  type="date"
                  className="input shadow-sm py-1.5"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* License Section Module */}
          <div className="panel-soft p-4 flex-shrink-0">
            <h2 className="section-title text-[14px] mb-3">
              <Key size={16} className="text-[var(--naaloo-slate-500)]" />
              License Section
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[12px]" htmlFor="cantidad_usuarios">Cantidad de Usuarios</label>
                <input
                  id="cantidad_usuarios"
                  type="number"
                  className="input shadow-sm py-1.5"
                  min={1}
                  value={cantidadUsuarios}
                  onChange={(e) => setCantidadUsuarios(parseInt(e.target.value) || '')}
                />
              </div>
              <div>
                <label className="input-label text-[12px]" htmlFor="valor_licencia">Valor Licencia Mensual</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--naaloo-slate-500)] font-medium">$</span>
                  <input
                    id="valor_licencia"
                    type="text"
                    className="input shadow-sm !pl-10 py-1.5"
                    value={valorLicenciaDisplay}
                    onChange={handleValorLicenciaChange}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label className="input-label text-[12px]" htmlFor="descuento_pct">Descuento (%)</label>
                <div className="relative">
                  <input
                    id="descuento_pct"
                    type="number"
                    className="input shadow-sm pr-7 py-1.5"
                    min={0}
                    max={100}
                    value={descuentoPct}
                    onChange={(e) => setDescuentoPct(parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--naaloo-slate-500)] text-[12px]">%</span>
                </div>
              </div>
              <div>
                <label className="input-label text-[12px]" htmlFor="descuento_meses">Meses con Descuento</label>
                <input
                  id="descuento_meses"
                  type="number"
                  className="input shadow-sm py-1.5"
                  min={1}
                  value={descuentoMeses}
                  onChange={(e) => setDescuentoMeses(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Refs */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Summary Card (Appears before Rangos on mobile) */}
          <div className="card p-4 flex-shrink-0 order-1 lg:order-2">
            <h2 className="section-title mb-4 text-[14px]">Summary</h2>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[#64748B] font-medium">Recurso Excedente</span>
              <span className="text-[13px] text-[#1E293B] font-semibold">${formatDisplay(recursoExcedente)}</span>
            </div>
            <div className="bg-[#F1F5F9] rounded-lg p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[#1E293B] font-semibold">Total Mensual</p>
                <p className="text-[10px] text-[#64748B]">con Descuento</p>
              </div>
              <div className="text-[20px] font-bold text-[#1E293B] tracking-tight">
                ${formatDisplay(valorTotal)}
              </div>
            </div>
            {error && <div className="alert alert-error mb-3 py-1.5 text-[11px]"><span>⚠</span> {error}</div>}
            
            {!success ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#475569] hover:bg-[#334155] text-white font-medium text-[14px] py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors flex-shrink-0 mt-auto"
              >
                {loading ? <><div className="spinner w-3 h-3" /> Generando...</> : <><FileText size={16} /> Generar Presupuesto</>}
              </button>
            ) : (
              <div className="flex flex-col gap-2 mt-auto animate-fadein">
                <div className="alert alert-success py-2 text-[12px] mb-1">
                  <span>✓</span> Presupuesto generado con éxito
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(true)}
                    className="flex-1 bg-[#00B2FF] hover:bg-[#008FCC] text-white font-medium text-[13px] py-2 rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Mail size={14} /> Correo
                  </button>
                  <a
                    href={`/api/download/${generatedId}`}
                    className="flex-1 bg-[#475569] hover:bg-[#334155] text-white font-medium text-[13px] py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download size={14} /> PPTX
                  </a>
                  <a
                    href={`/api/download/${generatedId}?format=pdf`}
                    className="flex-1 bg-[var(--naaloo-slate-100)] hover:bg-[var(--naaloo-slate-200)] text-[var(--naaloo-slate-700)] font-medium text-[13px] py-2 rounded-md flex items-center justify-center gap-2 transition-colors border border-[var(--naaloo-slate-200)]"
                  >
                    <FileText size={14} /> PDF
                  </a>
                </div>
                <button 
                  onClick={() => { setSuccess(false); setGeneratedId(null); }}
                  className="text-[11px] text-[var(--naaloo-slate-400)] hover:text-[var(--naaloo-slate-600)] transition-colors mt-1"
                >
                  Generar otro
                </button>
              </div>
            )}
          </div>

          {/* Price Ranges Card (Appears after Summary on mobile) */}
          <div className="card p-4 flex flex-col min-h-[300px] lg:min-h-0 order-2 lg:order-1 flex-1">
            <h2 className="section-title text-[14px] mb-2">
              <BarChart3 size={16} className="text-[var(--naaloo-slate-500)]" />
              Price Ranges
            </h2>
            <div 
              ref={tableContainerRef}
              className="mt-2 -mx-4 -mb-4 overflow-y-auto custom-scrollbar flex-1"
            >
              {loadingRangos ? (
                <div className="py-4 text-center text-[var(--naaloo-slate-500)] text-xs">Cargando rangos...</div>
              ) : (
                <table className="w-full text-[12px] border-separate border-spacing-0">
                  <thead className="bg-[#F1F5F9] sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-4 font-medium text-[var(--naaloo-slate-500)] text-left bg-[#F1F5F9] border-b border-[var(--naaloo-slate-200)]">Rango</th>
                      <th className="py-2 px-4 font-medium text-[var(--naaloo-slate-500)] text-right bg-[#F1F5F9] border-b border-[var(--naaloo-slate-200)]">P.U.</th>
                      <th className="py-2 px-4 font-medium text-[var(--naaloo-slate-500)] text-right bg-[#F1F5F9] border-b border-[var(--naaloo-slate-200)]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rangos.filter(r => r.activo).map((r, idx) => (
                      <tr 
                        key={r.id} 
                        ref={el => { rangeRefs.current[r.id] = el; }}
                        className={`cursor-pointer transition-colors ${rangoActivo?.id === r.id ? 'bg-[#F1F5F9]' : 'hover:bg-slate-50'} ${idx !== 0 ? 'border-t border-[#F1F5F9]' : ''}`}
                        onClick={() => {
                          setRangoActivo(r)
                          const calculatedLicencia = Math.round(Number(cantidadUsuarios || 0) * r.valor_unitario)
                          setValorLicenciaRaw(calculatedLicencia)
                          setValorLicenciaDisplay(calculatedLicencia.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                        }}
                      >
                        <td className={`py-2 px-4 border-b border-slate-50 ${rangoActivo?.id === r.id ? 'font-bold text-[#1E293B]' : 'text-[#475569]'}`}>
                          {r.rango_min}-{r.rango_max ?? '∞'}
                        </td>
                        <td className="py-2 px-4 text-right text-[#475569] font-mono border-b border-slate-50">${formatDisplay(Number(r.valor_unitario))}</td>
                        <td className="py-2 px-4 text-right text-[#64748B] font-mono border-b border-slate-50">${formatDisplay(Math.round(Number(cantidadUsuarios || 0) * Number(r.valor_unitario)))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </form>

      <EmailModal 
        isOpen={emailModalOpen} 
        onClose={() => setEmailModalOpen(false)} 
        presupuestoId={generatedId} 
        empresa={nombreEmpresa} 
      />
    </div>
  )
}
