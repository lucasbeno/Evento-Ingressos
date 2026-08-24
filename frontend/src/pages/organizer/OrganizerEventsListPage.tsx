import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiErrorMessage } from '../../api/client'
import { listMyOrganizerEvents } from '../../api/organizerEvents'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import { formatCurrency, formatDateTime } from '../../lib/format'
import { EVENT_STATUS_LABEL, EVENT_STATUS_TONE } from '../../lib/status'

export function OrganizerEventsListPage() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['organizer', 'events'],
    queryFn: listMyOrganizerEvents,
  })

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Organizador</span>
          <h1 className="mt-1 font-display text-5xl tracking-wide text-text">Meus eventos</h1>
        </div>
        <Link to="/organizador/novo">
          <Button>Criar evento</Button>
        </Link>
      </div>

      {isLoading && <Spinner label="Carregando seus eventos…" />}
      {error && <ErrorState message={apiErrorMessage(error, 'Não foi possível carregar os eventos')} />}

      {events && events.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-text-muted">
          Você ainda não criou nenhum evento.
        </p>
      )}

      {events && events.length > 0 && (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/organizador/eventos/${event.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-lime/50"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl tracking-wide text-text">{event.title}</h3>
                  <Badge tone={EVENT_STATUS_TONE[event.status]}>{EVENT_STATUS_LABEL[event.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  {formatDateTime(event.eventDatetime)} · {event.venueName}, {event.venueCity}
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-lime">{formatCurrency(event.price)}</div>
                <div className="text-text-faint">
                  {event.soldCount}/{event.capacity} vendidos
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
