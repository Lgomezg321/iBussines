import { supabase } from '@/lib/supabase'
import { KPICard } from '@/components/KPICard'
import { getEstadoPagoBadge, getEstadoPedidoBadge } from '@/components/Badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  TrendingUp,
  Landmark,
  AlertTriangle,
  ArrowUpRight,
  Clock
} from 'lucide-react'

// Mock data for development (remove when Supabase is connected)
const mockData = {
  ventasMes: 4250000,
  saldoBancos: 1170000,
  alertasStock: 1,
  ultimasVentas: [
    {
      id: '1',
      numero_factura: 'FAC-001',
      cliente_nombre: 'Cliente Test',
      total_venta: 170000,
      estado_pago: 'Pagado',
      estado_pedido: 'En proceso',
      fecha: '2026-02-08T14:00:00Z',
    },
    {
      id: '2',
      numero_factura: 'FAC-002',
      cliente_nombre: 'Cliente Grande',
      total_venta: 850000,
      estado_pago: 'Pendiente',
      estado_pedido: 'Backorder',
      fecha: '2026-02-08T14:06:00Z',
    },
  ],
}

async function getDashboardData() {
  // Try to fetch from Supabase, fallback to mock data
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Ventas del mes
    const { data: ventas } = await supabase
      .from('tabla_ventas')
      .select('total_venta')
      .gte('fecha', firstDayOfMonth)

    const ventasMes = ventas?.reduce((sum, v) => sum + Number(v.total_venta), 0) || mockData.ventasMes

    // Saldo en bancos
    const { data: bancos } = await supabase
      .from('tabla_bancos')
      .select('saldo_actual')

    const saldoBancos = bancos?.reduce((sum, b) => sum + Number(b.saldo_actual), 0) || mockData.saldoBancos

    // Alertas de stock
    const { count: alertasStock } = await supabase
      .from('tabla_alertas')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'backorder')
      .eq('resuelta', false)

    // Últimas ventas
    const { data: ultimasVentas } = await supabase
      .from('tabla_ventas')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(5)

    return {
      ventasMes,
      saldoBancos,
      alertasStock: alertasStock || mockData.alertasStock,
      ultimasVentas: ultimasVentas || mockData.ultimasVentas,
    }
  } catch {
    // Return mock data if Supabase is not configured
    return mockData
  }
}

export default async function Dashboard() {
  const { ventasMes, saldoBancos, alertasStock, ultimasVentas } = await getDashboardData()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Resumen ejecutivo de tu negocio</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock size={16} />
          <span>Actualizado hace 5 min</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Ventas del Mes"
          value={formatCurrency(ventasMes)}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 12.5, label: 'vs mes anterior' }}
        />
        <KPICard
          title="Saldo en Bancos"
          value={formatCurrency(saldoBancos)}
          icon={Landmark}
          variant="default"
          subtitle="Todas las cuentas"
        />
        <KPICard
          title="Alertas de Stock"
          value={alertasStock}
          icon={AlertTriangle}
          variant={alertasStock > 0 ? 'danger' : 'success'}
          subtitle={alertasStock > 0 ? 'Productos en Backorder' : 'Sin alertas'}
        />
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Últimas Ventas</h2>
          <a
            href="/ventas"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver todas
            <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimasVentas.map((venta: any) => (
                <tr key={venta.id} className="hover:bg-slate-50/50 transition-colors">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
