'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface Producto {
    id: string
    nombre: string
    sku: string
    precio_venta: number
    stock_disponible: number
}

interface ProductSearchProps {
    productos: Producto[]
    onSelect: (producto: Producto) => void
    disabled?: boolean
}

export function ProductSearch({ productos, onSelect, disabled }: ProductSearchProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const filtered = productos.filter(
        (p) =>
            p.nombre.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
    )

    useEffect(() => {
        setHighlightedIndex(0)
    }, [search])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex((prev) => Math.max(prev - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (filtered[highlightedIndex]) {
                    handleSelect(filtered[highlightedIndex])
                }
                break
            case 'Escape':
                setIsOpen(false)
                break
        }
    }

    const handleSelect = (producto: Producto) => {
        onSelect(producto)
        setSearch('')
        setIsOpen(false)
        inputRef.current?.focus()
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={cn(
                        'w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200',
                        'bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
                        'transition-all outline-none text-base',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                />
            </div>

            {/* Dropdown */}
            {isOpen && search && (
                <div
                    ref={listRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-80 overflow-y-auto"
                >
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">
                            No se encontraron productos
                        </div>
                    ) : (
                        filtered.map((producto, index) => (
                            <button
                                key={producto.id}
                                onClick={() => handleSelect(producto)}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 text-left transition-colors',
                                    'hover:bg-slate-50',
                                    index === highlightedIndex && 'bg-blue-50',
                                    index !== filtered.length - 1 && 'border-b border-slate-100'
                                )}
                            >
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package size={20} className="text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 truncate">
                                        {producto.nombre}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {producto.sku} • Stock: {' '}
                                        <span
                                            className={cn(
                                                'font-semibold',
                                                producto.stock_disponible === 0
                                                    ? 'text-red-600'
                                                    : producto.stock_disponible < 10
                                                        ? 'text-amber-600'
                                                        : 'text-emerald-600'
                                            )}
                                        >
                                            {producto.stock_disponible}
                                        </span>
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-blue-600">
                                        {formatCurrency(producto.precio_venta)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
