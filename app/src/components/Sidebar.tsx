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
    Menu,
    X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Inventarios', href: '/inventarios', icon: Package },
    { name: 'Gastos', href: '/gastos', icon: Receipt },
    { name: 'Compras', href: '/compras', icon: Truck },
    { name: 'Bancos', href: '/bancos/conciliacion', icon: Landmark },
]

// Mobile bottom navigation items (limited for bottom bar)
const mobileNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Gastos', href: '/gastos', icon: Receipt },
    { name: 'Más', href: '#menu', icon: Menu },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 hidden md:flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300',
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
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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

            {/* Mobile Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200 safe-area-inset-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {mobileNavigation.map((item) => {
                        const isActive = item.href !== '#menu' && (pathname === item.href || pathname.startsWith(item.href + '/'))
                        const isMenuButton = item.href === '#menu'

                        if (isMenuButton) {
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="flex flex-col items-center justify-center min-w-[64px] h-12 px-2 rounded-xl transition-colors text-slate-500"
                                >
                                    <Menu size={22} />
                                    <span className="text-[10px] font-medium mt-0.5">Más</span>
                                </button>
                            )
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center min-w-[64px] h-12 px-2 rounded-xl transition-colors',
                                    isActive
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-slate-500 active:bg-slate-100'
                                )}
                            >
                                <item.icon size={22} />
                                <span className="text-[10px] font-medium mt-0.5">{item.name}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Mobile Full Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Menu Panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
                        {/* Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1 bg-slate-300 rounded-full" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600"
                        >
                            <X size={20} />
                        </button>

                        {/* Navigation List */}
                        <div className="px-4 pb-8 pt-2">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 px-2">Menú</h2>
                            <div className="space-y-1">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium transition-all',
                                                isActive
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-700 active:bg-slate-100'
                                            )}
                                        >
                                            <item.icon size={24} />
                                            <span>{item.name}</span>
                                        </Link>
                                    )
                                })}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-slate-200 my-4" />

                            {/* Secondary items */}
                            <div className="space-y-1">
                                <Link
                                    href="/alertas"
                                    className="flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium text-slate-700 active:bg-slate-100"
                                >
                                    <Bell size={24} />
                                    <span>Alertas</span>
                                </Link>
                                <Link
                                    href="/configuracion"
                                    className="flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium text-slate-700 active:bg-slate-100"
                                >
                                    <Settings size={24} />
                                    <span>Configuración</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
