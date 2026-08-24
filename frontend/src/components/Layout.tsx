import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Footer } from './Footer'

const ROLE_HOME: Record<string, string> = {
  ORGANIZER: '/organizador',
  GATE: '/portaria',
  CUSTOMER: '/',
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-semibold tracking-wide transition-colors ${
    isActive ? 'text-lime' : 'text-text-muted hover:text-text'
  }`
}

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/80 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to={user ? (ROLE_HOME[user.role] ?? '/') : '/'} className="flex items-baseline gap-1">
            <span className="font-display text-3xl tracking-wide text-lime">ROLÊ</span>
            <span className="font-display text-3xl tracking-wide text-magenta">.</span>
          </Link>

          <nav className="flex items-center gap-6">
            {!user && (
              <>
                <NavLink to="/" className={navLinkClass} end>
                  Eventos
                </NavLink>
                <NavLink to="/entrar" className={navLinkClass}>
                  Entrar
                </NavLink>
                <Link to="/cadastrar">
                  <button className="rounded-full bg-lime px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-lime-dim">
                    Criar conta
                  </button>
                </Link>
              </>
            )}

            {user?.role === 'CUSTOMER' && (
              <>
                <NavLink to="/" className={navLinkClass} end>
                  Eventos
                </NavLink>
                <NavLink to="/meus-ingressos" className={navLinkClass}>
                  Meus ingressos
                </NavLink>
              </>
            )}

            {user?.role === 'ORGANIZER' && (
              <>
                <NavLink to="/organizador" className={navLinkClass} end>
                  Meus eventos
                </NavLink>
                <NavLink to="/organizador/novo" className={navLinkClass}>
                  Criar evento
                </NavLink>
              </>
            )}

            {user?.role === 'GATE' && (
              <NavLink to="/portaria" className={navLinkClass} end>
                Validar ingresso
              </NavLink>
            )}

            {user && (
              <div className="flex items-center gap-3 border-l border-border pl-6">
                <span className="text-sm text-text-muted">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm font-semibold text-text-muted transition-colors hover:text-magenta"
                >
                  Sair
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
