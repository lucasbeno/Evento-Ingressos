import { Link } from 'react-router-dom'
import type { EventSummary } from '../types'
import { formatCurrency, formatDateTime } from '../lib/format'

export function EventCard({ event }: { event: EventSummary }) {
  const soldOut = event.availableTickets <= 0

  return (
    <Link
      to={`/eventos/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-lime/50 hover:shadow-[0_0_32px_-12px_rgba(212,255,63,0.5)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-4xl tracking-widest text-border">ROLÊ</span>
          </div>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-full bg-danger/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-magenta">
          {formatDateTime(event.eventDatetime)}
        </span>
        <h3 className="font-display text-2xl leading-tight tracking-wide text-text">{event.title}</h3>
        <p className="text-sm text-text-muted">
          {event.venueName} · {event.venueCity}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-lime">{formatCurrency(event.price)}</span>
          <span className="text-xs text-text-faint">
            {soldOut ? 'sem ingressos' : `${event.availableTickets} disponíveis`}
          </span>
        </div>
      </div>
    </Link>
  )
}
