'use client'
import { useState, useEffect, useCallback } from 'react'
import { RangoPrecio, findRangoForUsuarios, roundToNearest10 } from '@/lib/supabase'

function formatPesoCOP(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''
  return Math.round(num).toLocaleString('es-AR').replace(/,/g, '.')
}

function getTodayISO(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

// Sin valores por defecto - el usuario debe completar todo


export default function HomePage() {
  const [rangos, setRangos] = useState<RangoPrecio[]>([])
  const [loadingRangos, setLoadingRangos] = useState(true)

  // Formulario vacío por defecto
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [fecha, setFecha] = useState(getTodayISO())
  const [cantidadUsuarios, setCantidadUsuarios] = useState<number | string>('')
  const [valorLicencia, setValorLicencia] = useState<number | string>('')
  const [descuentoPct, setDescuentoPct] = useState<number | string>('')
  const [descuentoMeses, setDescuentoMeses] = useState<number | string>('')

  // Calculados
  const [rangoActivo, setRangoActivo] = useState<RangoPrecio | null>(null)
  const [valorUnitario, setValorUnitario] = useState<number>(0)   // precio por colaborador
  const [recursoExcedente, setRecursoExcedente] = useState<number>(0)
  const [valorTotal, setValorTotal] = useState<number>(0)

  // UI state
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Cargar rangos
  useEffect(() => {
    fetch('/api/rangos')
      .then((r) => r.json())
      .then((data) => {
        setRangos(Array.isArray(data) ? data : [])
        setLoadingRangos(false)
      })
      .catch(() => setLoadingRangos(false))
  }, [])

  // Auto-selección del rango
  useEffect(() => {
    const usuarios = Number(cantidadUsuarios) || 0
    if (rangos.length === 0 || !usuarios) return
    const rango = findRangoForUsuarios(rangos, usuarios)
    if (rango) {
      setRangoActivo(rango)
      setValorUnitario(rango.valor_unitario)
      setValorLicencia(Math.round(usuarios * rango.valor_unitario))
    } else {
      setRangoActivo(null)
    }
  }, [cantidadUsuarios, rangos])

  // Recalcular derivados
  useEffect(() => {
    const usuarios = Number(cantidadUsuarios) || 0
    const licencia = Number(valorLicencia) || 0
    const pct = Number(descuentoPct) || 0
    
    // Si hay rango activo, el excedente ES el valor unitario del rango
    // Si se editó manualmente el valor licencia, calculamos dividiendo
    const excedente = rangoActivo
      ? rangoActivo.valor_unitario
      : (usuarios > 0 && licencia > 0
          ? roundToNearest10(licencia / usuarios)
          : 0)
    const total = Math.round(licencia * (1 - pct / 100))
    setRecursoExcedente(excedente)
    setValorTotal(total)
  }, [valorLicencia, cantidadUsuarios, descuentoPct, rangoActivo])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!nombreEmpresa.trim()) {
      setError('Por favor, ingresá el nombre de la empresa.')
      return
    }
    if (Number(cantidadUsuarios) < 1) {
      setError('La cantidad de usuarios debe ser mayor a 0.')
      return
    }
    if (Number(valorLicencia) < 0) {
      setError('El valor de la licencia no puede ser negativo.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_empresa: nombreEmpresa.trim(),
          cantidad_usuarios: Number(cantidadUsuarios),
          valor_licencia: Number(valorLicencia),
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

      // El servidor nos devuelve el ID en un header (X-Presupuesto-Id)
      const presupuestoId = res.headers.get('X-Presupuesto-Id');
      
      if (presupuestoId) {
        console.log('Redirigiendo a descarga:', presupuestoId);
        window.location.href = `/api/download/${presupuestoId}`;
      } else {
        // Fallback si el header no está
        const data = await res.json();
        window.location.href = `/api/download/${data.id}`;
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [nombreEmpresa, cantidadUsuarios, valorLicencia, descuentoPct, descuentoMeses, fecha, rangoActivo])

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-[26px] font-bold text-[var(--naaloo-text)] mb-1 md:mb-1.5">
          Nueva Propuesta Comercial
        </h1>
        <p className="text-sm text-[var(--naaloo-gray-600)]">
          Completá los datos del cliente y generá la propuesta en PPTX automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ── COLUMNA IZQUIERDA ──────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Datos del cliente */}
            <div className="card animate-fadein">
              <p className="section-title">Datos del cliente</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="input-label" htmlFor="nombre_empresa">
                    Nombre de empresa
                  </label>
                  <input
                    id="nombre_empresa"
                    type="text"
                    className="input"
                    placeholder="Ej: Luminitec SRL"
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    required
                  />
                  <p className="input-hint">Incluí la razón social (SRL, SA, etc.)</p>
                </div>

                <div>
                  <label className="input-label" htmlFor="fecha_propuesta">
                    Fecha de la propuesta
                  </label>
                  <input
                    id="fecha_propuesta"
                    type="date"
                    className="input"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                  <p className="input-hint">Se puede modificar si armás el presupuesto antes de enviarlo</p>
                </div>
              </div>
            </div>

            {/* Datos de la licencia */}
            <div className="card animate-fadein">
              <p className="section-title">Licencia</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Usuarios */}
                <div>
                  <label className="input-label" htmlFor="cantidad_usuarios">
                    Cantidad de usuarios
                  </label>
                  <input
                    id="cantidad_usuarios"
                    type="number"
                    className="input"
                    min={1}
                    value={cantidadUsuarios}
                    onChange={(e) => setCantidadUsuarios(parseInt(e.target.value) || 1)}
                  />
                  {rangoActivo
                    ? <p className="input-hint" style={{ color: 'var(--naaloo-blue)' }}>
                        Rango: {rangoActivo.nombre}
                      </p>
                    : <p className="input-hint" style={{ color: 'var(--naaloo-warning)' }}>
                        Sin rango configurado para este volumen
                      </p>
                  }
                </div>

                {/* Valor licencia */}
                <div>
                  <label className="input-label" htmlFor="valor_licencia">
                    Valor licencia mensual ($ sin IVA)
                  </label>
                  <input
                    id="valor_licencia"
                    type="number"
                    className="input"
                    min={0}
                    value={valorLicencia}
                    onChange={(e) => {
                      const newVal = parseFloat(e.target.value) || 0
                      setValorLicencia(newVal)
                      setRangoActivo(null) // override manual — excedente se calcula dividiendo
                    }}
                  />
                  <p className="input-hint">= usuarios × valor unitario del rango. Editable manualmente</p>
                </div>

                {/* Descuento % */}
                <div>
                  <label className="input-label" htmlFor="descuento_pct">
                    Descuento (%)
                  </label>
                  <input
                    id="descuento_pct"
                    type="number"
                    className="input"
                    min={0}
                    max={100}
                    value={descuentoPct}
                    onChange={(e) => setDescuentoPct(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Descuento meses */}
                <div>
                  <label className="input-label" htmlFor="descuento_meses">
                    Meses con descuento
                  </label>
                  <input
                    id="descuento_meses"
                    type="number"
                    className="input"
                    min={1}
                    placeholder="Ej: 6"
                    value={descuentoMeses}
                    onChange={(e) => setDescuentoMeses(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Valores calculados */}
            <div className="card animate-fadein">
              <p className="section-title">Resumen calculado</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalcField
                  label="Recurso excedente ($/usuario extra)"
                  value={`$${formatPesoCOP(recursoExcedente)} + IVA`}
                  hint="Valor licencia ÷ usuarios (⌊x10⌋)"
                />
                <CalcField
                  label="Valor total mensual con descuento"
                  value={`$${formatPesoCOP(valorTotal)} + IVA`}
                  hint={`Licencia − ${descuentoPct}%`}
                  highlight
                />
              </div>
            </div>

            {/* Botón generar */}
            <div className="card animate-fadein" style={{ padding: '24px', border: '2px solid var(--naaloo-blue-light)' }}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <span>⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                  <span>✓</span> Presupuesto generado y guardado correctamente.
                </div>
              )}

              <button
                id="btn-generar"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '16px 24px', fontSize: '16px', fontWeight: 600 }}
              >
                {loading ? (
                  <><div className="spinner" /> Generando...</>
                ) : (
                  <><span>↓</span> Generar Presupuesto</>
                )}
              </button>
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--naaloo-gray-500)', marginTop: '12px' }}>
                Guarda el historial en la nube y descarga el archivo PPTX automáticamente
              </p>
            </div>
          </div>

          {/* ── COLUMNA DERECHA: Rangos de referencia ─────────────────── */}
          <div className="flex flex-col gap-5 sticky top-[88px]">
            <div className="card animate-fadein">
              <div className="flex justify-between items-center mb-4">
                <p className="section-title !mb-0">Rangos de precio</p>
                <a
                  href="/rangos"
                  style={{ fontSize: '12px', color: 'var(--naaloo-blue)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Gestionar →
                </a>
              </div>

              {loadingRangos ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--naaloo-gray-400)' }}>
                  Cargando rangos...
                </div>
              ) : rangos.length === 0 ? (
                <div className="alert alert-info">Sin rangos configurados. <a href="/rangos">Crear rangos →</a></div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Rango</th>
                        <th>P.U.</th>
                        <th>Total aprox.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangos.filter(r => r.activo).map((r) => (
                        <tr
                          key={r.id}
                          className={rangoActivo?.id === r.id ? 'row-highlight' : ''}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setRangoActivo(r)
                            setValorUnitario(r.valor_unitario)
                            setValorLicencia(Math.round(Number(cantidadUsuarios) * r.valor_unitario))
                          }}
                          title="Click para aplicar este rango"
                        >
                          <td style={{ fontWeight: rangoActivo?.id === r.id ? 600 : 400 }}>
                            {rangoActivo?.id === r.id && (
                              <span style={{ marginRight: '6px', color: 'var(--naaloo-blue)' }}>▶</span>
                            )}
                            {r.nombre}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--naaloo-blue)' }}>
                            ${formatPesoCOP(Number(r.valor_unitario))}
                          </td>
                          <td style={{ color: 'var(--naaloo-gray-600)', fontSize: '12px' }}>
                            ${formatPesoCOP(Math.round(Number(cantidadUsuarios) * Number(r.valor_unitario)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* El botón de generar fue movido a la izquierda */}
          </div>
        </div>
      </form>
    </div>
  )
}

function CalcField({
  label, value, hint, highlight,
}: {
  label: string; value: string; hint?: string; highlight?: boolean
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <div
        className="value-display"
        style={highlight ? {
          background: 'linear-gradient(135deg, var(--naaloo-blue-subtle), #e0ecff)',
          border: '1.5px solid var(--naaloo-blue)',
          fontSize: '17px',
        } : {}}
      >
        {value}
      </div>
      {hint && <p className="input-hint">{hint}</p>}
    </div>
  )
}
