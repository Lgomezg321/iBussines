import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    trend?: {
        value: number
        label: string
    }
    variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
    default: 'from-blue-500/10 to-cyan-500/10 border-blue-200/50',
    success: 'from-emerald-500/10 to-green-500/10 border-emerald-200/50',
    warning: 'from-amber-500/10 to-yellow-500/10 border-amber-200/50',
    danger: 'from-red-500/10 to-rose-500/10 border-red-200/50',
}

const iconStyles = {
    default: 'bg-blue-500/10 text-blue-600',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-red-500/10 text-red-600',
}

export function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = 'default',
}: KPICardProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-br border p-6 transition-all hover:shadow-lg hover:scale-[1.02]',
                variantStyles[variant]
            )}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <p className="text-3xl font-bold text-slate-900">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-500">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1">
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'
                                )}
                            >
                                {trend.value >= 0 ? '+' : ''}{trend.value}%
                            </span>
                            <span className="text-xs text-slate-500">{trend.label}</span>
                        </div>
                    )}
                </div>
                <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    )
}
