'use client'

import { useState, useEffect, useTransition } from 'react'
import { getGastos, getBancos, createGasto, getGastosStats } from './actions'
import { useToast } from '@/components/Toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
    Wallet,
    Plus,
    Receipt,
    TrendingDown,
    Building2,
    Loader2,
    PieChart,
} from 'lucide-react'

interface Banco {
    id: string
    nombre: string
    saldo_actual: number
}

export default function GastosPage() {
    const { showToast } = useToast()
    const [isPending, startTransition] = useTransition()

    const [gastos, setGastos] = useState<any[]>([])
    const [bancos, setBancos] = useState<Banco[]>([])
    const categorias = [
        'Servicios',
        'Nómina',
        'Arriendo',
        'Suministros',
        'Marketing',
        'Transporte',
        'Impuestos',
        'Mantenimiento',
        'Otros',
    ]
    const [stats, setStats] = useState<{ total: number; porCategoria: Record<string, number> }>({
        total: 0,
        porCategoria: {},
    })
    const [isLoading, setIsLoading] = useState(true)

    // Form state
    const [descripcion, setDescripcion] = useState('')
    const [monto, setMonto] = useState('')
    const [categoria, setCategoria] = useState('Otros')
    const [bancoOrigenId, setBancoOrigenId] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setIsLoading(true)
        const [gastosData, bancosData, statsData] = await Promise.all([
            getGastos(),
            getBancos(),
            getGastosStats(),
        ])
        setGastos(gastosData)
        setBancos(bancosData)
        setStats(statsData)
        if (bancosData.length > 0) {
            setBancoOrigenId(bancosData[0].id)
        }
        setIsLoading(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!descripcion.trim()) {
            showToast('Ingresa una descripción', 'error')
            return
        }
        if (!monto || parseFloat(monto) <= 0) {
            showToast('Ingresa un monto válido', 'error')
            return
        }
        if (!bancoOrigenId) {
            showToast('Selecciona una cuenta', 'error')
            return
        }

        startTransition(async () => {
            const result = await createGasto({
                descripcion,
                monto: parseFloat(monto),
                categoria,
                banco_origen_id: bancoOrigenId,
            })

            if (result.success) {
                showToast('Gasto registrado - Saldo actualizado', 'success')
                setDescripcion('')
                setMonto('')
                setCategoria('Otros')
                fetchData()
            } else {
                showToast(result.error || 'Error al registrar gasto', 'error')
            }
        })
    }

    const selectedBanco = bancos.find((b) => b.id === bancoOrigenId)

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
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Gastos</h1>
                <p className="text-slate-500 mt-1">Registra y controla los gastos operativos</p>
            </div>

            {/* Stats + Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Stats */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Monthly Total */}
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingDown size={24} />
                            <span className="text-red-100">Gastos del Mes</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(stats.total)}</p>
                    </div>

                    {/* By Category */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <PieChart size={20} className="text-slate-400" />
                            <h3 className="font-semibold text-slate-900">Por Categoría</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(stats.porCategoria).length === 0 ? (
                                <p className="text-sm text-slate-500">Sin gastos este mes</p>
                            ) : (
                                Object.entries(stats.porCategoria)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([cat, amount]) => (
                                        <div key={cat} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">{cat}</span>
                                            <span className="text-sm font-semibold text-slate-900">
                                                {formatCurrency(amount)}
                                            </span>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Bank Balances */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Building2 size={20} className="text-slate-400" />
                            <h3 className="font-semibold text-slate-900">Saldos en Cuentas</h3>
                        </div>
                        <div className="space-y-3">
                            {bancos.map((banco) => (
                                <div key={banco.id} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">{banco.nombre}</span>
                                    <span
                                        className={cn(
                                            'text-sm font-semibold',
                                            banco.saldo_actual < 0 ? 'text-red-600' : 'text-emerald-600'
                                        )}
                                    >
                                        {formatCurrency(banco.saldo_actual)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Form + Table */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Form */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <Receipt size={20} className="text-red-600" />
                            </div>
                            <h2 className="font-semibold text-slate-900">Registrar Gasto</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Descripción *
                                    </label>
                                    <input
                                        type="text"
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        placeholder="Ej: Pago de servicios públicos"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Monto *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Categoría
                                    </label>
                                    <select
                                        value={categoria}
                                        onChange={(e) => setCategoria(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none bg-white"
                                    >
                                        {categorias.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Cuenta de Origen
                                    </label>
                                    <select
                                        value={bancoOrigenId}
                                        onChange={(e) => setBancoOrigenId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none bg-white"
                                    >
                                        {bancos.map((banco) => (
                                            <option key={banco.id} value={banco.id}>
                                                {banco.nombre} ({formatCurrency(banco.saldo_actual)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Preview */}
                            {monto && selectedBanco && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                    <p className="text-sm text-red-700">
                                        Al guardar, se restarán <strong>{formatCurrency(parseFloat(monto))}</strong> de{' '}
                                        <strong>{selectedBanco.nombre}</strong>
                                    </p>
                                    <p className="text-sm text-red-600 mt-1">
                                        Nuevo saldo:{' '}
                                        <strong>
                                            {formatCurrency(selectedBanco.saldo_actual - parseFloat(monto))}
                                        </strong>
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Plus size={20} />
                                )}
                                Registrar Gasto
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-900">Historial de Gastos</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                                            Descripción
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                                            Categoría
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                                            Cuenta
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                                            Monto
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {gastos.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
                                                <p className="text-slate-500">No hay gastos registrados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        gastos.map((gasto) => (
                                            <tr key={gasto.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-slate-500">
                                                        {formatDateTime(gasto.fecha)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-900">
                                                        {gasto.descripcion}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                                                        {gasto.categoria}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-slate-500">
                                                        {gasto.tabla_bancos?.nombre_banco}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-semibold text-red-600">
                                                        -{formatCurrency(gasto.monto)}
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
            </div>
        </div>
    )
}
