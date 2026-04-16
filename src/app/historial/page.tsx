'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Presupuesto } from '@/lib/supabase'

function formatPeso(v: number) {
  return Math.round(v).toLocaleString('es-AR').replace(/,/g, '.')
}

export default function HistorialPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  
  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const loadHistorial = async (query = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/generar?q=${query}`)
      const data = await res.json()
      setPresupuestos(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHistorial() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return
    try {
      await fetch(`/api/generar/${id}`, { method: 'DELETE' })
      setPresupuestos(prev => prev.filter(p => p.id !== id))
    } catch (e) { alert('Error al eliminar') }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.length} presupuestos seleccionados?`)) return
    try {
      // Usaremos un bucle simple para borrar (podríamos hacer una API bulk pero el DELETE /id ya está listo)
      await Promise.all(selectedIds.map(id => fetch(`/api/generar/${id}`, { method: 'DELETE' })))
      setPresupuestos(prev => prev.filter(p => !selectedIds.includes(p.id)))
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
    if (selectedIds.length === presupuestos.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(presupuestos.map(p => p.id))
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8">
      <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6 pt-4 md:pt-0">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold text-[var(--naaloo-text)] mb-1 md:mb-1.5">
            Historial de Presupuestos
          </h1>
          <p className="text-[var(--naaloo-gray-600)] text-sm">
            Registro de propuestas emitidas. Podés editar el número de acuerdo o eliminar registros.
          </p>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-2.5 w-full md:w-auto mt-4 md:mt-0">
          {selectedIds.length > 0 && (
            <button className="btn-danger w-full md:w-auto justify-center md:flex-shrink-0" onClick={handleDeleteSelected}>
              Eliminar sel. ({selectedIds.length})
            </button>
          )}
          <input 
            type="text" 
            className="input w-full md:w-[250px]" 
            placeholder="Buscar empresa..." 
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={() => loadHistorial(q)} className="btn-secondary w-full md:w-auto justify-center flex-shrink-0">Buscar</button>
        </div>
      </div>

      <div className="card p-0 w-full overflow-x-auto">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>Cargando historial...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selectedIds.length === presupuestos.length && presupuestos.length > 0} onChange={toggleAll} />
                </th>
                <th style={{ width: '130px' }}>Acuerdo N°</th>
                <th>Versión</th>
                <th>Fecha</th>
                <th>Empresa</th>
                <th>Usuarios</th>
                <th>Valor Licencia</th>
                <th>Descuento</th>
                <th>Exc.</th>
                <th>Total Mensual</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ padding: '4px 8px', fontSize: '13px', border: '1px solid transparent', background: 'var(--naaloo-blue-subtle)', fontWeight: 600, width: '90px' }}
                      defaultValue={p.numero_acuerdo}
                      onBlur={(e) => handleEditAcuerdo(p.id, e.target.value)}
                    />
                  </td>
                  <td><span className="badge badge-blue">V{p.version}</span></td>
                  <td style={{ fontSize: '12px' }}>{p.fecha_propuesta}</td>
                  <td style={{ fontWeight: 600 }}>{p.nombre_empresa}</td>
                  <td>{p.cantidad_usuarios}</td>
                  <td>${formatPeso(p.valor_licencia)}</td>
                  <td>
                    {p.descuento_porcentaje > 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--naaloo-warning)', fontWeight: 600 }}>
                        {p.descuento_porcentaje}% ({p.descuento_meses}m)
                      </span>
                    ) : '-'}
                  </td>
                  <td>${formatPeso(p.recurso_excedente)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--naaloo-blue)' }}>
                    ${formatPeso(p.valor_total_mensual)}
                  </td>
                  <td>
                    <div className="flex gap-1.5 justify-end mt-2 md:mt-0">
                      <a href={`/api/download/${p.id}`} className="btn-ghost px-2 py-1">↓</a>
                      <button onClick={() => handleDelete(p.id)} className="btn-danger px-2 py-1">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
