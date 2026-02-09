'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface CreateProductInput {
    nombre: string
    sku: string
    precio_venta: number
    costo_promedio: number
    imagen_url?: string
    tipo_producto?: string
    stock_inicial: number
}

export async function createProduct(input: CreateProductInput) {
    // 1. Insert the product
    const { data: producto, error: productError } = await supabase
        .from('tabla_productos')
        .insert({
            nombre: input.nombre,
            sku: input.sku,
            precio_venta: input.precio_venta,
            costo_promedio: input.costo_promedio,
            imagen_url: input.imagen_url || null,
            tipo_producto: input.tipo_producto || null,
        })
        .select()
        .single()

    if (productError) {
        console.error('Error creating product:', productError)
        return { success: false, error: productError.message }
    }

    // 2. If stock_inicial > 0, add to inventory
    if (input.stock_inicial > 0) {
        // Find or create "Bodega Principal"
        let { data: bodega } = await supabase
            .from('tabla_bodegas')
            .select('id')
            .eq('nombre', 'Bodega Principal')
            .eq('tipo', 'fisica')
            .single()

        if (!bodega) {
            // Create Bodega Principal if it doesn't exist
            const { data: newBodega, error: bodegaError } = await supabase
                .from('tabla_bodegas')
                .insert({
                    nombre: 'Bodega Principal',
                    tipo: 'fisica',
                    descripcion: 'Bodega principal de inventario físico',
                })
                .select()
                .single()

            if (bodegaError) {
                console.error('Error creating bodega:', bodegaError)
                return { success: false, error: 'Producto creado pero error al crear bodega' }
            }
            bodega = newBodega
        }

        // Insert inventory record
        if (bodega) {
            const { error: inventoryError } = await supabase
                .from('tabla_inventario')
                .insert({
                    producto_id: producto.id,
                    bodega_id: bodega.id,
                    cantidad: input.stock_inicial,
                })

            if (inventoryError) {
                console.error('Error creating inventory:', inventoryError)
                return { success: false, error: 'Producto creado pero error al registrar inventario' }
            }
        }
    }

    revalidatePath('/inventarios')
    return { success: true, data: producto }
}

export async function getProductsWithStock() {
    const { data: productos, error } = await supabase
        .from('tabla_productos')
        .select(`
      *,
      tabla_inventario (
        cantidad,
        bodega_id,
        tabla_bodegas (
          nombre,
          tipo
        )
      )
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }

    // Calculate total stock per product
    return productos.map((producto: any) => {
        const totalStock = producto.tabla_inventario?.reduce(
            (sum: number, inv: any) => sum + Number(inv.cantidad),
            0
        ) || 0

        return {
            ...producto,
            stock_total: totalStock,
        }
    })
}
