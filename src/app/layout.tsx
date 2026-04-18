import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Fiscal Architect | Generador de Presupuestos',
  description: 'Sistema corporativo de presupuestos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex h-screen overflow-hidden bg-[var(--naaloo-slate-50)] text-[var(--naaloo-text)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full p-4 pt-24 md:p-10">
          <div className="max-w-[1100px] mx-auto w-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
