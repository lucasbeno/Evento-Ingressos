import { useQuery } from '@tanstack/react-query'
import { listMyTickets } from '../../api/tickets'
import { apiErrorMessage } from '../../api/client'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import { TicketStub } from '../../components/TicketStub'

export function MyTicketsPage() {
  const { data: tickets, isLoading, error } = useQuery({ queryKey: ['tickets', 'mine'], queryFn: listMyTickets })

  return (
    <div>
      <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Sua mochila</span>
      <h1 className="mt-1 font-display text-5xl tracking-wide text-text">Meus ingressos</h1>

      {isLoading && <Spinner label="Carregando ingressos…" />}
      {error && <ErrorState message={apiErrorMessage(error, 'Não foi possível carregar os ingressos')} />}

      {tickets && tickets.length === 0 && (
        <p className="mt-8 rounded-2xl border border-border bg-surface px-6 py-16 text-center text-text-muted">
          Você ainda não tem ingressos. Que tal <a href="/" className="text-lime hover:underline">achar um rolê</a>?
        </p>
      )}

      {tickets && tickets.length > 0 && (
        <div className="mt-8 flex flex-col gap-5">
          {tickets.map((ticket) => (
            <TicketStub key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
