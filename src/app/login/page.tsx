import { login } from './actions'

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '24px' }}>
      <div className="card animate-fadein" style={{ width: '100%', maxWidth: '400px', border: '2px solid var(--naaloo-blue-light)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--naaloo-text)', marginBottom: '8px' }}>
            Naaloo Presupuestos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--naaloo-gray-600)' }}>
            Iniciá sesión para acceder al sistema
          </p>
        </div>

        <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
          <div>
            <label className="input-label" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="tu@naaloo.com"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className="input-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              required
              autoComplete="new-password"
            />
          </div>

          {searchParams?.error && (
            <div className="alert alert-error" style={{ fontSize: '13px', padding: '8px 12px' }}>
              Credenciales incorrectas
            </div>
          )}

          <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
