'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Get banks for expense payment
export async function getBancos() {
    const { data, error } = await supabase
        .from('tabla_bancos')
        .select('id, nombre_banco, saldo_actual')
        .order('nombre_banco')

    if (error) {
        console.error('Error fetching bancos:', error)
        return []
    }

    return data.map((b: any) => ({
        id: b.id,
        nombre: b.nombre_banco,
        saldo_actual: b.saldo_actual,
    }))
}

// Get all expenses
export async function getGastos() {
    const { data, error } = await supabase
        .from('tabla_gastos')
        .select(`
      *,
      tabla_bancos (nombre_banco)
    `)
        .order('fecha', { ascending: false })

    if (error) {
        console.error('Error fetching gastos:', error)
        return []
    }
    return data
}



export interface CreateGastoInput {
    descripcion: string
    monto: number
    categoria: string
    banco_origen_id: string
    fecha?: string
}

export async function createGasto(input: CreateGastoInput) {
    // 1. Create the expense record (without banco_origen_id - column doesn't exist)
    const { data: gasto, error: gastoError } = await supabase
        .from('tabla_gastos')
        .insert({
            descripcion: input.descripcion,
            monto: input.monto,
            categoria: input.categoria,
            fecha: input.fecha || new Date().toISOString(),
        })
        .select()
        .single()

    if (gastoError) {
        console.error('Error creating gasto:', gastoError)
        return { success: false, error: gastoError.message }
    }

    // 2. Deduct from bank balance
    const { data: banco } = await supabase
        .from('tabla_bancos')
        .select('saldo_actual')
        .eq('id', input.banco_origen_id)
        .single()

    if (banco) {
        const nuevoSaldo = banco.saldo_actual - input.monto

        await supabase
            .from('tabla_bancos')
            .update({ saldo_actual: nuevoSaldo })
            .eq('id', input.banco_origen_id)
    }

    // 3. Log financial movement
    await supabase.from('tabla_movimientos_financieros').insert({
        tipo: 'Egreso',
        monto: input.monto,
        descripcion: `Gasto: ${input.descripcion}`,
        banco_destino_id: input.banco_origen_id,
        referencia_tipo: 'gasto',
        referencia_id: gasto.id,
    })

    revalidatePath('/gastos')
    revalidatePath('/')

    return { success: true, data: gasto }
}

// Get monthly expense stats
export async function getGastosStats() {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
        .from('tabla_gastos')
        .select('monto, categoria')
        .gte('fecha', startOfMonth.toISOString())

    if (error) {
        console.error('Error fetching gastos stats:', error)
        return { total: 0, porCategoria: {} }
    }

    const total = data.reduce((sum, g) => sum + Number(g.monto), 0)
    const porCategoria: Record<string, number> = {}

    data.forEach((g) => {
        const cat = g.categoria || 'Otros'
        porCategoria[cat] = (porCategoria[cat] || 0) + Number(g.monto)
    })

    return { total, porCategoria }
}
