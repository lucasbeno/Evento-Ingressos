import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { apiErrorMessage } from '../api/client'
import { getSharedTicket } from '../api/tickets'
import { ErrorState } from '../components/ErrorState'
import { Spinner } from '../components/Spinner'
import { TicketStub } from '../components/TicketStub'

export function SharedTicketPage() {
  const { shareToken = '' } = useParams()

  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery({ queryKey: ['ticket', 'shared', shareToken], queryFn: () => getSharedTicket(shareToken), enabled: !!shareToken })

  return (
    <div className="mx-auto max-w-xl">
      <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Ingresso compartilhado</span>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-text">Alguém te mandou um ingresso</h1>

      <div className="mt-8">
        {isLoading && <Spinner label="Carregando ingresso…" />}
        {error && <ErrorState message={apiErrorMessage(error, 'Ingresso não encontrado')} />}
        {ticket && <TicketStub ticket={ticket} />}
      </div>
    </div>
  )
}
