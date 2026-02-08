'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Seed banks if they don't exist
export async function ensureBanksExist() {
    const { data: existingBanks, error: checkError } = await supabase
        .from('tabla_bancos')
        .select('id')
        .limit(1)

    if (checkError) {
        console.error('Error checking banks:', checkError)
        return
    }

    if (!existingBanks || existingBanks.length === 0) {
        const { error: insertError } = await supabase.from('tabla_bancos').insert([
            { nombre_banco: 'Caja General', saldo_actual: 0, tipo_cuenta: 'caja' },
            { nombre_banco: 'Banco Principal', saldo_actual: 0, tipo_cuenta: 'corriente' },
        ])
        if (insertError) {
            console.error('Error seeding banks:', insertError)
        }
    }
}

export async function getBancos() {
    await ensureBanksExist()

    const { data, error } = await supabase
        .from('tabla_bancos')
        .select('id, nombre_banco, saldo_actual, tipo_cuenta')
        .order('nombre_banco')

    if (error) {
        console.error('Error fetching bancos:', error)
        return []
    }

    // Map to expected interface
    return data.map((b: any) => ({
        id: b.id,
        nombre: b.nombre_banco,
        saldo_actual: b.saldo_actual,
    }))
}

export async function getProductosParaVenta() {
    const { data, error } = await supabase
        .from('tabla_productos')
        .select(`
      id,
      nombre,
      sku,
      precio_venta,
      costo_promedio,
      imagen_url,
      tabla_inventario (
        cantidad,
        tabla_bodegas (tipo)
      )
    `)
        .order('nombre')

    if (error) {
        console.error('Error fetching productos:', error)
        return []
    }

    return data.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        precio_venta: p.precio_venta,
        costo_promedio: p.costo_promedio,
        imagen_url: p.imagen_url,
        stock_disponible: p.tabla_inventario
            ?.filter((inv: any) => inv.tabla_bodegas?.tipo === 'fisica')
            .reduce((sum: number, inv: any) => sum + Number(inv.cantidad), 0) || 0,
    }))
}

export async function getVentas() {
    const { data, error } = await supabase
        .from('tabla_ventas')
        .select(`
      *,
      tabla_bancos (nombre_banco),
      tabla_detalle_venta (
        id,
        cantidad,
        precio_unitario,
        subtotal,
        tabla_productos (nombre, sku)
      )
    `)
        .order('fecha', { ascending: false })

    if (error) {
        console.error('Error fetching ventas:', error)
        return []
    }
    return data
}

export interface CreateVentaInput {
    cliente_nombre: string
    cliente_nit?: string
    banco_destino_id: string
    metodo_pago: string
    items: {
        producto_id: string
        cantidad: number
        precio_unitario: number
    }[]
}

export async function createVenta(input: CreateVentaInput) {
    // Calculate totals
    const subtotal = input.items.reduce(
        (sum, item) => sum + item.cantidad * item.precio_unitario,
        0
    )
    const total_venta = subtotal // No tax for now

    // Generate invoice number
    const { count } = await supabase
        .from('tabla_ventas')
        .select('*', { count: 'exact', head: true })

    const numero_factura = `FAC-${String((count || 0) + 1).padStart(4, '0')}`

    // 1. Create the sale header
    const { data: venta, error: ventaError } = await supabase
        .from('tabla_ventas')
        .insert({
            numero_factura,
            cliente_nombre: input.cliente_nombre,
            cliente_nit: input.cliente_nit || null,
            total_venta,
            banco_destino_id: input.banco_destino_id,
            estado_pago: 'Pagado', // Immediate payment
            estado_pedido: 'En proceso',
        })
        .select()
        .single()

    if (ventaError) {
        console.error('Error creating venta:', ventaError)
        return { success: false, error: ventaError.message }
    }

    // 2. Create sale details (triggers will handle inventory)
    const detalles = input.items.map((item) => ({
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
    }))

    const { error: detalleError } = await supabase
        .from('tabla_detalle_venta')
        .insert(detalles)

    if (detalleError) {
        console.error('Error creating detalle_venta:', detalleError)
        return { success: false, error: detalleError.message }
    }

    revalidatePath('/ventas')
    revalidatePath('/inventarios')
    revalidatePath('/')

    return { success: true, data: venta }
}
