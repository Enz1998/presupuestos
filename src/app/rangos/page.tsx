'use client'
import { useState, useEffect } from 'react'
import { RangoPrecio } from '@/lib/supabase'

function formatPeso(v: number | string) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return ''
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

const EMPTY_FORM = {
  nombre: '',
  rango_min: '',
  rango_max: '',
  valor_unitario: '', // Usamos valor_unitario internamente
}

export default function RangosPage() {
  const [rangos, setRangos] = useState<RangoPrecio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  
  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const loadRangos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rangos')
      const data = await res.json()
      setRangos(Array.isArray(data) ? data : [])
    } catch {
      showFeedback('error', 'Error al cargar los rangos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRangos() }, [])

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleEdit = (rango: RangoPrecio) => {
    setEditingId(rango.id)
    setForm({
      nombre: rango.nombre,
      rango_min: String(rango.rango_min),
      rango_max: rango.rango_max != null ? String(rango.rango_max) : '',
      valor_unitario: String(rango.valor_unitario),
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.rango_min || !form.valor_unitario) {
      showFeedback('error', 'Completá nombre, rango mínimo y valor unitario.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        rango_min: parseInt(form.rango_min),
        rango_max: form.rango_max ? parseInt(form.rango_max) : null,
        valor_unitario: parseFloat(form.valor_unitario),
      }

      const url = editingId ? `/api/rangos/${editingId}` : '/api/rangos'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()

      showFeedback('success', editingId ? 'Rango actualizado correctamente.' : 'Rango creado correctamente.')
      handleCancel()
      await loadRangos()
    } catch {
      showFeedback('error', 'Error al guardar el rango.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (rango: RangoPrecio) => {
    try {
      await fetch(`/api/rangos/${rango.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rango, activo: !rango.activo }),
      })
      await loadRangos()
    } catch {
      showFeedback('error', 'Error al actualizar el estado.')
    }
  }

  const handleDeleteMany = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.length} rangos seleccionados?`)) return
    try {
      const res = await fetch('/api/rangos/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) throw new Error()
      showFeedback('success', 'Rangos eliminados correctamente.')
      setSelectedIds([])
      await loadRangos()
    } catch {
      showFeedback('error', 'Error al eliminar rangos.')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === rangos.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(rangos.map(r => r.id))
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 md:px-8">
      <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6 pt-4 md:pt-0">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold text-[var(--naaloo-text)] mb-1 md:mb-1.5">
            Rangos de Precio
          </h1>
          <p className="text-[var(--naaloo-gray-600)] text-sm">
            Configurá los rangos de usuarios y sus valores unitarios (P.U.).
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2.5 w-full md:w-auto mt-4 md:mt-0">
          {selectedIds.length > 0 && (
            <button className="btn-danger w-full md:w-auto justify-center" onClick={handleDeleteMany}>
              Eliminar seleccionados ({selectedIds.length})
            </button>
          )}
          <button id="btn-nuevo-rango" className="btn-primary w-full md:w-auto justify-center" onClick={handleNew}>
            + Nuevo rango
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type === 'success' ? 'success' : 'error'} animate-fadein mb-5`}>
          <span>{feedback.type === 'success' ? '✓' : '⚠'}</span> {feedback.msg}
        </div>
      )}

      {showForm && (
        <div className="card animate-fadein mb-6 border-2 border-[var(--naaloo-blue-light)]">
          <p className="section-title">{editingId ? 'Editar rango' : 'Nuevo rango'}</p>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-4 items-start md:items-end">
              <div>
                <label className="input-label">Nombre del rango</label>
                <input type="text" className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Min usuarios</label>
                <input type="number" className="input" value={form.rango_min} onChange={(e) => setForm({ ...form, rango_min: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Max usuarios</label>
                <input type="number" className="input" value={form.rango_max} onChange={(e) => setForm({ ...form, rango_max: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Valor Unitario (P.U.)</label>
                <input type="number" className="input" value={form.valor_unitario} onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })} required />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
              <button type="submit" className="btn-primary sm:w-auto w-full justify-center" disabled={saving}>
                {saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear rango')}
              </button>
              <button type="button" className="btn-secondary sm:w-auto w-full justify-center" onClick={handleCancel}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 w-full overflow-x-auto">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>Cargando...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selectedIds.length === rangos.length && rangos.length > 0} onChange={toggleAll} />
                </th>
                <th>Nombre</th>
                <th>Min</th>
                <th>Max</th>
                <th>Valor Unitario (P.U.)</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rangos.map((r) => (
                <tr key={r.id} style={{ opacity: r.activo ? 1 : 0.6 }}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} />
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.nombre}</td>
                  <td>{r.rango_min}</td>
                  <td>{r.rango_max ?? '∞'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--naaloo-blue)' }}>${formatPeso(r.valor_unitario)}</td>
                  <td>
                    <button className={`badge ${r.activo ? 'badge-active' : 'badge-inactive'}`} onClick={() => handleToggleActivo(r)}>
                      {r.activo ? '● Activo' : '○ Inactivo'}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      <button className="btn-ghost" onClick={() => handleEdit(r)}>Editar</button>
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
