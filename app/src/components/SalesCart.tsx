'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

export interface CartItem {
    producto_id: string
    nombre: string
    sku: string
    cantidad: number
    precio_unitario: number
    stock_disponible: number
}

interface SalesCartProps {
    items: CartItem[]
    onUpdateQuantity: (producto_id: string, cantidad: number) => void
    onRemove: (producto_id: string) => void
}

export function SalesCart({ items, onUpdateQuantity, onRemove }: SalesCartProps) {
    const subtotal = items.reduce(
        (sum, item) => sum + item.cantidad * item.precio_unitario,
        0
    )

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Ticket de Venta</h2>
                <p className="text-sm text-slate-500">
                    {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </p>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <Trash2 size={24} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">Carrito vacío</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Busca productos para agregar
                        </p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.producto_id}
                            className="bg-white rounded-xl border border-slate-200 p-4"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate">
                                        {item.nombre}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                                </div>
                                <button
                                    onClick={() => onRemove(item.producto_id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() =>
                                            onUpdateQuantity(item.producto_id, item.cantidad - 1)
                                        }
                                        disabled={item.cantidad <= 1}
                                        className={cn(
                                            'w-8 h-8 flex items-center justify-center rounded-md',
                                            'hover:bg-white transition-colors',
                                            item.cantidad <= 1 && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-10 text-center font-semibold text-slate-900">
                                        {item.cantidad}
                                    </span>
                                    <button
                                        onClick={() =>
                                            onUpdateQuantity(item.producto_id, item.cantidad + 1)
                                        }
                                        disabled={item.cantidad >= item.stock_disponible}
                                        className={cn(
                                            'w-8 h-8 flex items-center justify-center rounded-md',
                                            'hover:bg-white transition-colors',
                                            item.cantidad >= item.stock_disponible &&
                                            'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Line Total */}
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">
                                        {formatCurrency(item.precio_unitario)} c/u
                                    </p>
                                    <p className="font-bold text-slate-900">
                                        {formatCurrency(item.cantidad * item.precio_unitario)}
                                    </p>
                                </div>
                            </div>

                            {/* Stock Warning */}
                            {item.cantidad === item.stock_disponible && (
                                <p className="text-xs text-amber-600 mt-2">
                                    Máximo stock disponible
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Summary */}
            {items.length > 0 && (
                <div className="border-t border-slate-200 p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-semibold text-slate-900">
                            {formatCurrency(subtotal)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-lg">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="font-bold text-2xl text-blue-600">
                            {formatCurrency(subtotal)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
