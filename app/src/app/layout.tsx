import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { ToastProvider } from '@/components/Toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'iBusiness OS - ERP',
  description: 'Sistema integrado de Ventas, Inventario, Compras, Gastos y Bancos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-[#F5F5F7]`}>
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 transition-all duration-300">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
