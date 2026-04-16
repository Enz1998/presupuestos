'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => setIsOpen(false), [pathname])

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <header className="bg-[var(--naaloo-blue-dark)] border-b border-white/5 h-16 sticky top-0 z-[110] w-full">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base text-white bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
              N
            </div>
            <div>
              <div className="text-white font-bold text-[15px] leading-tight">Naaloo</div>
              <div className="text-white/40 text-[9px] tracking-widest uppercase font-medium">Presupuestos</div>
            </div>
          </Link>

          {/* Hamburger Button - Asegurando área de toque */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-end text-white/80 hover:text-white transition-colors z-[120]"
            aria-label="Abrir menú"
          >
            <div className="relative w-6 h-5">
              <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out top-2 ${isOpen ? 'opacity-0' : ''}`} />
              <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out top-4 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" label="Nuevo Presupuesto" active={pathname === '/'} />
            <NavLink href="/rangos" label="Rangos de Precio" active={pathname === '/'} />
            <NavLink href="/historial" label="Historial" active={pathname === '/historial'} />
            <div className="w-px h-5 bg-white/10 mx-3"></div>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
              Salir
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Sidebar - Más serio y funcional */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[105] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />
      
      <aside className={`fixed top-0 right-0 w-[280px] h-full bg-[var(--naaloo-blue-dark)] z-[115] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 pt-24 flex flex-col gap-4">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Navegación</p>
          <MobileNavLink href="/" label="Nuevo Presupuesto" active={pathname === '/'} />
          <MobileNavLink href="/rangos" label="Rangos de Precio" active={pathname === '/rangos'} />
          <MobileNavLink href="/historial" label="Historial" active={pathname === '/historial'} />
          
          <div className="mt-auto pt-10">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-bold bg-white/5 text-red-400 border border-white/5"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${active ? 'text-white bg-white/10' : 'text-white/50 hover:text-white'}`}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block px-6 py-4 rounded-xl text-base font-semibold no-underline transition-all ${active ? 'text-white bg-white/10' : 'text-white/60'}`}
    >
      {label}
    </Link>
  )
}
