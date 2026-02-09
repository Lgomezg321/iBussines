'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Get banks for payment selection
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

// Get products with current stock
export async function getProductosParaCompra() {
    const { data, error } = await supabase
        .from('tabla_productos')
        .select(`
      id,
      nombre,
      sku,
      costo_promedio,
      precio_venta,
      tabla_inventario (
        cantidad,
        tabla_bodegas (nombre, tipo)
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
        costo_promedio: p.costo_promedio,
        precio_venta: p.precio_venta,
        stock_actual: p.tabla_inventario?.reduce(
            (sum: number, inv: any) => sum + Number(inv.cantidad),
            0
        ) || 0,
    }))
}

// Get backorder alerts from ventas with 'Backorder' status
export async function getBackorderAlerts() {
    const { data, error } = await supabase
        .from('tabla_ventas')
        .select(`
      id,
      numero_factura,
      cliente_nombre,
      estado_pedido,
      tabla_detalle_venta (
        cantidad,
        tabla_productos (id, nombre, sku)
      )
    `)
        .eq('estado_pedido', 'Backorder')

    if (error) {
        console.error('Error fetching backorders:', error)
        return []
    }

    // Aggregate products needed
    const productosNecesarios: Record<string, { sku: string; nombre: string; cantidad: number }> = {}

    data?.forEach((venta: any) => {
        venta.tabla_detalle_venta?.forEach((detalle: any) => {
            const producto = detalle.tabla_productos
            if (producto) {
                const key = producto.id
                if (!productosNecesarios[key]) {
                    productosNecesarios[key] = {
                        sku: producto.sku,
                        nombre: producto.nombre,
                        cantidad: 0,
                    }
                }
                productosNecesarios[key].cantidad += detalle.cantidad
            }
        })
    })

    return Object.values(productosNecesarios)
}

// Get all purchase orders
export async function getCompras() {
    const { data, error } = await supabase
        .from('tabla_compras')
        .select(`
      *,
      tabla_detalle_compra (
        id,
        cantidad,
        costo_unitario,
        tabla_productos (nombre, sku)
      )
    `)
        .order('fecha', { ascending: false })

    if (error) {
        console.error('Error fetching compras:', error)
        return []
    }
    return data
}

export interface CreateCompraInput {
    proveedor_nombre: string
    banco_origen_id: string
    items: {
        producto_id: string
        cantidad: number
        costo_unitario: number
    }[]
}

export async function createCompra(input: CreateCompraInput) {
    // Calculate total
    const total_compra = input.items.reduce(
        (sum, item) => sum + item.cantidad * item.costo_unitario,
        0
    )

    // 1. Create the purchase header (columns: proveedor_nombre, total_compra, estado, fecha)
    const { data: compra, error: compraError } = await supabase
        .from('tabla_compras')
        .insert({
            proveedor: input.proveedor_nombre,
            total_compra,
            estado: 'Ordenado',
        })
        .select()
        .single()

    if (compraError) {
        console.error('Error creating compra:', compraError)
        return { success: false, error: compraError.message }
    }

    // 2. Create purchase details
    const detalles = input.items.map((item) => ({
        compra_id: compra.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
    }))

    const { error: detalleError } = await supabase
        .from('tabla_detalle_compra')
        .insert(detalles)

    if (detalleError) {
        console.error('Error creating detalle_compra:', detalleError)
        return { success: false, error: detalleError.message }
    }

    revalidatePath('/compras')
    revalidatePath('/inventarios')

    return { success: true, data: compra }
}

// Receive merchandise - updates inventory and bank balance
export async function recibirMercancia(compraId: string) {
    // 1. Get the purchase with its details
    const { data: compra, error: fetchError } = await supabase
        .from('tabla_compras')
        .select(`
      *,
      tabla_detalle_compra (
        producto_id,
        cantidad,
        costo_unitario
      )
    `)
        .eq('id', compraId)
        .single()

    if (fetchError || !compra) {
        console.error('Error fetching compra:', fetchError)
        return { success: false, error: 'Compra no encontrada' }
    }

    if (compra.estado === 'Recibido') {
        return { success: false, error: 'Esta compra ya fue recibida' }
    }

    // 2. Get the default bodega (fisica)
    const { data: bodega } = await supabase
        .from('tabla_bodegas')
        .select('id')
        .eq('tipo', 'fisica')
        .limit(1)
        .single()

    if (!bodega) {
        return { success: false, error: 'No hay bodega física configurada' }
    }

    // 3. Update inventory for each product
    for (const detalle of compra.tabla_detalle_compra) {
        // Check if inventory record exists
        const { data: existingInv } = await supabase
            .from('tabla_inventario')
            .select('id, cantidad')
            .eq('producto_id', detalle.producto_id)
            .eq('bodega_id', bodega.id)
            .single()

        if (existingInv) {
            // Update existing inventory
            await supabase
                .from('tabla_inventario')
                .update({ cantidad: existingInv.cantidad + detalle.cantidad })
                .eq('id', existingInv.id)
        } else {
            // Create new inventory record
            await supabase
                .from('tabla_inventario')
                .insert({
                    producto_id: detalle.producto_id,
                    bodega_id: bodega.id,
                    cantidad: detalle.cantidad,
                })
        }

        // Update product's average cost
        await supabase
            .from('tabla_productos')
            .update({ costo_promedio: detalle.costo_unitario })
            .eq('id', detalle.producto_id)
    }

    // 4. Deduct from bank balance
    if (compra.banco_origen_id) {
        const { data: banco } = await supabase
            .from('tabla_bancos')
            .select('saldo_actual')
            .eq('id', compra.banco_origen_id)
            .single()

        if (banco) {
            await supabase
                .from('tabla_bancos')
                .update({ saldo_actual: banco.saldo_actual - compra.total_compra })
                .eq('id', compra.banco_origen_id)
        }

        // 5. Log financial movement
        await supabase.from('tabla_movimientos_financieros').insert({
            tipo: 'Egreso',
            monto: compra.total_compra,
            descripcion: `Pago compra ${compra.numero_orden}`,
            banco_destino_id: compra.banco_origen_id,
            referencia_tipo: 'compra',
            referencia_id: compra.id,
        })
    }

    // 6. Update purchase status
    const { error: updateError } = await supabase
        .from('tabla_compras')
        .update({
            estado: 'Recibido',
            fecha_recepcion: new Date().toISOString(),
        })
        .eq('id', compraId)

    if (updateError) {
        console.error('Error updating compra:', updateError)
        return { success: false, error: updateError.message }
    }

    revalidatePath('/compras')
    revalidatePath('/inventarios')
    revalidatePath('/')

    return { success: true }
}
