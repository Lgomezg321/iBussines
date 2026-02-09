'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import Link from 'next/link'
import {
    getBancos,
    getMovimientosNoConciliados,
    conciliarMovimiento,
    conciliarMultiples,
    crearGastoDesdeDiscrepancia,
    type MovimientoFinanciero,
    type BancoData
} from './actions'

// CSV Row Type
interface CSVRow {
    Fecha: string
    Descripción: string
    Monto: string
}

interface ParsedBankRecord {
    fecha: Date
    descripcion: string
    monto: number // Negative for expenses, positive for income
    originalRow: CSVRow
}

// Match Result Types
interface MatchResult {
    type: 'match' | 'discrepancy' | 'missing'
    bankRecord?: ParsedBankRecord
    systemRecord?: MovimientoFinanciero
}

// Format currency
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(amount)
}

// Format date
function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Date difference in days
function daysDifference(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000
    return Math.abs(Math.floor((date1.getTime() - date2.getTime()) / msPerDay))
}

export default function ConciliacionPage() {
    const [bancos, setBancos] = useState<BancoData[]>([])
    const [selectedBanco, setSelectedBanco] = useState<string>('')
    const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([])
    const [bankRecords, setBankRecords] = useState<ParsedBankRecord[]>([])
    const [matchResults, setMatchResults] = useState<MatchResult[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<ParsedBankRecord | null>(null)
    const [uploadedFileName, setUploadedFileName] = useState<string>('')

    // Load banks on mount
    useEffect(() => {
        async function loadData() {
            const bancosData = await getBancos()
            setBancos(bancosData)
        }
        loadData()
    }, [])

    // Load movements when bank is selected
    useEffect(() => {
        async function loadMovimientos() {
            if (selectedBanco) {
                const data = await getMovimientosNoConciliados(selectedBanco)
                setMovimientos(data)
            } else {
                setMovimientos([])
            }
        }
        loadMovimientos()
    }, [selectedBanco])

    // Dropzone config
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        setUploadedFileName(file.name)
        setIsProcessing(true)

        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsed: ParsedBankRecord[] = results.data
                    .filter(row => row.Fecha && row.Monto)
                    .map(row => ({
                        fecha: new Date(row.Fecha),
                        descripcion: row.Descripción || (row as unknown as Record<string, string>)['Descripcion'] || '',
                        monto: parseFloat(row.Monto.replace(/[^0-9.-]/g, '')),
                        originalRow: row,
                    }))
                    .filter(record => !isNaN(record.monto))

                setBankRecords(parsed)
                runMatching(parsed)
                setIsProcessing(false)
            },
            error: (error) => {
                console.error('CSV Parse Error:', error)
                setIsProcessing(false)
            },
        })
    }, [movimientos])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv'],
        },
        maxFiles: 1,
    })

    // Matching Algorithm
    const runMatching = (bankData: ParsedBankRecord[]) => {
        const results: MatchResult[] = []
        const matchedSystemIds = new Set<string>()
        const matchedBankIndices = new Set<number>()

        // For each bank record, try to find a matching system record
        bankData.forEach((bankRecord, bankIndex) => {
            const matchingSystem = movimientos.find(mov => {
                if (matchedSystemIds.has(mov.id)) return false

                // Compare amounts (bank uses +/- while system stores absolute with tipo)
                const systemAmount = mov.tipo === 'Egreso' ? -mov.monto : mov.monto
                const amountMatch = Math.abs(bankRecord.monto - systemAmount) < 0.01

                if (!amountMatch) return false

                // Optional: Date within +/- 3 days
                const movDate = new Date(mov.fecha_movimiento)
                const dateMatch = daysDifference(bankRecord.fecha, movDate) <= 3

                return dateMatch
            })

            if (matchingSystem) {
                matchedSystemIds.add(matchingSystem.id)
                matchedBankIndices.add(bankIndex)
                results.push({
                    type: 'match',
                    bankRecord,
                    systemRecord: matchingSystem,
                })
            } else {
                // Discrepancy: Bank has it, system doesn't
                results.push({
                    type: 'discrepancy',
                    bankRecord,
                })
            }
        })

        // Find missing: System has it, bank doesn't
        movimientos.forEach(mov => {
            if (!matchedSystemIds.has(mov.id)) {
                results.push({
                    type: 'missing',
                    systemRecord: mov,
                })
            }
        })

        setMatchResults(results)
    }

    // Re-run matching when movimientos change
    useEffect(() => {
        if (bankRecords.length > 0 && movimientos.length >= 0) {
            runMatching(bankRecords)
        }
    }, [movimientos])

    // Handle reconcile single
    const handleReconcile = async (id: string) => {
        const result = await conciliarMovimiento(id)
        if (result.success) {
            // Reload movements
            const data = await getMovimientosNoConciliados(selectedBanco)
            setMovimientos(data)
        }
    }

    // Handle reconcile all matches
    const handleReconcileAll = async () => {
        const matchIds = matchResults
            .filter(r => r.type === 'match' && r.systemRecord)
            .map(r => r.systemRecord!.id)

        if (matchIds.length === 0) return

        const result = await conciliarMultiples(matchIds)
        if (result.success) {
            const data = await getMovimientosNoConciliados(selectedBanco)
            setMovimientos(data)
        }
    }

    // Handle create expense from discrepancy
    const handleCreateExpense = async () => {
        if (!selectedDiscrepancy || !selectedBanco) return

        const result = await crearGastoDesdeDiscrepancia({
            descripcion: selectedDiscrepancy.descripcion || 'Gasto bancario',
            monto: selectedDiscrepancy.monto,
            fecha: selectedDiscrepancy.fecha.toISOString(),
            bancoId: selectedBanco,
        })

        if (result.success) {
            setShowModal(false)
            setSelectedDiscrepancy(null)
            // Reload and re-process
            const data = await getMovimientosNoConciliados(selectedBanco)
            setMovimientos(data)
        }
    }

    // Stats
    const stats = {
        matches: matchResults.filter(r => r.type === 'match').length,
        discrepancies: matchResults.filter(r => r.type === 'discrepancy').length,
        missing: matchResults.filter(r => r.type === 'missing').length,
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-slate-400 hover:text-slate-600">
                                ← Volver
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Conciliación Bancaria</h1>
                                <p className="text-slate-500">Compara extractos bancarios con registros internos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Bank Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-700 mb-4">1. Selecciona la Cuenta Bancaria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {bancos.map(banco => (
                            <button
                                key={banco.id}
                                onClick={() => setSelectedBanco(banco.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedBanco === banco.id
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200 hover:border-emerald-300'
                                    }`}
                            >
                                <div className="font-semibold text-slate-800">{banco.nombre_banco}</div>
                                <div className="text-emerald-600 font-bold">{formatCurrency(banco.saldo_actual)}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dropzone */}
                {selectedBanco && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">2. Sube el Extracto Bancario (CSV)</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            El archivo debe tener columnas: <code className="bg-slate-100 px-1 rounded">Fecha</code>,
                            <code className="bg-slate-100 px-1 rounded ml-1">Descripción</code>,
                            <code className="bg-slate-100 px-1 rounded ml-1">Monto</code> (negativo = salida, positivo = entrada)
                        </p>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className="text-5xl mb-4">📄</div>
                            {isDragActive ? (
                                <p className="text-lg text-emerald-600 font-semibold">Suelta el archivo aquí...</p>
                            ) : uploadedFileName ? (
                                <div>
                                    <p className="text-lg text-emerald-600 font-semibold">✓ {uploadedFileName}</p>
                                    <p className="text-slate-500 mt-2">Arrastra otro archivo para reemplazar</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-lg text-slate-700 font-semibold">Arrastra tu archivo CSV aquí</p>
                                    <p className="text-slate-500 mt-2">o haz clic para seleccionar</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Processing indicator */}
                {isProcessing && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                        <div className="animate-spin text-4xl mb-4">⚙️</div>
                        <p className="text-slate-600">Analizando transacciones...</p>
                    </div>
                )}

                {/* Results */}
                {matchResults.length > 0 && !isProcessing && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">✅</span>
                                    <div>
                                        <div className="text-3xl font-bold text-emerald-600">{stats.matches}</div>
                                        <div className="text-emerald-700">Coincidencias</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">⚠️</span>
                                    <div>
                                        <div className="text-3xl font-bold text-red-600">{stats.discrepancies}</div>
                                        <div className="text-red-700">Discrepancias</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">❓</span>
                                    <div>
                                        <div className="text-3xl font-bold text-amber-600">{stats.missing}</div>
                                        <div className="text-amber-700">Faltantes en Banco</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Matches Section */}
                        {stats.matches > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
                                <div className="bg-emerald-50 px-6 py-4 flex items-center justify-between">
                                    <h3 className="font-semibold text-emerald-800">✅ Coincidencias ({stats.matches})</h3>
                                    <button
                                        onClick={handleReconcileAll}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
                                    >
                                        Conciliar Todas
                                    </button>
                                </div>
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-left">
                                        <tr>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Fecha</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Banco</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Sistema</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Monto</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matchResults
                                            .filter(r => r.type === 'match')
                                            .map((result, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-sm">
                                                        {result.bankRecord && formatDate(result.bankRecord.fecha)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {result.bankRecord?.descripcion}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {result.systemRecord?.descripcion}
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm font-semibold ${(result.bankRecord?.monto || 0) < 0 ? 'text-red-600' : 'text-emerald-600'
                                                        }`}>
                                                        {result.bankRecord && formatCurrency(result.bankRecord.monto)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => result.systemRecord && handleReconcile(result.systemRecord.id)}
                                                            className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                                                        >
                                                            Conciliar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Discrepancies Section */}
                        {stats.discrepancies > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                                <div className="bg-red-50 px-6 py-4">
                                    <h3 className="font-semibold text-red-800">⚠️ Discrepancias - En Banco pero NO en Sistema ({stats.discrepancies})</h3>
                                    <p className="text-sm text-red-600 mt-1">Estos movimientos aparecen en tu extracto pero no están registrados internamente</p>
                                </div>
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-left">
                                        <tr>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Fecha</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Descripción</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Monto</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matchResults
                                            .filter(r => r.type === 'discrepancy')
                                            .map((result, idx) => (
                                                <tr key={idx} className="hover:bg-red-50/50">
                                                    <td className="px-6 py-4 text-sm">
                                                        {result.bankRecord && formatDate(result.bankRecord.fecha)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {result.bankRecord?.descripcion}
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm font-semibold ${(result.bankRecord?.monto || 0) < 0 ? 'text-red-600' : 'text-emerald-600'
                                                        }`}>
                                                        {result.bankRecord && formatCurrency(result.bankRecord.monto)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDiscrepancy(result.bankRecord || null)
                                                                setShowModal(true)
                                                            }}
                                                            className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition font-medium text-sm"
                                                        >
                                                            + Crear Gasto
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Missing Section */}
                        {stats.missing > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
                                <div className="bg-amber-50 px-6 py-4">
                                    <h3 className="font-semibold text-amber-800">❓ Faltantes - En Sistema pero NO en Banco ({stats.missing})</h3>
                                    <p className="text-sm text-amber-600 mt-1">Estos movimientos están en el sistema pero no aparecen en el extracto bancario</p>
                                </div>
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-left">
                                        <tr>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Fecha</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Descripción</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Tipo</th>
                                            <th className="px-6 py-3 text-sm font-medium text-slate-500">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matchResults
                                            .filter(r => r.type === 'missing')
                                            .map((result, idx) => (
                                                <tr key={idx} className="hover:bg-amber-50/50">
                                                    <td className="px-6 py-4 text-sm">
                                                        {result.systemRecord && formatDate(result.systemRecord.fecha_movimiento)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {result.systemRecord?.descripcion || '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.systemRecord?.tipo === 'Egreso'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                            {result.systemRecord?.tipo}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm font-semibold ${result.systemRecord?.tipo === 'Egreso' ? 'text-red-600' : 'text-emerald-600'
                                                        }`}>
                                                        {result.systemRecord && formatCurrency(result.systemRecord.monto)}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Empty state */}
                {!selectedBanco && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="text-6xl mb-4">🏦</div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">Selecciona una cuenta para comenzar</h3>
                        <p className="text-slate-500">Elige la cuenta bancaria que deseas conciliar con tu extracto</p>
                    </div>
                )}
            </main>

            {/* Create Expense Modal */}
            {showModal && selectedDiscrepancy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-xl font-semibold text-slate-800">Crear Gasto desde Discrepancia</h3>
                            <p className="text-slate-500 mt-1">Este movimiento se registrará y marcará como conciliado</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    value={selectedDiscrepancy.descripcion}
                                    readOnly
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                                <input
                                    type="text"
                                    value={formatCurrency(Math.abs(selectedDiscrepancy.monto))}
                                    readOnly
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-red-600 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                <input
                                    type="text"
                                    value={formatDate(selectedDiscrepancy.fecha)}
                                    readOnly
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateExpense}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                Crear Gasto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
