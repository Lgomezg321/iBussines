import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { Package } from 'lucide-react'

interface ProductCardProps {
    id: string
    nombre: string
    sku: string
    precio_venta: number
    costo_promedio: number
    imagen_url: string | null
    stock_total: number
    onClick?: () => void
}

function StockBadge({ stock }: { stock: number }) {
    const getVariant = () => {
        if (stock === 0) return 'bg-red-100 text-red-700 border-red-200'
        if (stock < 10) return 'bg-amber-100 text-amber-700 border-amber-200'
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }

    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                getVariant()
            )}
        >
            {stock === 0 ? 'Sin stock' : `${stock} uds`}
        </span>
    )
}

export function ProductCard({
    nombre,
    sku,
    precio_venta,
    costo_promedio,
    imagen_url,
    stock_total,
    onClick,
}: ProductCardProps) {
    const margen = precio_venta > 0 && costo_promedio > 0
        ? ((precio_venta - costo_promedio) / precio_venta * 100).toFixed(0)
        : null

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative bg-white rounded-2xl border border-slate-200/60 overflow-hidden',
                'shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all duration-300',
                'hover:scale-[1.02] cursor-pointer'
            )}
        >
            {/* Image Container */}
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                {imagen_url ? (
                    <img
                        src={imagen_url}
                        alt={nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package
                            size={64}
                            className="text-slate-300 group-hover:text-slate-400 transition-colors"
                        />
                    </div>
                )}

                {/* Stock Badge Overlay */}
                <div className="absolute top-3 right-3">
                    <StockBadge stock={stock_total} />
                </div>

                {/* Margin Badge */}
                {margen && (
                    <div className="absolute bottom-3 left-3">
                        <span className="bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm">
                            {margen}% margen
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-tight">
                        {nombre}
                    </h3>
                </div>

                <p className="text-xs text-slate-400 font-mono">
                    {sku}
                </p>

                <div className="flex items-baseline justify-between pt-1">
                    <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(precio_venta)}
                    </span>
                    <span className="text-xs text-slate-400">
                        Costo: {formatCurrency(costo_promedio)}
                    </span>
                </div>
            </div>
        </div>
    )
}
