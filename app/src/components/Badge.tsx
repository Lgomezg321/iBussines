import { cn } from '@/lib/utils'

interface BadgeProps {
    children: React.ReactNode
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variantStyles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                variantStyles[variant]
            )}
        >
            {children}
        </span>
    )
}

export function getEstadoPagoBadge(estado: string) {
    switch (estado) {
        case 'Pagado':
            return <Badge variant="success">Pagado</Badge>
        case 'Parcial':
            return <Badge variant="warning">Parcial</Badge>
        case 'Pendiente':
        default:
            return <Badge variant="danger">Pendiente</Badge>
    }
}

export function getEstadoPedidoBadge(estado: string) {
    switch (estado) {
        case 'Entregado':
            return <Badge variant="success">Entregado</Badge>
        case 'En proceso':
            return <Badge variant="info">En proceso</Badge>
        case 'Backorder':
            return <Badge variant="danger">Backorder</Badge>
        case 'Cancelado':
            return <Badge variant="default">Cancelado</Badge>
        default:
            return <Badge>{estado}</Badge>
    }
}
