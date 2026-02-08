import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type-safe database types (run: npx supabase gen types typescript)
export type Database = {
  public: {
    Tables: {
      tabla_productos: {
        Row: {
          id: string
          sku: string
          nombre: string
          tipo_producto: string | null
          imagen_url: string | null
          costo_promedio: number
          precio_venta: number
          created_at: string
          updated_at: string
        }
      }
      tabla_ventas: {
        Row: {
          id: string
          fecha: string
          numero_factura: string | null
          cliente_nit: string | null
          cliente_nombre: string | null
          estado_pago: 'Pendiente' | 'Parcial' | 'Pagado'
          estado_pedido: 'En proceso' | 'Entregado' | 'Backorder' | 'Cancelado'
          total_venta: number
          banco_destino_id: string | null
          created_at: string
          updated_at: string
        }
      }
      tabla_bancos: {
        Row: {
          id: string
          nombre_banco: string
          tipo_cuenta: 'corriente' | 'ahorros' | 'caja'
          numero_cuenta: string | null
          saldo_actual: number
          activo: boolean
          created_at: string
          updated_at: string
        }
      }
      tabla_alertas: {
        Row: {
          id: string
          tipo: 'stock_bajo' | 'backorder' | 'pago_pendiente' | 'error_sistema'
          mensaje: string
          referencia_tipo: string | null
          referencia_id: string | null
          leida: boolean
          resuelta: boolean
          created_at: string
          resolved_at: string | null
        }
      }
      tabla_inventario: {
        Row: {
          id: string
          producto_id: string
          bodega_id: string
          cantidad: number
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
