import type { Presupuesto } from '@/lib/supabase'

function formatPeso(value: number): string {
  return Math.round(value).toLocaleString('es-AR').replace(/,/g, '.')
}

function formatFecha(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function buildPresupuestoPrintHtml(p: Presupuesto): string {
  const hasDiscount = Number(p.descuento_porcentaje) > 0
  const fecha = formatFecha(p.fecha_propuesta)

  return `
<style>
  .naaloo-print {
    font-family: 'Roboto', Arial, sans-serif;
    color: #1e293b;
    max-width: 720px;
    margin: 0 auto;
  }
  .naaloo-print * { box-sizing: border-box; }
  .naaloo-print .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }
  .naaloo-print .mark {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: #475569;
    color: #fff;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .naaloo-print h1 {
    font-size: 22px;
    margin: 0 0 4px;
    letter-spacing: -0.02em;
  }
  .naaloo-print .subtitle {
    margin: 0;
    color: #64748b;
    font-size: 13px;
  }
  .naaloo-print .meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 24px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 22px;
    font-size: 13px;
  }
  .naaloo-print .meta span {
    display: block;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }
  .naaloo-print .meta strong { font-size: 14px; }
  .naaloo-print table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .naaloo-print th,
  .naaloo-print td {
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
  }
  .naaloo-print td:last-child,
  .naaloo-print th:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  .naaloo-print th {
    color: #64748b;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .naaloo-print .total td {
    border-bottom: none;
    padding-top: 16px;
    font-size: 16px;
    font-weight: 700;
  }
  .naaloo-print .note {
    margin-top: 28px;
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
  }
</style>
<article class="naaloo-print">
  <div class="brand">
    <div class="mark">N</div>
    <div>
      <h1>Propuesta comercial</h1>
      <p class="subtitle">Naaloo · Presupuesto</p>
    </div>
  </div>
  <div class="meta">
    <div><span>Empresa</span><strong>${escapeHtml(p.nombre_empresa)}</strong></div>
    <div><span>Fecha</span><strong>${fecha}</strong></div>
    <div><span>Acuerdo N°</span><strong>${p.numero_acuerdo}</strong></div>
    <div><span>Versión</span><strong>V${p.version}</strong></div>
  </div>
  <table>
    <thead>
      <tr><th>Concepto</th><th>Valor</th></tr>
    </thead>
    <tbody>
      <tr><td>Cantidad de usuarios</td><td>${p.cantidad_usuarios}</td></tr>
      <tr><td>Valor de licencia</td><td>$${formatPeso(p.valor_licencia)} + IVA</td></tr>
      <tr><td>Recurso excedente</td><td>$${formatPeso(p.recurso_excedente)} + IVA</td></tr>
      ${hasDiscount ? `<tr><td>Descuento</td><td>${p.descuento_porcentaje}% por ${p.descuento_meses} meses</td></tr>` : ''}
      <tr class="total"><td>Total mensual</td><td>$${formatPeso(p.valor_total_mensual)} + IVA</td></tr>
    </tbody>
  </table>
  <p class="note">Documento generado desde Presupuestos Naaloo. En el diálogo de impresión podés elegir “Guardar como PDF” como destino.</p>
</article>
`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
