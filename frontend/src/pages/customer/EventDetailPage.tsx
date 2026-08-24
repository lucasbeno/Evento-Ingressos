import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiErrorMessage } from '../../api/client'
import { getPublishedEvent } from '../../api/events'
import { createReservation } from '../../api/reservations'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { Spinner } from '../../components/Spinner'
import { formatCurrency, formatDateTime } from '../../lib/format'

const MAX_PER_RESERVATION = 10

export function EventDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({ queryKey: ['event', id], queryFn: () => getPublishedEvent(id), enabled: !!id })

  const reserveMutation = useMutation({
    mutationFn: () => createReservation(id, quantity),
    onSuccess: (reservation) => navigate(`/checkout/${reservation.id}`),
    onError: (err) => setFormError(apiErrorMessage(err, 'Não foi possível reservar')),
  })

  if (isLoading) return <Spinner label="Carregando evento…" />
  if (error || !event) return <ErrorState message={apiErrorMessage(error, 'Evento não encontrado')} />

  const soldOut = event.availableTickets <= 0
  const maxQuantity = Math.min(MAX_PER_RESERVATION, event.availableTickets)

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-surface">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-6xl tracking-widest text-border">ROLÊ</span>
            </div>
          )}
        </div>

        <span className="mt-6 block text-sm font-semibold uppercase tracking-widest text-magenta">
          {formatDateTime(event.eventDatetime)}
        </span>
        <h1 className="mt-1 font-display text-5xl tracking-wide text-text">{event.title}</h1>
        <p className="mt-2 text-text-muted">
          {event.venueName} · {event.venueCity}
        </p>

        {event.description && <p className="mt-6 max-w-2xl leading-relaxed text-text-muted">{event.description}</p>}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
        <span className="text-sm text-text-muted">A partir de</span>
        <div className="font-display text-5xl tracking-wide text-lime">{formatCurrency(event.price)}</div>

        {soldOut ? (
          <p className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            Ingressos esgotados para este evento.
          </p>
        ) : !user ? (
          <div className="mt-6">
            <p className="text-sm text-text-muted">Entre na sua conta para reservar ingressos.</p>
            <Link to="/entrar" state={{ from: `/eventos/${event.id}` }}>
              <Button className="mt-4 w-full">Entrar para reservar</Button>
            </Link>
          </div>
        ) : user.role !== 'CUSTOMER' ? (
          <p className="mt-6 text-sm text-text-muted">Apenas contas de cliente podem reservar ingressos.</p>
        ) : (
          <div className="mt-6">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-muted">
              Quantidade
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-lime/60"
              >
                {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} ingresso{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-text-muted">Total</span>
              <span className="font-semibold text-text">{formatCurrency(event.price * quantity)}</span>
            </div>

            {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}

            <Button
              className="mt-4 w-full"
              disabled={reserveMutation.isPending}
              onClick={() => {
                setFormError(null)
                reserveMutation.mutate()
              }}
            >
              {reserveMutation.isPending ? 'Reservando…' : 'Reservar'}
            </Button>
          </div>
        )}
      </aside>
    </div>
  )
}
