'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getProductosParaVenta, getBancos, createVenta } from '../actions'
import { ProductSearch } from '@/components/ProductSearch'
import { SalesCart, CartItem } from '@/components/SalesCart'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import {
    User,
    CreditCard,
    Building2,
    Loader2,
    ArrowLeft,
    CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface Producto {
    id: string
    nombre: string
    sku: string
    precio_venta: number
    stock_disponible: number
}

interface Banco {
    id: string
    nombre: string
    saldo_actual: number
}

export default function NuevaVentaPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [isPending, startTransition] = useTransition()

    const [productos, setProductos] = useState<Producto[]>([])
    const [bancos, setBancos] = useState<Banco[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form state
    const [clienteNombre, setClienteNombre] = useState('')
    const [clienteNit, setClienteNit] = useState('')
    const [metodoPago, setMetodoPago] = useState('efectivo')
    const [bancoDestinoId, setBancoDestinoId] = useState('')
    const [cartItems, setCartItems] = useState<CartItem[]>([])

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            const [productosData, bancosData] = await Promise.all([
                getProductosParaVenta(),
                getBancos(),
            ])
            setProductos(productosData)
            setBancos(bancosData)
            if (bancosData.length > 0) {
                setBancoDestinoId(bancosData[0].id)
            }
            setIsLoading(false)
        }
        fetchData()
    }, [])

    const handleAddProduct = (producto: Producto) => {
        if (producto.stock_disponible === 0) {
            showToast('Producto sin stock disponible', 'error')
            return
        }

        const existing = cartItems.find((item) => item.producto_id === producto.id)
        if (existing) {
            if (existing.cantidad >= producto.stock_disponible) {
                showToast('Máximo stock alcanzado', 'error')
                return
            }
            setCartItems((items) =>
                items.map((item) =>
                    item.producto_id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                )
            )
        } else {
            setCartItems((items) => [
                ...items,
                {
                    producto_id: producto.id,
                    nombre: producto.nombre,
                    sku: producto.sku,
                    cantidad: 1,
                    precio_unitario: producto.precio_venta,
                    stock_disponible: producto.stock_disponible,
                },
            ])
        }
        showToast(`${producto.nombre} agregado`, 'success')
    }

    const handleUpdateQuantity = (producto_id: string, cantidad: number) => {
        if (cantidad < 1) return
        setCartItems((items) =>
            items.map((item) =>
                item.producto_id === producto_id ? { ...item, cantidad } : item
            )
        )
    }

    const handleRemoveItem = (producto_id: string) => {
        setCartItems((items) => items.filter((item) => item.producto_id !== producto_id))
    }

    const handleSubmit = () => {
        if (!clienteNombre.trim()) {
            showToast('Ingresa el nombre del cliente', 'error')
            return
        }
        if (cartItems.length === 0) {
            showToast('Agrega al menos un producto', 'error')
            return
        }
        if (!bancoDestinoId) {
            showToast('Selecciona una cuenta destino', 'error')
            return
        }

        startTransition(async () => {
            const result = await createVenta({
                cliente_nombre: clienteNombre,
                cliente_nit: clienteNit || undefined,
                banco_destino_id: bancoDestinoId,
                metodo_pago: metodoPago,
                items: cartItems.map((item) => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                })),
            })

            if (result.success) {
                showToast(`Venta ${result.data.numero_factura} creada exitosamente`, 'success')
                router.push('/ventas')
            } else {
                showToast(result.error || 'Error al crear venta', 'error')
            }
        })
    }

    const total = cartItems.reduce(
        (sum, item) => sum + item.cantidad * item.precio_unitario,
        0
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6">
            {/* Left Side - Input Form */}
            <div className="flex-1 space-y-6 overflow-y-auto pb-24 lg:pb-6">
                {/* Back Link */}
                <Link
                    href="/ventas"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Volver a Ventas
                </Link>

                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Nueva Venta</h1>
                    <p className="text-slate-500 mt-1">Crea una nueva factura de venta</p>
                </div>

                {/* Customer Info */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <User size={20} className="text-blue-600" />
                        </div>
                        <h2 className="font-semibold text-slate-900">Datos del Cliente</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Nombre del Cliente *
                            </label>
                            <input
                                type="text"
                                value={clienteNombre}
                                onChange={(e) => setClienteNombre(e.target.value)}
                                placeholder="Nombre completo o empresa"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                NIT / Cédula
                            </label>
                            <input
                                type="text"
                                value={clienteNit}
                                onChange={(e) => setClienteNit(e.target.value)}
                                placeholder="Opcional"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Product Search */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <h2 className="font-semibold text-slate-900">Agregar Productos</h2>
                    </div>

                    <ProductSearch
                        productos={productos}
                        onSelect={handleAddProduct}
                    />
                </div>

                {/* Payment Details */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-100 rounded-xl">
                            <CreditCard size={20} className="text-violet-600" />
                        </div>
                        <h2 className="font-semibold text-slate-900">Método de Pago</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Método
                            </label>
                            <select
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="tarjeta">Tarjeta</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Building2 size={16} />
                                Cuenta Destino
                            </label>
                            <select
                                value={bancoDestinoId}
                                onChange={(e) => setBancoDestinoId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white"
                            >
                                {bancos.map((banco) => (
                                    <option key={banco.id} value={banco.id}>
                                        {banco.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Cart/Ticket */}
            <div className="w-full lg:w-[400px] bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col">
                <SalesCart
                    items={cartItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                />

                {/* Submit Button */}
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || cartItems.length === 0}
                        className={cn(
                            'w-full py-4 rounded-xl font-semibold text-lg',
                            'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
                            'flex items-center justify-center gap-2',
                            'shadow-lg shadow-blue-500/25',
                            (isPending || cartItems.length === 0) && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Finalizar Venta
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
