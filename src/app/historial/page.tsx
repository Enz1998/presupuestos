'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Presupuesto } from '@/lib/supabase'
import { Search, Download, Trash2, FileText, CheckSquare, Square } from 'lucide-react'

function formatPeso(v: number) {
  return Math.round(v).toLocaleString('es-AR').replace(/,/g, '.')
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function HistorialPage() {
  const [q, setQ] = useState('')
  const { data: presupuestosData, isLoading: loading, mutate } = useSWR(`/api/generar?q=${q}`, fetcher);
  const presupuestos: Presupuesto[] = Array.isArray(presupuestosData) ? presupuestosData : [];

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const loadHistorial = async (query = '') => {
    // SWR already updates when `q` state changes, but we can call mutate to force refresh if needed
    setQ(query)
    await mutate()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return
    try {
      await fetch(`/api/generar/${id}`, { method: 'DELETE' })
      await mutate()
    } catch (e) { alert('Error al eliminar') }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.length} presupuestos seleccionados?`)) return
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/generar/${id}`, { method: 'DELETE' })))
      await mutate()
      setSelectedIds([])
    } catch (e) { alert('Error al eliminar algunos registros') }
  }

  const handleEditAcuerdo = async (id: string, nuevoNumero: string) => {
    try {
      await fetch(`/api/generar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_acuerdo: nuevoNumero })
      })
    } catch (e) { console.error(e) }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === presupuestos.length && presupuestos.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(presupuestos.map(p => p.id))
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full md:max-h-[90vh]">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--naaloo-slate-800)] tracking-tight">
            Historial de Presupuestos
          </h1>
          <p className="text-[var(--naaloo-slate-500)] text-[13px] mt-0.5">
            Registro de propuestas emitidas. Podés descargar o eliminar registros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="btn-danger py-2 px-4 shadow-sm h-10 animate-fadein"
            >
              <Trash2 size={16} />
              <span className="hidden md:inline">Eliminar ({selectedIds.length})</span>
            </button>
          )}
          <div className="relative group w-full md:w-[280px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--naaloo-slate-400)] group-focus-within:text-[var(--naaloo-slate-500)] transition-colors" />
            <input 
              type="text" 
              className="input pl-10 py-2 shadow-sm h-10" 
              placeholder="Buscar por empresa..." 
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadHistorial(q)}
            />
          </div>
          <button 
            onClick={() => loadHistorial(q)} 
            className="btn-primary py-2 px-5 h-10 shadow-sm"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="card p-0 overflow-hidden flex flex-col flex-1 min-h-0 shadow-md">
        <div className="overflow-auto custom-scrollbar flex-1 bg-white">
          <table className="w-full text-[13px] border-separate border-spacing-0">
            <thead className="bg-[var(--naaloo-slate-100)] sticky top-0 z-20">
              <tr>
                <th className="w-12 px-4 py-3 text-center border-b border-[var(--naaloo-slate-200)]">
                  <button onClick={toggleAll} className="text-[var(--naaloo-slate-400)] hover:text-[var(--naaloo-slate-600)] transition-colors">
                    {selectedIds.length === presupuestos.length && presupuestos.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-left border-b border-[var(--naaloo-slate-200)] w-32">Acuerdo N°</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-left border-b border-[var(--naaloo-slate-200)] w-20">Ver.</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-left border-b border-[var(--naaloo-slate-200)]">Fecha</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-left border-b border-[var(--naaloo-slate-200)]">Empresa</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-right border-b border-[var(--naaloo-slate-200)]">Usuarios</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-right border-b border-[var(--naaloo-slate-200)]">Licencia</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-center border-b border-[var(--naaloo-slate-200)]">Descuento</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-right border-b border-[var(--naaloo-slate-200)]">Total</th>
                <th className="px-4 py-3 font-semibold text-[var(--naaloo-slate-500)] text-right border-b border-[var(--naaloo-slate-200)] w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--naaloo-slate-100)]">
              {loading ? (
                <tr><td colSpan={10} className="py-20 text-center text-[var(--naaloo-slate-400)]">Cargando historial de propuestas...</td></tr>
              ) : presupuestos.length === 0 ? (
                <tr><td colSpan={10} className="py-20 text-center text-[var(--naaloo-slate-400)]">No se encontraron registros.</td></tr>
              ) : (
                presupuestos.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--naaloo-slate-50)] transition-colors group">
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => toggleSelect(p.id)}
                        className={`transition-colors ${selectedIds.includes(p.id) ? 'text-[var(--naaloo-slate-800)]' : 'text-[var(--naaloo-slate-300)]'}`}
                      >
                        {selectedIds.includes(p.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        className="input !py-1 !px-2 !text-[12px] !border-transparent hover:!border-[var(--naaloo-slate-200)] focus:!border-[var(--naaloo-slate-400)] bg-[var(--naaloo-slate-50)] font-semibold w-24 transition-all"
                        defaultValue={p.numero_acuerdo}
                        onBlur={(e) => handleEditAcuerdo(p.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--naaloo-slate-100)] text-[var(--naaloo-slate-600)]">V{p.version}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--naaloo-slate-600)] font-mono text-[12px]">{p.fecha_propuesta}</td>
                    <td className="px-4 py-3 font-bold text-[var(--naaloo-slate-800)]">{p.nombre_empresa}</td>
                    <td className="px-4 py-3 text-right font-medium">{p.cantidad_usuarios}</td>
                    <td className="px-4 py-3 text-right font-mono text-[12px]">${formatPeso(p.valor_licencia)}</td>
                    <td className="px-4 py-3 text-center">
                      {p.descuento_porcentaje > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[12px] text-[var(--naaloo-warning)] font-bold">{p.descuento_porcentaje}%</span>
                          <span className="text-[10px] text-[var(--naaloo-slate-400)] font-medium">({p.descuento_meses}m)</span>
                        </div>
                      ) : <span className="text-[var(--naaloo-slate-300)]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--naaloo-slate-800)] text-[14px]">
                      ${formatPeso(p.valor_total_mensual)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={`/api/download/${p.id}`} 
                          title="Descargar PPTX"
                          className="p-1.5 text-[var(--naaloo-slate-500)] hover:text-[var(--naaloo-slate-800)] hover:bg-[var(--naaloo-slate-200)] rounded transition-all"
                        >
                          <Download size={16} />
                        </a>
                        <a 
                          href={`/api/download/${p.id}?format=pdf`} 
                          title="Descargar PDF"
                          className="p-1.5 text-[var(--naaloo-slate-500)] hover:text-[var(--naaloo-slate-800)] hover:bg-[var(--naaloo-slate-200)] rounded transition-all"
                        >
                          <FileText size={16} />
                        </a>
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          title="Eliminar"
                          className="p-1.5 text-[var(--naaloo-error)] hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
