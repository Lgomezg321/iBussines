'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProductsWithStock } from './actions'
import { ProductCard } from '@/components/ProductCard'
import { NewProductDialog } from '@/components/NewProductDialog'
import { Plus, Package, Search, Filter } from 'lucide-react'

interface Product {
    id: string
    nombre: string
    sku: string
    precio_venta: number
    costo_promedio: number
    imagen_url: string | null
    tipo_producto: string | null
    stock_total: number
}

export default function InventariosPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchProducts = useCallback(async () => {
        setIsLoading(true)
        const data = await getProductsWithStock()
        setProducts(data)
        setIsLoading(false)
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const filteredProducts = products.filter(
        (p) =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = {
        total: products.length,
        conStock: products.filter((p) => p.stock_total > 0).length,
        sinStock: products.filter((p) => p.stock_total === 0).length,
        valorInventario: products.reduce(
            (sum, p) => sum + p.costo_promedio * p.stock_total,
            0
        ),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Inventarios</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus productos y stock</p>
                </div>
                <button
                    onClick={() => setIsDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                    <Plus size={20} />
                    Nuevo Producto
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <p className="text-sm text-slate-500">Total Productos</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <p className="text-sm text-slate-500">Con Stock</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.conStock}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <p className="text-sm text-slate-500">Sin Stock</p>
                    <p className="text-2xl font-bold text-red-600">{stats.sinStock}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <p className="text-sm text-slate-500">Valor Inventario</p>
                    <p className="text-2xl font-bold text-blue-600">
                        ${stats.valorInventario.toLocaleString('es-CO')}
                    </p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                </div>
                <button className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-600">
                    <Filter size={18} />
                    Filtros
                </button>
            </div>

            {/* Product Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse"
                        >
                            <div className="aspect-square bg-slate-100" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-100 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                                <div className="h-5 bg-slate-100 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {searchTerm ? 'No se encontraron productos' : 'Sin productos'}
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {searchTerm
                            ? 'Intenta con otro término de búsqueda'
                            : 'Crea tu primer producto para comenzar'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={20} />
                            Crear Producto
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            nombre={product.nombre}
                            sku={product.sku}
                            precio_venta={product.precio_venta}
                            costo_promedio={product.costo_promedio}
                            imagen_url={product.imagen_url}
                            stock_total={product.stock_total}
                        />
                    ))}
                </div>
            )}

            {/* New Product Dialog */}
            <NewProductDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={fetchProducts}
            />
        </div>
    )
}
