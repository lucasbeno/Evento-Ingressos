import { useQuery } from '@tanstack/react-query'
import { listPublishedEvents } from '../../api/events'
import { apiErrorMessage } from '../../api/client'
import { EventCard } from '../../components/EventCard'
import { Spinner } from '../../components/Spinner'
import { ErrorState } from '../../components/ErrorState'

export function EventsListPage() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: listPublishedEvents,
  })

  return (
    <div>
      <div className="mb-10">
        <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Em cartaz</span>
        <h1 className="mt-1 font-display text-6xl tracking-wide text-text">
          Achou o <span className="text-lime">rolê</span>.
        </h1>
      </div>

      {isLoading && <Spinner label="Carregando eventos…" />}
      {error && <ErrorState message={apiErrorMessage(error, 'Não foi possível carregar os eventos')} />}

      {events && events.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-text-muted">
          Nenhum evento publicado no momento.
        </p>
      )}

      {events && events.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
