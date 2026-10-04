'use client'

import { useState, useRef } from 'react'
import useSWR from 'swr'
import * as XLSX from 'xlsx'
import {
  FileSpreadsheet,
  Download,
  Upload,
  Percent,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

export interface RangoItem {
  id: string
  nombre: string
  rango_min: number
  rango_max: number | null
  valor_unitario: number
  activo: boolean
  creado_en?: string
}

export interface ListaPrecioSummary {
  nombre: string
  activa: boolean
  tramosCount: number
  rangoMin: number
  rangoMax: number | null
  minPrecio: number
  maxPrecio: number
  creado_en?: string
  tramos: RangoItem[]
}

function formatPeso(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(num)) return '$0'
  return `$${Math.round(num).toLocaleString('es-AR').replace(/,/g, '.')}`
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function RangosPage() {
  const { data: listasData, isLoading, mutate } = useSWR<ListaPrecioSummary[]>('/api/rangos/listas', fetcher)
  const listas = Array.isArray(listasData) ? listasData : []

  // UI state
  const [expandedList, setExpandedList] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal: Crear por aumento
  const [showAumentoModal, setShowAumentoModal] = useState(false)
  const [baseListForAumento, setBaseListForAumento] = useState('')
  const [nombreNuevaListaAumento, setNombreNuevaListaAumento] = useState('')
  const [porcentajeAumento, setPorcentajeAumento] = useState<number | string>(20)
  const [activarAumento, setActivarAumento] = useState(true)

  // Modal: Importar Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [nombreListaImport, setNombreListaImport] = useState('')
  const [activarImport, setActivarImport] = useState(true)
  const [parsedTramos, setParsedTramos] = useState<Array<{ rango_min: number; rango_max: number | null; valor_unitario: number }>>([])
  const [importFileName, setImportFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 5000)
  }

  // ── 1. Activar una lista de precios ─────────────────────────────────────────
  const handleActivarLista = async (nombre: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/rangos/activar-lista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listaNombre: nombre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al activar la lista')

      showFeedback('success', `La lista "${nombre}" ahora es la lista activa para todas las cotizaciones.`)
      await mutate()
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al activar lista')
    } finally {
      setActionLoading(false)
    }
  }

  // ── 1.b. Cargar Lista con Aumento del 20% (desde Excel oficial) ─────────────
  const handleCargarLista20 = async () => {
    const confirmMsg = '¿Deseás incorporar la "Lista con Aumento 20% - Octubre 2026" (52 tramos) y activarla para nuevas cotizaciones?\n\n• El historial de presupuestos anteriores se mantiene 100% intacto.\n• No se alterará ni eliminará ningún presupuesto existente.'
    if (!confirm(confirmMsg)) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/rangos/cargar-lista-20', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activar: true, nombre: 'Lista con Aumento 20% - Octubre 2026' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar la lista')

      showFeedback('success', `Lista "${data.nombre}" cargada y activada con éxito (${data.tramosInsertados} tramos).`)
      await mutate()
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al cargar la lista del 20%')
    } finally {
      setActionLoading(false)
    }
  }

  // ── 2. Crear lista por aumento porcentual ───────────────────────────────────
  const handleOpenAumentoModal = (nombreLista?: string) => {
    const base = nombreLista || (listas.find(l => l.activa)?.nombre || listas[0]?.nombre || '')
    setBaseListForAumento(base)
    setPorcentajeAumento(20)
    setNombreNuevaListaAumento(`Lista con Aumento 20% - ${new Date().toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}`)
    setActivarAumento(true)
    setShowAumentoModal(true)
  }

  const handleCrearPorAumento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreNuevaListaAumento.trim()) {
      showFeedback('error', 'Ingresá un nombre para la nueva lista.')
      return
    }
    const pct = Number(porcentajeAumento)
    if (isNaN(pct) || pct < 0) {
      showFeedback('error', 'El porcentaje debe ser un número mayor o igual a 0.')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/rangos/crear-por-aumento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listaBaseNombre: baseListForAumento,
          nuevaListaNombre: nombreNuevaListaAumento.trim(),
          porcentajeAumento: pct,
          activar: activarAumento,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear la lista')

      showFeedback('success', `Lista "${data.nuevaListaNombre}" creada exitosamente con ${data.tramosCreados} tramos.`)
      setShowAumentoModal(false)
      await mutate()
    } catch (err: any) {
      showFeedback('error', err.message || 'Error inesperado al crear lista')
    } finally {
      setActionLoading(false)
    }
  }

  // ── 3. Descargar plantilla Excel ───────────────────────────────────────────
  const handleDescargarPlantilla = () => {
    try {
      // Tomar los tramos de la lista activa o de la primera lista como base de tramos
      const baseList = listas.find(l => l.activa) || listas[0]
      const rows: any[] = [
        ['Tramo', 'Desde', 'Hasta', 'Precio por usuario ($)'],
      ]

      if (baseList && baseList.tramos.length > 0) {
        baseList.tramos.forEach((t, i) => {
          rows.push([
            i + 1,
            t.rango_min,
            t.rango_max ?? '',
            t.valor_unitario,
          ])
        })
      } else {
        // Fallback standard
        rows.push([1, 0, 10, 7560])
        rows.push([2, 11, 15, 6786])
        rows.push([3, 16, 20, 6216])
      }

      const ws = XLSX.utils.aoa_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Lista de precios')
      XLSX.writeFile(wb, 'Plantilla_Lista_Precios_Naaloo.xlsx')
      showFeedback('success', 'Plantilla descargada correctamente.')
    } catch {
      showFeedback('error', 'Error al generar la plantilla.')
    }
  }

  // ── 4. Importar lista desde Excel ──────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const sheetName = wb.SheetNames[0]
        const sheet = wb.Sheets[sheetName]
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        // Buscar fila de encabezados
        let headerRowIdx = -1
        let colDesde = -1
        let colHasta = -1
        let colPrecio = -1

        for (let r = 0; r < Math.min(10, rawRows.length); r++) {
          const row = rawRows[r]
          if (!Array.isArray(row)) continue
          row.forEach((cell, cIdx) => {
            const str = String(cell || '').toLowerCase().trim()
            if (str === 'desde' || str === 'min') colDesde = cIdx
            if (str === 'hasta' || str === 'max') colHasta = cIdx
            if (str.includes('precio') || str.includes('p.u.') || str === 'valor') colPrecio = cIdx
          })
          if (colDesde !== -1 && colPrecio !== -1) {
            headerRowIdx = r
            break
          }
        }

        // Si no detectó encabezados por nombre, usar posiciones estándar (Desde: col 1, Hasta: col 2, Precio: col 3 o 4)
        if (headerRowIdx === -1) {
          headerRowIdx = 0
          colDesde = 1
          colHasta = 2
          colPrecio = 3
        }

        const tramosExtraidos: Array<{ rango_min: number; rango_max: number | null; valor_unitario: number }> = []

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r]
          if (!row || row.length === 0) continue

          const minVal = parseInt(String(row[colDesde]).replace(/\D/g, ''))
          const hastaRaw = row[colHasta]
          const maxVal = hastaRaw != null && String(hastaRaw).trim() !== '' ? parseInt(String(hastaRaw).replace(/\D/g, '')) : null
          const precioRaw = String(row[colPrecio] || '').replace(/[^0-9.,]/g, '').replace(',', '.')
          const precioVal = parseFloat(precioRaw)

          if (!isNaN(minVal) && !isNaN(precioVal) && precioVal > 0) {
            tramosExtraidos.push({
              rango_min: minVal,
              rango_max: isNaN(Number(maxVal)) || maxVal === 0 ? null : maxVal,
              valor_unitario: Math.round(precioVal * 100) / 100,
            })
          }
        }

        if (tramosExtraidos.length === 0) {
          showFeedback('error', 'No se pudieron extraer tramos válidos del archivo.')
          return
        }

        tramosExtraidos.sort((a, b) => a.rango_min - b.rango_min)
        setParsedTramos(tramosExtraidos)
        const nameGuess = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
        setNombreListaImport(nameGuess)
      } catch (err: any) {
        showFeedback('error', 'Error al leer el archivo Excel: ' + err.message)
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleConfirmarImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreListaImport.trim()) {
      showFeedback('error', 'Por favor, asignale un nombre a la lista.')
      return
    }
    if (parsedTramos.length === 0) {
      showFeedback('error', 'No hay tramos para importar.')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/rangos/importar-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreLista: nombreListaImport.trim(),
          tramos: parsedTramos,
          activar: activarImport,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al importar')

      showFeedback('success', `Lista "${data.nombreLista}" importada con éxito (${data.tramosImportados} tramos).`)
      setShowImportModal(false)
      setParsedTramos([])
      setImportFileName('')
      await mutate()
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al importar lista')
    } finally {
      setActionLoading(false)
    }
  }

  // ── 5. Eliminar o archivar lista de forma segura ───────────────────────────
  const handleEliminarLista = async (nombre: string, esActiva: boolean) => {
    if (esActiva) {
      alert('No podés eliminar la lista activa. Primero activá otra lista.')
      return
    }
    if (!confirm(`¿Eliminar la lista "${nombre}"? Si tiene presupuestos asociados en el historial, será desactivada para no alterar datos históricos.`)) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/rangos/eliminar-lista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listaNombre: nombre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar')

      showFeedback('success', data.message || 'Lista procesada correctamente.')
      await mutate()
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al eliminar lista')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 pb-12">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 pt-4 md:pt-0">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold text-[var(--naaloo-slate-800)] tracking-tight mb-1">
            Listas de Precios
          </h1>
          <p className="text-[var(--naaloo-slate-500)] text-[13px]">
            Gestioná y activá listas completas de precios por usuario. Solo una lista está activa para cotizaciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDescargarPlantilla}
            className="btn-secondary py-2 px-3 text-[13px]"
            title="Descargar plantilla Excel limpia"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Descargar plantilla</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setParsedTramos([])
              setImportFileName('')
              setShowImportModal(true)
            }}
            className="btn-secondary py-2 px-3 text-[13px]"
          >
            <Upload size={15} />
            <span>Importar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAumentoModal()}
            className="btn-primary py-2 px-4 text-[13px]"
          >
            <Percent size={15} />
            <span>Crear por % aumento</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div className={`alert alert-${feedback.type === 'success' ? 'success' : 'error'} animate-fadein mb-6 flex items-center gap-2`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* DB INTEGRITY ASSURANCE BADGE */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2.5 mb-5 flex items-center justify-between text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            <strong>Protección de Base de Datos:</strong> El historial de presupuestos anteriores se mantiene 100% intacto y protegido. Al activar una nueva lista, las anteriores permanecen en el sistema para preservar la integridad histórica.
          </span>
        </div>
      </div>

      {/* BANNER: Cargar Lista +20% si no existe */}
      {!isLoading && !listas.some(l => l.nombre.includes('20%') || l.nombre.includes('Aumento 20')) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadein">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--naaloo-blue)] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--naaloo-slate-800)] flex items-center gap-2">
                Nueva Lista con Aumento del 20% lista para incorporar
              </h3>
              <p className="text-xs text-[var(--naaloo-slate-600)] mt-0.5 max-w-[620px]">
                Calculada a partir del archivo oficial <code>Precios/Naaloo. Actualización Lista de Precios..xlsx</code> con los 52 tramos de usuarios.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleCargarLista20}
            className="btn-primary py-2 px-4 text-xs font-semibold whitespace-nowrap shadow-sm"
          >
            {actionLoading ? 'Incorporando...' : 'Cargar y Activar Lista +20%'}
          </button>
        </div>
      )}

      {/* LIST OF PRICE LISTS */}
      {isLoading ? (
        <div className="card p-12 text-center text-[var(--naaloo-slate-400)]">
          <div className="spinner mx-auto mb-3 w-5 h-5 border-blue-500" />
          Cargando listas de precios...
        </div>
      ) : listas.length === 0 ? (
        <div className="card p-12 text-center text-[var(--naaloo-slate-500)]">
          <Layers size={36} className="mx-auto mb-3 text-[var(--naaloo-slate-300)]" />
          <p className="font-semibold text-[15px] mb-1">No hay listas de precios registradas</p>
          <p className="text-xs mb-4">Podés importar una lista desde Excel o incorporar la lista oficial con aumento del 20%.</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCargarLista20}
              className="btn-primary py-2 px-4 text-xs shadow-sm"
            >
              Cargar Lista con Aumento 20% (del Excel)
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="btn-secondary py-2 px-4 text-xs"
            >
              Importar archivo Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {listas.map((lista) => {
            const isExpanded = expandedList === lista.nombre
            return (
              <div
                key={lista.nombre}
                className={`card p-5 transition-all ${
                  lista.activa
                    ? 'border-2 border-[var(--naaloo-blue)] bg-white shadow-md'
                    : 'border border-[var(--naaloo-slate-200)] bg-white hover:border-[var(--naaloo-slate-300)]'
                }`}
              >
                {/* Header of list card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        lista.activa
                          ? 'bg-[var(--naaloo-blue)] text-white shadow-sm'
                          : 'bg-[var(--naaloo-slate-100)] text-[var(--naaloo-slate-500)]'
                      }`}
                    >
                      <FileSpreadsheet size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[16px] font-bold text-[var(--naaloo-slate-800)] tracking-tight">
                          {lista.nombre}
                        </h2>
                        {lista.activa ? (
                          <span className="badge badge-active font-semibold py-0.5 px-2.5 text-[11px]">
                            ● Activa para cotizar
                          </span>
                        ) : (
                          <span className="badge badge-inactive py-0.5 px-2 text-[11px]">
                            ○ Inactiva
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[var(--naaloo-slate-500)] mt-1 flex-wrap">
                        <span><strong>{lista.tramosCount}</strong> tramos</span>
                        <span>•</span>
                        <span>Usuarios: <strong>{lista.rangoMin} a {lista.rangoMax ?? '∞'}</strong></span>
                        <span>•</span>
                        <span>P.U.: <strong>{formatPeso(lista.minPrecio)}</strong> - <strong>{formatPeso(lista.maxPrecio)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this list */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {!lista.activa && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleActivarLista(lista.nombre)}
                        className="btn-primary py-1.5 px-3 text-[12px] shadow-sm"
                      >
                        Activar esta lista
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenAumentoModal(lista.nombre)}
                      className="btn-secondary py-1.5 px-3 text-[12px]"
                      title="Crear nueva lista aplicando aumento desde esta"
                    >
                      <Copy size={13} />
                      <span className="hidden lg:inline">+ Aumento</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedList(isExpanded ? null : lista.nombre)}
                      className="btn-secondary py-1.5 px-3 text-[12px]"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isExpanded ? 'Ocultar' : 'Ver tramos'}</span>
                    </button>

                    {!lista.activa && (
                      <button
                        type="button"
                        onClick={() => handleEliminarLista(lista.nombre, lista.activa)}
                        className="p-2 text-[var(--naaloo-slate-400)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar lista"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail: Table of 52 tramos */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-[var(--naaloo-slate-100)] animate-fadein">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-semibold text-[var(--naaloo-slate-700)] uppercase tracking-wider">
                        Tramos configurados ({lista.tramos.length})
                      </p>
                      <span className="text-[11px] text-[var(--naaloo-slate-400)]">
                        Valores unitarios expresados en pesos argentinos (+ IVA)
                      </span>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar border border-[var(--naaloo-slate-200)] rounded-xl">
                      <table className="w-full text-[12px] border-separate border-spacing-0">
                        <thead className="bg-[var(--naaloo-slate-50)] sticky top-0 z-10">
                          <tr>
                            <th className="py-2 px-3 text-left font-semibold text-[var(--naaloo-slate-600)] border-b border-[var(--naaloo-slate-200)] w-20">Tramo</th>
                            <th className="py-2 px-4 text-left font-semibold text-[var(--naaloo-slate-600)] border-b border-[var(--naaloo-slate-200)]">Desde</th>
                            <th className="py-2 px-4 text-left font-semibold text-[var(--naaloo-slate-600)] border-b border-[var(--naaloo-slate-200)]">Hasta</th>
                            <th className="py-2 px-4 text-right font-semibold text-[var(--naaloo-slate-600)] border-b border-[var(--naaloo-slate-200)]">Precio por usuario (P.U.)</th>
                            <th className="py-2 px-4 text-right font-semibold text-[var(--naaloo-slate-600)] border-b border-[var(--naaloo-slate-200)]">Total al tope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--naaloo-slate-100)] bg-white">
                          {lista.tramos.map((t, idx) => {
                            const tope = t.rango_max ? t.rango_max * Number(t.valor_unitario) : null
                            return (
                              <tr key={t.id || idx} className="hover:bg-[var(--naaloo-slate-50)]">
                                <td className="py-1.5 px-3 text-[var(--naaloo-slate-400)] font-mono text-[11px]">#{idx + 1}</td>
                                <td className="py-1.5 px-4 font-medium text-[var(--naaloo-slate-700)]">{t.rango_min}</td>
                                <td className="py-1.5 px-4 font-medium text-[var(--naaloo-slate-700)]">{t.rango_max ?? '∞'}</td>
                                <td className="py-1.5 px-4 text-right font-semibold text-[var(--naaloo-blue)] font-mono">
                                  {formatPeso(t.valor_unitario)}
                                </td>
                                <td className="py-1.5 px-4 text-right text-[var(--naaloo-slate-500)] font-mono text-[11px]">
                                  {tope ? formatPeso(tope) : '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL: CREAR LISTA POR AUMENTO % ────────────────────────────────── */}
      {showAumentoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadein">
          <div className="card max-w-[500px] w-full p-6 shadow-2xl relative">
            <h2 className="text-[18px] font-bold text-[var(--naaloo-slate-800)] mb-1 flex items-center gap-2">
              <TrendingUp size={20} className="text-[var(--naaloo-blue)]" />
              Crear lista por % de aumento
            </h2>
            <p className="text-xs text-[var(--naaloo-slate-500)] mb-5">
              Duplica todos los tramos de una lista base y aplica el incremento porcentual automáticamente.
            </p>

            <form onSubmit={handleCrearPorAumento} className="flex flex-col gap-4">
              <div>
                <label className="input-label text-xs">Lista base de origen</label>
                <select
                  className="input py-2 text-sm"
                  value={baseListForAumento}
                  onChange={(e) => setBaseListForAumento(e.target.value)}
                  required
                >
                  {listas.map((l) => (
                    <option key={l.nombre} value={l.nombre}>
                      {l.nombre} ({l.tramosCount} tramos) {l.activa ? '★ (Activa)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label text-xs">Porcentaje de aumento (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="500"
                    className="input py-2 pr-8 text-sm font-semibold"
                    value={porcentajeAumento}
                    onChange={(e) => setPorcentajeAumento(e.target.value)}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="input-label text-xs">Nombre de la nueva lista</label>
                <input
                  type="text"
                  className="input py-2 text-sm"
                  value={nombreNuevaListaAumento}
                  onChange={(e) => setNombreNuevaListaAumento(e.target.value)}
                  placeholder="Ej: Lista Aumento 20% - Noviembre 2026"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activarAumento"
                  checked={activarAumento}
                  onChange={(e) => setActivarAumento(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--naaloo-blue)] cursor-pointer"
                />
                <label htmlFor="activarAumento" className="text-xs text-[var(--naaloo-slate-700)] cursor-pointer select-none">
                  <strong>Activar inmediatamente</strong> para que sea la lista en uso en el cotizador
                </label>
              </div>

              <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-[var(--naaloo-slate-100)]">
                <button
                  type="button"
                  onClick={() => setShowAumentoModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary py-2 px-5 text-xs shadow-sm"
                >
                  {actionLoading ? 'Creando lista...' : 'Crear lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: IMPORTAR LISTA DESDE EXCEL ───────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadein">
          <div className="card max-w-[560px] w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <h2 className="text-[18px] font-bold text-[var(--naaloo-slate-800)] mb-1 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-[var(--naaloo-blue)]" />
              Importar lista desde Excel (.xlsx)
            </h2>
            <p className="text-xs text-[var(--naaloo-slate-500)] mb-4">
              Subí un archivo con columnas <strong>Desde</strong>, <strong>Hasta</strong> y <strong>Precio por usuario</strong>.
            </p>

            <form onSubmit={handleConfirmarImport} className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="input-label text-xs">Archivo Excel</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--naaloo-slate-300)] hover:border-[var(--naaloo-blue)] bg-[var(--naaloo-slate-50)] rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  <Upload size={24} className="mx-auto mb-2 text-[var(--naaloo-slate-400)]" />
                  <p className="text-xs font-semibold text-[var(--naaloo-slate-700)]">
                    {importFileName ? importFileName : 'Hacé clic para seleccionar el archivo .xlsx'}
                  </p>
                  <p className="text-[11px] text-[var(--naaloo-slate-400)] mt-0.5">
                    o arrastralo aquí
                  </p>
                </div>
              </div>

              {parsedTramos.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Se detectaron <strong>{parsedTramos.length} tramos válidos</strong></span>
                  </div>
                  <span className="font-mono text-[11px]">
                    Usuarios: {parsedTramos[0].rango_min} - {parsedTramos[parsedTramos.length - 1].rango_max ?? '∞'}
                  </span>
                </div>
              )}

              <div>
                <label className="input-label text-xs">Nombre para esta lista</label>
                <input
                  type="text"
                  className="input py-2 text-sm"
                  value={nombreListaImport}
                  onChange={(e) => setNombreListaImport(e.target.value)}
                  placeholder="Ej: Lista Actualizada Octubre 2026"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activarImport"
                  checked={activarImport}
                  onChange={(e) => setActivarImport(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--naaloo-blue)] cursor-pointer"
                />
                <label htmlFor="activarImport" className="text-xs text-[var(--naaloo-slate-700)] cursor-pointer select-none">
                  <strong>Activar inmediatamente</strong> para que sea la lista en uso en el cotizador
                </label>
              </div>

              <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-[var(--naaloo-slate-100)]">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || parsedTramos.length === 0}
                  className="btn-primary py-2 px-5 text-xs shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Importando...' : 'Confirmar e Importar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
