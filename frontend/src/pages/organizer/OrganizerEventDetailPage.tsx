import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import { apiErrorMessage } from '../../api/client'
import { cancelEvent, getMyOrganizerEvent, publishEvent, updateEvent } from '../../api/organizerEvents'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { Field } from '../../components/Field'
import { Spinner } from '../../components/Spinner'
import { formatCurrency, formatDateTime } from '../../lib/format'
import { EVENT_STATUS_LABEL, EVENT_STATUS_TONE } from '../../lib/status'

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  imageUrl: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  venueName: z.string().min(1, 'Local é obrigatório'),
  venueCity: z.string().min(1, 'Cidade é obrigatória'),
  eventDatetime: z.string().min(1, 'Data é obrigatória'),
  capacity: z.coerce.number().int().positive('Capacidade deve ser maior que zero'),
  price: z.coerce.number().min(0, 'Preço não pode ser negativo'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function OrganizerEventDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({ queryKey: ['organizer', 'event', id], queryFn: () => getMyOrganizerEvent(id), enabled: !!id })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description ?? '',
        imageUrl: event.imageUrl ?? '',
        venueName: event.venueName,
        venueCity: event.venueCity,
        eventDatetime: toDatetimeLocal(event.eventDatetime),
        capacity: event.capacity,
        price: event.price,
      })
    }
  }, [event, reset])

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateEvent(id, {
        ...values,
        imageUrl: values.imageUrl || undefined,
        eventDatetime: new Date(values.eventDatetime).toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizer', 'event', id] }),
    onError: (err) => setError('root', { message: apiErrorMessage(err, 'Não foi possível salvar') }),
  })

  const publishMutation = useMutation({
    mutationFn: () => publishEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer', 'event', id] })
      queryClient.invalidateQueries({ queryKey: ['organizer', 'events'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer', 'event', id] })
      queryClient.invalidateQueries({ queryKey: ['organizer', 'events'] })
    },
  })

  if (isLoading) return <Spinner label="Carregando evento…" />
  if (error || !event) return <ErrorState message={apiErrorMessage(error, 'Evento não encontrado')} />

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Organizador</span>
            <Badge tone={EVENT_STATUS_TONE[event.status]}>{EVENT_STATUS_LABEL[event.status]}</Badge>
          </div>
          <h1 className="mt-1 font-display text-5xl tracking-wide text-text">{event.title}</h1>
        </div>
        <div className="flex gap-2">
          {event.status === 'DRAFT' && (
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? 'Publicando…' : 'Publicar evento'}
            </Button>
          )}
          {event.status !== 'CANCELLED' && (
            <Button
              variant="danger"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (window.confirm('Cancelar este evento? Ingressos já emitidos deixam de ser válidos.')) {
                  cancelMutation.mutate()
                }
              }}
            >
              {cancelMutation.isPending ? 'Cancelando…' : 'Cancelar evento'}
            </Button>
          )}
        </div>
      </div>

      {publishMutation.error && (
        <div className="mb-4">
          <ErrorState message={apiErrorMessage(publishMutation.error, 'Não foi possível publicar')} />
        </div>
      )}
      {cancelMutation.error && (
        <div className="mb-4">
          <ErrorState message={apiErrorMessage(cancelMutation.error, 'Não foi possível cancelar')} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-border bg-surface py-4">
          <div className="font-display text-3xl text-lime">{event.capacity}</div>
          <div className="text-xs text-text-faint">capacidade</div>
        </div>
        <div className="rounded-xl border border-border bg-surface py-4">
          <div className="font-display text-3xl text-magenta">{event.soldCount}</div>
          <div className="text-xs text-text-faint">vendidos</div>
        </div>
        <div className="rounded-xl border border-border bg-surface py-4">
          <div className="font-display text-3xl text-text">{formatCurrency(event.price * event.soldCount)}</div>
          <div className="text-xs text-text-faint">receita</div>
        </div>
      </div>

      {event.status !== 'DRAFT' ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          {event.imageUrl && (
            <img src={event.imageUrl} alt="" className="mb-4 aspect-[16/9] w-full rounded-xl object-cover" />
          )}
          <p className="text-sm text-text-muted">{formatDateTime(event.eventDatetime)}</p>
          <p className="text-sm text-text-muted">
            {event.venueName} · {event.venueCity}
          </p>
          {event.description && <p className="mt-3 text-sm text-text-muted">{event.description}</p>}
          <p className="mt-4 text-xs text-text-faint">
            {event.status === 'CANCELLED'
              ? 'Evento cancelado — ingressos já emitidos não são mais válidos na portaria.'
              : 'Evento publicado não pode mais ser editado por aqui.'}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
        >
          <Field label="Título" {...register('title')} error={errors.title?.message} />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-text-muted">Descrição (opcional)</span>
            <textarea
              {...register('description')}
              rows={3}
              className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-lime/60"
            />
          </label>

          <Field label="URL da imagem (opcional)" {...register('imageUrl')} error={errors.imageUrl?.message} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Local" {...register('venueName')} error={errors.venueName?.message} />
            <Field label="Cidade" {...register('venueCity')} error={errors.venueCity?.message} />
          </div>

          <Field
            label="Data e hora"
            type="datetime-local"
            {...register('eventDatetime')}
            error={errors.eventDatetime?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacidade" type="number" min={1} {...register('capacity')} error={errors.capacity?.message} />
            <Field
              label="Preço (R$)"
              type="number"
              step="0.01"
              min={0}
              {...register('price')}
              error={errors.price?.message}
            />
          </div>

          {errors.root?.message && <p className="text-sm text-danger">{errors.root.message}</p>}
          {updateMutation.isSuccess && <p className="text-sm text-success">Alterações salvas.</p>}

          <Button type="submit" variant="secondary" disabled={isSubmitting || updateMutation.isPending}>
            {updateMutation.isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </form>
      )}
    </div>
  )
}
