const GITHUB_URL = 'https://github.com/lucasbeno/Evento-Ingressos'
const LINKEDIN_URL = 'https://www.linkedin.com/in/lucasbeno/'

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 2C6.48 2 2 6.58 2 12.21c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.21C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border/60 pb-5 text-sm">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-text-muted transition-colors hover:text-lime">
            Repositório no GitHub
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="text-text-muted transition-colors hover:text-lime">
            LinkedIn
          </a>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text">Lucas Beno · © {year}</p>
            <p className="mt-0.5 text-xs text-text-faint">Plataforma de eventos e ingressos desenvolvida de ponta a ponta.</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn de Lucas Beno"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-lime/60 hover:text-lime"
            >
              <LinkedInIcon />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Repositório do projeto no GitHub"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-lime/60 hover:text-lime"
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
