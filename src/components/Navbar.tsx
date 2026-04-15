'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header style={{
      background: 'var(--naaloo-blue-dark)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #4A90E2, #2D5FCC)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '16px', color: 'white',
          }}>N</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1 }}>Naaloo</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Presupuestos</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '4px' }}>
          <NavLink href="/" label="Nuevo Presupuesto" active={pathname === '/'} />
          <NavLink href="/rangos" label="Rangos de Precio" active={pathname === '/rangos'} />
        </nav>
      </div>
    </header>
  )
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: '6px 16px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        textDecoration: 'none',
        color: active ? 'white' : 'rgba(255,255,255,0.6)',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </Link>
  )
}
