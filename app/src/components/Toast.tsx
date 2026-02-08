'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).slice(2)
        setToasts((prev) => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 4000)
    }, [])

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
    }

    const styles = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {toasts.map((toast) => {
                    const Icon = icons[toast.type]
                    return (
                        <div
                            key={toast.id}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg',
                                'animate-in slide-in-from-right-5 fade-in duration-300',
                                styles[toast.type]
                            )}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-2 p-1 hover:bg-black/5 rounded-lg transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}
