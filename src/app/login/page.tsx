import { login } from './actions'

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4 md:p-6">
      <div className="card animate-fadein w-full max-w-[400px] border-2 border-[var(--naaloo-blue-light)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--naaloo-text)] mb-2">
            Naaloo Presupuestos
          </h1>
          <p className="text-sm text-[var(--naaloo-gray-600)]">
            Iniciá sesión para acceder al sistema
          </p>
        </div>

        <form action={login} className="flex flex-col gap-4" autoComplete="off">
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
            <div className="alert alert-error text-[13px] px-3 py-2">
              Credenciales incorrectas
            </div>
          )}

          <button className="btn-primary w-full justify-center mt-2" type="submit">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
