'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="bg-[var(--naaloo-blue-dark)] border-b border-white/10 h-16 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 w-full h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base text-white bg-gradient-to-br from-[#4A90E2] to-[#2D5FCC]">
            N
          </div>
          <div>
            <div className="text-white font-bold text-[15px] leading-tight">Naaloo</div>
            <div className="text-white/50 text-[10px] tracking-widest uppercase">Presupuestos</div>
          </div>
        </Link>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-white/80 hover:text-white"
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
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/" label="Nuevo Presupuesto" active={pathname === '/'} />
          <NavLink href="/rangos" label="Rangos de Precio" active={pathname === '/rangos'} />
          <NavLink href="/historial" label="Historial" active={pathname === '/historial'} />
          
          <div className="w-px h-6 bg-white/20 mx-2"></div>
          
          <button 
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors ml-2"
          >
            Salir
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[var(--naaloo-blue-dark)] border-b border-white/10 shadow-lg py-4 px-4 flex flex-col gap-2">
          <MobileNavLink href="/" label="Nuevo Presupuesto" active={pathname === '/'} onClick={() => setIsOpen(false)} />
          <MobileNavLink href="/rangos" label="Rangos de Precio" active={pathname === '/rangos'} onClick={() => setIsOpen(false)} />
          <MobileNavLink href="/historial" label="Historial" active={pathname === '/historial'} onClick={() => setIsOpen(false)} />
          
          <div className="h-px w-full bg-white/10 my-2"></div>
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium bg-red-500/10 text-red-300 transition-colors"
          >
            Salir
          </button>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-md text-[13px] font-medium no-underline transition-all duration-150 ${
        active 
          ? 'text-white bg-white/10' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean, onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-4 py-2.5 rounded-md text-sm font-medium no-underline transition-all duration-150 ${
        active 
          ? 'text-white bg-white/10' 
          : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  )
}
