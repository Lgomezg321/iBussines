'use client'

import { useState, useTransition } from 'react'
import { createProduct } from '@/app/inventarios/actions'
import { cn } from '@/lib/utils'
import { X, Package, Loader2 } from 'lucide-react'

interface NewProductDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function NewProductDialog({ isOpen, onClose, onSuccess }: NewProductDialogProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        nombre: '',
        sku: '',
        precio_venta: '',
        costo_promedio: '',
        imagen_url: '',
        tipo_producto: '',
        stock_inicial: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        startTransition(async () => {
            const result = await createProduct({
                nombre: formData.nombre,
                sku: formData.sku,
                precio_venta: parseFloat(formData.precio_venta) || 0,
                costo_promedio: parseFloat(formData.costo_promedio) || 0,
                imagen_url: formData.imagen_url || undefined,
                tipo_producto: formData.tipo_producto || undefined,
                stock_inicial: parseInt(formData.stock_inicial) || 0,
            })

            if (result.success) {
                setFormData({
                    nombre: '',
                    sku: '',
                    precio_venta: '',
                    costo_promedio: '',
                    imagen_url: '',
                    tipo_producto: '',
                    stock_inicial: '',
                })
                onSuccess?.()
                onClose()
            } else {
                setError(result.error || 'Error al crear producto')
            }
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Package size={20} className="text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Nuevo Producto</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Nombre del Producto *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Lámpara LED Premium"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        />
                    </div>

                    {/* SKU & Tipo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                SKU *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                placeholder="LAMP-001"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Tipo
                            </label>
                            <input
                                type="text"
                                value={formData.tipo_producto}
                                onChange={(e) => setFormData({ ...formData, tipo_producto: e.target.value })}
                                placeholder="Iluminación"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Precios */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Precio de Venta *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="100"
                                    value={formData.precio_venta}
                                    onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                                    placeholder="85000"
                                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Costo *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="100"
                                    value={formData.costo_promedio}
                                    onChange={(e) => setFormData({ ...formData, costo_promedio: e.target.value })}
                                    placeholder="50000"
                                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock Inicial */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Stock Inicial
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.stock_inicial}
                            onChange={(e) => setFormData({ ...formData, stock_inicial: e.target.value })}
                            placeholder="0"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        />
                        <p className="text-xs text-slate-500">
                            Se agregará automáticamente a la Bodega Principal
                        </p>
                    </div>

                    {/* Imagen URL */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            URL de Imagen
                        </label>
                        <input
                            type="url"
                            value={formData.imagen_url}
                            onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className={cn(
                                'flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium',
                                'hover:bg-blue-700 transition-colors flex items-center justify-center gap-2',
                                isPending && 'opacity-70 cursor-not-allowed'
                            )}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Crear Producto'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
