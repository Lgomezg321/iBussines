'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
    getCompras,
    getBackorderAlerts,
    getProductosParaCompra,
    getBancos,
    createCompra,
    recibirMercancia,
} from './actions'
import { useToast } from '@/components/Toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
    Package,
    Plus,
    Truck,
    AlertTriangle,
    CheckCircle,
    Clock,
    Search,
    X,
    Loader2,
} from 'lucide-react'

interface Producto {
    id: string
    nombre: string
    sku: string
    costo_promedio: number
    stock_actual: number
}

interface Banco {
    id: string
    nombre: string
    saldo_actual: number
}

interface CartItem {
    producto_id: string
    nombre: string
    sku: string
    cantidad: number
    costo_unitario: number
}

export default function ComprasPage() {
    const { showToast } = useToast()
    const [isPending, startTransition] = useTransition()

    const [compras, setCompras] = useState<any[]>([])
    const [backorders, setBackorders] = useState<any[]>([])
    const [productos, setProductos] = useState<Producto[]>([])
    const [bancos, setBancos] = useState<Banco[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [proveedorNombre, setProveedorNombre] = useState('')
    const [bancoOrigenId, setBancoOrigenId] = useState('')
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setIsLoading(true)
        const [comprasData, backordersData, productosData, bancosData] = await Promise.all([
            getCompras(),
            getBackorderAlerts(),
            getProductosParaCompra(),
            getBancos(),
        ])
        setCompras(comprasData)
        setBackorders(backordersData)
        setProductos(productosData)
        setBancos(bancosData)
        if (bancosData.length > 0) {
            setBancoOrigenId(bancosData[0].id)
        }
        setIsLoading(false)
    }

    const filteredProducts = productos.filter(
        (p) =>
            p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const addToCart = (producto: Producto) => {
        const existing = cartItems.find((item) => item.producto_id === producto.id)
        if (existing) {
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
                    costo_unitario: producto.costo_promedio,
                },
            ])
        }
        setSearchQuery('')
    }

    const updateQuantity = (producto_id: string, cantidad: number) => {
        if (cantidad < 1) return
        setCartItems((items) =>
            items.map((item) =>
                item.producto_id === producto_id ? { ...item, cantidad } : item
            )
        )
    }

    const updateCosto = (producto_id: string, costo: number) => {
        setCartItems((items) =>
            items.map((item) =>
                item.producto_id === producto_id ? { ...item, costo_unitario: costo } : item
            )
        )
    }

    const removeItem = (producto_id: string) => {
        setCartItems((items) => items.filter((item) => item.producto_id !== producto_id))
    }

    const total = cartItems.reduce(
        (sum, item) => sum + item.cantidad * item.costo_unitario,
        0
    )

    const handleCreateOrder = () => {
        if (!proveedorNombre.trim()) {
            showToast('Ingresa el nombre del proveedor', 'error')
            return
        }
        if (cartItems.length === 0) {
            showToast('Agrega al menos un producto', 'error')
            return
        }

        startTransition(async () => {
            const result = await createCompra({
                proveedor_nombre: proveedorNombre,
                banco_origen_id: bancoOrigenId,
                items: cartItems.map((item) => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    costo_unitario: item.costo_unitario,
                })),
            })

            if (result.success) {
                showToast(`Orden ${result.data.numero_orden} creada`, 'success')
                setShowModal(false)
                setProveedorNombre('')
                setCartItems([])
                fetchData()
            } else {
                showToast(result.error || 'Error al crear orden', 'error')
            }
        })
    }

    const handleRecibir = (compraId: string, numeroOrden: string) => {
        startTransition(async () => {
            const result = await recibirMercancia(compraId)

            if (result.success) {
                showToast(`${numeroOrden} recibida - Stock actualizado`, 'success')
                fetchData()
            } else {
                showToast(result.error || 'Error al recibir', 'error')
            }
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Compras</h1>
                    <p className="text-slate-500 mt-1">Gestiona órdenes de compra a proveedores</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25"
                >
                    <Plus size={20} />
                    Nueva Orden
                </button>
            </div>

            {/* Backorder Alerts */}
            {backorders.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle size={24} className="text-red-600" />
                        <h2 className="text-lg font-bold text-red-900">
                            ¡Productos en Backorder!
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {backorders.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-xl p-4 border border-red-200"
                            >
                                <p className="font-mono text-sm text-red-600">{item.sku}</p>
                                <p className="font-medium text-slate-900">{item.nombre}</p>
                                <p className="text-lg font-bold text-red-600 mt-2">
                                    Necesitas: {item.cantidad} unidades
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Truck size={20} className="text-slate-400" />
                        <span className="text-sm text-slate-500">Total Órdenes</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{compras.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock size={20} className="text-amber-500" />
                        <span className="text-sm text-slate-500">Pendientes</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                        {compras.filter((c) => c.estado === 'Ordenado').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle size={20} className="text-emerald-500" />
                        <span className="text-sm text-slate-500">Recibidas</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                        {compras.filter((c) => c.estado === 'Recibido').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle size={20} className="text-red-500" />
                        <span className="text-sm text-slate-500">Backorders</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{backorders.length}</p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                                    Orden
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                                    Proveedor
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                                    Items
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                                    Total
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                                    Fecha
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {compras.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Truck size={48} className="mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                            No hay órdenes de compra
                                        </h3>
                                        <p className="text-slate-500 mb-4">
                                            Crea tu primera orden de compra
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                compras.map((compra) => (
                                    <tr key={compra.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-medium text-slate-900">
                                                {compra.numero_orden}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-700">
                                                {compra.proveedor_nombre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-500">
                                                {compra.tabla_detalle_compra?.length || 0} productos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {formatCurrency(compra.total_compra)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={cn(
                                                    'px-3 py-1 rounded-full text-xs font-medium',
                                                    compra.estado === 'Recibido'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                )}
                                            >
                                                {compra.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-500">
                                                {formatDateTime(compra.fecha)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {compra.estado === 'Ordenado' && (
                                                <button
                                                    onClick={() => handleRecibir(compra.id, compra.numero_orden)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                >
                                                    <Package size={16} />
                                                    Recibir
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Nueva Orden Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Nueva Orden de Compra</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Proveedor */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Proveedor *
                                </label>
                                <input
                                    type="text"
                                    value={proveedorNombre}
                                    onChange={(e) => setProveedorNombre(e.target.value)}
                                    placeholder="Nombre del proveedor"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                />
                            </div>

                            {/* Banco */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Cuenta para Pago
                                </label>
                                <select
                                    value={bancoOrigenId}
                                    onChange={(e) => setBancoOrigenId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none bg-white"
                                >
                                    {bancos.map((banco) => (
                                        <option key={banco.id} value={banco.id}>
                                            {banco.nombre} ({formatCurrency(banco.saldo_actual)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Product Search */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Agregar Productos
                                </label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar producto..."
                                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    />
                                </div>

                                {searchQuery && (
                                    <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                                        {filteredProducts.map((producto) => (
                                            <button
                                                key={producto.id}
                                                onClick={() => addToCart(producto)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                            >
                                                <div>
                                                    <p className="font-medium text-slate-900">{producto.nombre}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {producto.sku} • Stock: {producto.stock_actual}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-emerald-600 font-medium">
                                                    {formatCurrency(producto.costo_promedio)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cart Items */}
                            {cartItems.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Items en la Orden
                                    </label>
                                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                                        {cartItems.map((item) => (
                                            <div key={item.producto_id} className="p-3 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900">{item.nombre}</p>
                                                    <p className="text-xs text-slate-500">{item.sku}</p>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.cantidad}
                                                    onChange={(e) =>
                                                        updateQuantity(item.producto_id, parseInt(e.target.value) || 1)
                                                    }
                                                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-center"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={item.costo_unitario}
                                                    onChange={(e) =>
                                                        updateCosto(item.producto_id, parseInt(e.target.value) || 0)
                                                    }
                                                    className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 text-right"
                                                />
                                                <button
                                                    onClick={() => removeItem(item.producto_id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <span className="font-semibold text-slate-700">Total Orden</span>
                                <span className="text-2xl font-bold text-emerald-600">
                                    {formatCurrency(total)}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateOrder}
                                disabled={isPending || cartItems.length === 0}
                                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Plus size={20} />
                                )}
                                Crear Orden
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
