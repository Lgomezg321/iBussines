import type { Metadata, Viewport } from 'next'
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'iBusiness OS',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F5F5F7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* PWA iOS specific */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="iBusiness" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#F5F5F7]`}>
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            {/* Main content - responsive margin */}
            <main className="flex-1 md:ml-64 transition-all duration-300 pb-20 md:pb-0">
              <div className="p-4 md:p-8">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
