import { NextRequest, NextResponse } from 'next/server'
import { supabase, roundToNearest10 } from '@/lib/supabase'
import { generatePptx } from '@/lib/pptx-generator'
import { format } from 'date-fns'

// POST /api/generar – guardar presupuesto y devolver PPTX
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nombre_empresa,
      cantidad_usuarios,
      valor_licencia,
      descuento_porcentaje,
      descuento_meses,
      fecha_propuesta,
      rango_id,
    } = body

    // Validaciones básicas
    if (!nombre_empresa?.trim()) {
      return NextResponse.json({ error: 'El nombre de empresa es requerido' }, { status: 400 })
    }
    if (!cantidad_usuarios || cantidad_usuarios < 1) {
      return NextResponse.json({ error: 'La cantidad de usuarios debe ser mayor a 0' }, { status: 400 })
    }
    if (!valor_licencia || valor_licencia < 0) {
      return NextResponse.json({ error: 'El valor de licencia debe ser mayor a 0' }, { status: 400 })
    }

    // Calcular valores derivados
    const recursoExcedente = roundToNearest10(valor_licencia / cantidad_usuarios)
    const valorTotalMensual = Math.round(valor_licencia * (1 - descuento_porcentaje / 100))

    // Guardar en Supabase
    const { data: presupuesto, error: dbError } = await supabase
      .from('presupuestos')
      .insert({
        nombre_empresa: nombre_empresa.trim(),
        cantidad_usuarios,
        valor_licencia,
        descuento_porcentaje,
        descuento_meses,
        recurso_excedente: recursoExcedente,
        valor_total_mensual: valorTotalMensual,
        fecha_propuesta,
        rango_id: rango_id ?? null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error Supabase:', dbError)
      return NextResponse.json({ error: 'Error al guardar en base de datos' }, { status: 500 })
    }

    // Formatear fecha para el PPTX: "2026-04-15" → "15/04/26"
    const fechaDate = new Date(fecha_propuesta + 'T12:00:00')
    const fechaFormateada = format(fechaDate, 'dd/MM/yy')

    // Generar PPTX
    const pptxBuffer = await generatePptx({
      nombreEmpresa: nombre_empresa.trim(),
      cantidadUsuarios: cantidad_usuarios,
      valorLicencia: valor_licencia,
      descuentoPorcentaje: descuento_porcentaje,
      descuentoMeses: descuento_meses,
      recursoExcedente,
      valorTotalMensual,
      fechaPropuesta: fechaFormateada,
    })

    const nombreArchivo = `Propuesta_${nombre_empresa.trim().replace(/\s+/g, '_')}_${fecha_propuesta}.pptx`

    // Devolver el ID y el objeto en el body por si falla el blob
    return NextResponse.json(presupuesto, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Presupuesto-Id': presupuesto.id,
      },
    })
  } catch (err) {
    console.error('Error al generar PPTX:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET /api/generar – listar últimos presupuestos
export async function GET() {
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
