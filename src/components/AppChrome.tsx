'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPrint = pathname.includes('/imprimir')

  if (isPrint) {
    return <div className="min-h-screen bg-white text-[var(--naaloo-text)]">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--naaloo-bg)] text-[var(--naaloo-text)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full p-4 pt-24 md:p-10">
        <div className="max-w-[1100px] mx-auto w-full">{children}</div>
      </main>
    </div>
  )
}
