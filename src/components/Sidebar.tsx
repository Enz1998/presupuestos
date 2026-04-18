'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileEdit,
  Users,
  CreditCard,
  Archive,
  LogOut,
  HelpCircle,
  Settings
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E2E8F0] z-40 flex items-center justify-between px-4 shadow-sm">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-full bg-[#475569] flex items-center justify-center font-bold text-sm text-white shadow-sm">
            N
          </div>
          <span className="font-bold text-[#1E293B] text-[16px] tracking-tight">Naaloo</span>
        </Link>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 text-[#475569] active:bg-slate-100 rounded-md">
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
        w-[260px] flex-shrink-0 h-screen bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)]
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline group block">
            <div className="w-10 h-10 rounded-full bg-[#475569] flex items-center justify-center font-bold text-lg text-white shadow-sm transition-transform group-hover:scale-105">
              N
            </div>
            <div>
              <div className="text-[#1E293B] font-bold text-[16px] leading-tight flex items-center">
                Naaloo
              </div>
              <div className="text-[#64748B] text-[11px] font-medium mt-0.5">
                Presupuestos
              </div>
            </div>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-md">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="px-5 mb-6">
          <Link 
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-[#475569] hover:bg-[#334155] text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors shadow-sm"
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
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 mt-4 text-[#EF4444] hover:bg-[#FEF2F2] rounded-md transition-colors w-full text-left text-[14px] font-medium">
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-[14px] font-medium
        ${active 
          ? 'bg-white text-[#0F172A] shadow-[0_1px_3px_rgba(0,0,0,0.05)]' 
          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'}
      `}
    >
      <div className={active ? 'text-[#0F172A]' : 'text-[#64748B]'}>
        {icon}
      </div>
      {label}
    </Link>
  )
}
