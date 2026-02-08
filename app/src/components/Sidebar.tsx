'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Receipt,
    Truck,
    Landmark,
    Bell,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Inventarios', href: '/inventarios', icon: Package },
    { name: 'Gastos', href: '/gastos', icon: Receipt },
    { name: 'Compras', href: '/compras', icon: Truck },
    { name: 'Bancos', href: '/bancos', icon: Landmark },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50">
                {!collapsed && (
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        iBusiness
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            )}
                        >
                            <item.icon size={20} className={cn(isActive && 'text-blue-400')} />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom section */}
            <div className="p-2 border-t border-slate-700/50 space-y-1">
                <Link
                    href="/alertas"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                    <Bell size={20} />
                    {!collapsed && <span>Alertas</span>}
                </Link>
                <Link
                    href="/configuracion"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                    <Settings size={20} />
                    {!collapsed && <span>Configuración</span>}
                </Link>
            </div>

            {/* User section */}
            {!collapsed && (
                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                            LG
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Lucas Gómez</p>
                            <p className="text-xs text-slate-400 truncate">Administrador</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    )
}
