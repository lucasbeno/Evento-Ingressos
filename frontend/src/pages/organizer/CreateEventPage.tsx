import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { apiErrorMessage } from '../../api/client'
import { createEvent } from '../../api/organizerEvents'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { CatalogPicker } from '../../components/CatalogPicker'

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

export function CreateEventPage() {
  const [mode, setMode] = useState<'manual' | 'catalog'>('manual')

  return (
    <div className="mx-auto max-w-2xl">
      <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Organizador</span>
      <h1 className="mt-1 font-display text-5xl tracking-wide text-text">Criar evento</h1>

      <div className="mt-6 flex gap-2 rounded-full border border-border bg-surface p-1 w-fit">
        <button
          onClick={() => setMode('manual')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            mode === 'manual' ? 'bg-lime text-ink' : 'text-text-muted hover:text-text'
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode('catalog')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            mode === 'catalog' ? 'bg-lime text-ink' : 'text-text-muted hover:text-text'
          }`}
        >
          Do catálogo (Ticketmaster)
        </button>
      </div>

      <div className="mt-8">{mode === 'manual' ? <ManualForm /> : <CatalogPicker />}</div>
    </div>
  )
}

function ManualForm() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      createEvent({
        ...values,
        imageUrl: values.imageUrl || undefined,
        eventDatetime: new Date(values.eventDatetime).toISOString(),
      }),
    onSuccess: (event) => navigate(`/organizador/eventos/${event.id}`),
    onError: (err) => setError('root', { message: apiErrorMessage(err, 'Não foi possível criar o evento') }),
  })

  return (
    <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="flex flex-col gap-4">
      <Field label="Título" {...register('title')} error={errors.title?.message} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text-muted">Descrição (opcional)</span>
        <textarea
          {...register('description')}
          rows={3}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-lime/60"
        />
      </label>

      <Field
        label="URL da imagem (opcional)"
        placeholder="https://…"
        {...register('imageUrl')}
        error={errors.imageUrl?.message}
      />

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
        <Field
          label="Capacidade"
          type="number"
          min={1}
          {...register('capacity')}
          error={errors.capacity?.message}
        />
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

      <Button type="submit" disabled={isSubmitting || createMutation.isPending} className="mt-2">
        {createMutation.isPending ? 'Criando…' : 'Criar como rascunho'}
      </Button>
    </form>
  )
}
