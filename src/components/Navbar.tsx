'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Cerrar menú al cambiar de ruta
  useEffect(() => setIsOpen(false), [pathname])

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="bg-[var(--naaloo-blue-dark)]/95 border-b border-white/5 h-16 sticky top-0 z-[100] backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-5 md:px-6 w-full h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg text-white bg-gradient-to-br from-blue-400 to-blue-700 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            N
          </div>
          <div>
            <div className="text-white font-bold text-[16px] leading-tight tracking-tight">Naaloo</div>
            <div className="text-white/40 text-[9px] tracking-[0.15em] uppercase font-medium">Presupuestos</div>
          </div>
        </Link>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2.5 rounded-xl bg-white/5 text-white/80 hover:text-white transition-colors"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <NavLink href="/" label="Nuevo Presupuesto" active={pathname === '/'} />
          <NavLink href="/rangos" label="Rangos de Precio" active={pathname === '/rangos'} />
          <NavLink href="/historial" label="Historial" active={pathname === '/historial'} />
          
          <div className="w-px h-5 bg-white/10 mx-3"></div>
          
          <button 
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>

      {/* Mobile Navigation - Overlay mejorado */}
      <div className={`fixed inset-0 top-16 bg-[var(--naaloo-blue-dark)]/98 backdrop-blur-xl z-[90] transition-all duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="p-6 flex flex-col gap-3">
          <MobileNavLink href="/" label="Nuevo Presupuesto" active={pathname === '/'} />
          <MobileNavLink href="/rangos" label="Rangos de Precio" active={pathname === '/rangos'} />
          <MobileNavLink href="/historial" label="Historial" active={pathname === '/historial'} />
          
          <div className="h-px w-full bg-white/5 my-4"></div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-base font-bold bg-red-500/10 text-red-400 border border-red-500/10"
          >
            <span>⎋</span> Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-[13px] font-semibold no-underline transition-all ${
        active 
          ? 'text-white bg-white/10 shadow-inner' 
          : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-6 py-5 rounded-2xl text-lg font-semibold no-underline transition-all ${
        active 
          ? 'text-white bg-white/10 border border-white/10' 
          : 'text-white/60 bg-white/[0.02]'
      }`}
    >
      <span>{label}</span>
      {active && <span className="text-blue-400">→</span>}
    </Link>
  )
}
