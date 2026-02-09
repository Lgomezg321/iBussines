'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Types for reconciliation
export interface MovimientoFinanciero {
    id: string
    tipo: string
    monto: number
    descripcion: string | null
    fecha_movimiento: string
    conciliado: boolean
    referencia_externa: string | null
    banco_destino_id: string | null
}

export interface BancoData {
    id: string
    nombre_banco: string
    saldo_actual: number
}

// Get all banks
export async function getBancos(): Promise<BancoData[]> {
    const { data, error } = await supabase
        .from('tabla_bancos')
        .select('id, nombre_banco, saldo_actual')
        .order('nombre_banco')

    if (error) {
        console.error('Error fetching bancos:', error)
        return []
    }

    return data || []
}

// Get unconciliated financial movements for a specific bank
export async function getMovimientosNoConciliados(bancoId?: string): Promise<MovimientoFinanciero[]> {
    let query = supabase
        .from('tabla_movimientos_financieros')
        .select('*')
        .eq('conciliado', false)
        .order('fecha_movimiento', { ascending: false })

    if (bancoId) {
        query = query.eq('banco_destino_id', bancoId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching movimientos:', error)
        return []
    }

    return data || []
}

// Mark a movement as reconciled
export async function conciliarMovimiento(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('tabla_movimientos_financieros')
        .update({ conciliado: true })
        .eq('id', id)

    if (error) {
        console.error('Error conciliando movimiento:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// Bulk reconcile multiple movements
export async function conciliarMultiples(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    const { error, count } = await supabase
        .from('tabla_movimientos_financieros')
        .update({ conciliado: true })
        .in('id', ids)

    if (error) {
        console.error('Error conciliando movimientos:', error)
        return { success: false, count: 0, error: error.message }
    }

    return { success: true, count: count || ids.length }
}

// Create expense from bank discrepancy
export async function crearGastoDesdeDiscrepancia(input: {
    descripcion: string
    monto: number
    fecha: string
    bancoId: string
}): Promise<{ success: boolean; error?: string }> {
    // 1. Create the expense record
    const { error: gastoError } = await supabase
        .from('tabla_gastos')
        .insert({
            descripcion: input.descripcion,
            monto: Math.abs(input.monto),
            categoria: 'Otros',
            fecha: input.fecha,
        })

    if (gastoError) {
        console.error('Error creating gasto:', gastoError)
        return { success: false, error: gastoError.message }
    }

    // 2. Deduct from bank balance
    const { data: banco } = await supabase
        .from('tabla_bancos')
        .select('saldo_actual')
        .eq('id', input.bancoId)
        .single()

    if (banco) {
        await supabase
            .from('tabla_bancos')
            .update({ saldo_actual: banco.saldo_actual - Math.abs(input.monto) })
            .eq('id', input.bancoId)
    }

    // 3. Create financial movement (already reconciled since it comes from bank)
    await supabase.from('tabla_movimientos_financieros').insert({
        tipo: 'Egreso',
        monto: Math.abs(input.monto),
        descripcion: input.descripcion,
        banco_destino_id: input.bancoId,
        fecha_movimiento: input.fecha,
        conciliado: true, // Mark as reconciled since it's from bank statement
    })

    return { success: true }
}
