import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import PresupuestoPrintDeck from '@/components/PresupuestoPrintDeck'
import type { Presupuesto } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function ImprimirPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  return <PresupuestoPrintDeck presupuesto={data as Presupuesto} />
}
