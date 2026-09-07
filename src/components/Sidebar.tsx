'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  CreditCard,
  Archive,
  LogOut,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (pathname === '/login' || pathname.includes('/imprimir')) return null;

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[var(--naaloo-slate-200)] z-40 flex items-center justify-between px-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Image
            src="/logo.png"
            alt="Naaloo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-[8px] shadow-sm"
            priority
          />
          <span className="font-bold text-[var(--naaloo-text)] text-[16px] tracking-tight lowercase">naaloo</span>
        </Link>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 text-[var(--naaloo-slate-600)] active:bg-[var(--naaloo-blue-subtle)] rounded-full">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[260px] flex-shrink-0 h-screen bg-white border-r border-[var(--naaloo-slate-200)] flex flex-col shadow-[1px_0_10px_rgba(15,23,42,0.04)]
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline group block">
            <Image
              src="/logo.png"
              alt="Naaloo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-[10px] shadow-sm transition-transform group-hover:scale-105"
              priority
            />
            <div>
              <div className="text-[var(--naaloo-text)] font-bold text-[16px] leading-tight lowercase tracking-tight">
                naaloo
              </div>
              <div className="text-[var(--naaloo-text-muted)] text-[11px] font-medium mt-0.5">
                Presupuestos
              </div>
            </div>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-[var(--naaloo-slate-400)] hover:text-[var(--naaloo-slate-600)] bg-[var(--naaloo-bg)] rounded-full">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="px-5 mb-6">
          <Link 
            href="/"
            className="btn-primary w-full py-2.5 text-sm"
          >
            <span className="text-lg leading-none mb-[2px]">+</span> Nuevo Presupuesto
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 flex flex-col gap-1">
          <NavItem href="/rangos" icon={<CreditCard size={18} />} label="Rangos de Precio" active={pathname === '/rangos'} />
          <NavItem href="/historial" icon={<Archive size={18} />} label="Historial" active={pathname === '/historial'} />
        </nav>

        {/* Bottom Footer Links */}
        <div className="p-3 mt-auto flex flex-col gap-1 pb-6">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 mt-4 text-[var(--naaloo-error)] hover:bg-[#FEF2F2] rounded-full transition-colors w-full text-left text-[14px] font-medium">
            <LogOut size={18} className="opacity-70" /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors text-[14px] font-medium
        ${active 
          ? 'bg-[var(--naaloo-blue-subtle)] text-[var(--naaloo-blue)]' 
          : 'text-[var(--naaloo-slate-600)] hover:text-[var(--naaloo-text)] hover:bg-[var(--naaloo-bg)]'}
      `}
    >
      <div className={active ? 'text-[var(--naaloo-blue)]' : 'text-[var(--naaloo-slate-400)]'}>
        {icon}
      </div>
      {label}
    </Link>
  )
}
