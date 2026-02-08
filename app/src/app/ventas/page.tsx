import Link from 'next/link'
import { getVentas } from './actions'
import { getEstadoPagoBadge, getEstadoPedidoBadge } from '@/components/Badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
    Plus,
    Receipt,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

export default async function VentasPage() {
    const ventas = await getVentas()

    // Calculate stats
    const stats = {
        total: ventas.length,
        pagadas: ventas.filter((v: any) => v.estado_pago === 'Pagado').length,
        pendientes: ventas.filter((v: any) => v.estado_pago === 'Pendiente').length,
        ingresos: ventas
            .filter((v: any) => v.estado_pago === 'Pagado')
            .reduce((sum: number, v: any) => sum + Number(v.total_venta), 0),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Ventas</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus facturas de venta</p>
                </div>
                <Link
                    href="/ventas/nueva"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                    <Plus size={20} />
                    Nueva Venta
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Receipt size={20} className="text-slate-400" />
                        <span className="text-sm text-slate-500">Total Ventas</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle size={20} className="text-emerald-500" />
                        <span className="text-sm text-slate-500">Pagadas</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.pagadas}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock size={20} className="text-amber-500" />
                        <span className="text-sm text-slate-500">Pendientes</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp size={20} className="text-blue-500" />
                        <span className="text-sm text-slate-500">Ingresos</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(stats.ingresos)}
                    </p>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Factura
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Productos
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Pago
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                            No hay ventas
                                        </h3>
                                        <p className="text-slate-500 mb-4">
                                            Crea tu primera venta para comenzar
                                        </p>
                                        <Link
                                            href="/ventas/nueva"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus size={20} />
                                            Nueva Venta
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                ventas.map((venta: any) => (
                                    <tr
                                        key={venta.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-medium text-slate-900">
                                                {venta.numero_factura}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-700">
                                                {venta.cliente_nombre || 'Sin nombre'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-500">
                                                {venta.tabla_detalle_venta?.length || 0} items
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {formatCurrency(venta.total_venta)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoPagoBadge(venta.estado_pago)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoPedidoBadge(venta.estado_pedido)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-500">
                                                {formatDateTime(venta.fecha)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
