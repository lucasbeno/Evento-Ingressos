import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { apiErrorMessage } from '../api/client'
import { searchCatalog } from '../api/catalog'
import { createEventFromCatalog } from '../api/organizerEvents'
import type { CatalogEventResponse } from '../types'
import { formatDateTime } from '../lib/format'
import { Button } from './Button'
import { ErrorState } from './ErrorState'
import { Field } from './Field'
import { Spinner } from './Spinner'

const schema = z.object({
  capacity: z.coerce.number().int().positive('Capacidade deve ser maior que zero'),
  price: z.coerce.number().min(0, 'Preço não pode ser negativo'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function CatalogPicker() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<CatalogEventResponse[] | null>(null)
  const [selected, setSelected] = useState<CatalogEventResponse | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      createEventFromCatalog({ externalId: selected!.externalId, ...values }),
    onSuccess: (event) => navigate(`/organizador/eventos/${event.id}`),
    onError: (err) => setError('root', { message: apiErrorMessage(err, 'Não foi possível criar o evento') }),
  })

  async function handleSearch() {
    if (!keyword.trim()) return
    setSearching(true)
    setSearchError(null)
    setSelected(null)
    try {
      const data = await searchCatalog(keyword.trim())
      setResults(data)
    } catch (err) {
      setSearchError(apiErrorMessage(err, 'Não foi possível buscar o catálogo'))
    } finally {
      setSearching(false)
    }
  }

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="mb-4 text-sm text-text-muted hover:text-lime">
          ← Escolher outro
        </button>

        <div className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
          {selected.imageUrl && (
            <img src={selected.imageUrl} alt="" className="h-24 w-24 flex-none rounded-lg object-cover" />
          )}
          <div>
            <h3 className="font-display text-2xl tracking-wide text-text">{selected.title}</h3>
            <p className="text-sm text-text-muted">
              {selected.venueName ?? 'Local não informado'}
              {selected.venueCity ? `, ${selected.venueCity}` : ''}
            </p>
            {selected.eventDatetime && (
              <p className="text-xs text-text-faint">{formatDateTime(selected.eventDatetime)}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="mt-6 flex flex-col gap-4">
          <p className="text-xs text-text-faint">
            Título, imagem, local e data vêm da Ticketmaster — só falta você definir capacidade e preço.
          </p>
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
          <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
            {createMutation.isPending ? 'Criando…' : 'Criar como rascunho'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar show, artista…"
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-lime/60"
        />
        <Button type="button" onClick={handleSearch} disabled={searching}>
          {searching ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>

      {searchError && (
        <div className="mt-4">
          <ErrorState message={searchError} />
        </div>
      )}
      {searching && <Spinner label="Buscando no catálogo…" />}

      {results && results.length === 0 && !searching && (
        <p className="mt-6 text-center text-sm text-text-muted">Nenhum resultado para "{keyword}".</p>
      )}

      {results && results.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {results.map((item) => (
            <button
              key={item.externalId}
              onClick={() => setSelected(item)}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-lime/50"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="h-14 w-14 flex-none rounded-lg object-cover" />
              ) : (
                <div className="h-14 w-14 flex-none rounded-lg bg-surface-raised" />
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-text">{item.title}</p>
                <p className="truncate text-xs text-text-muted">
                  {item.venueName ?? 'Local não informado'}
                  {item.venueCity ? `, ${item.venueCity}` : ''}
                </p>
                {item.eventDatetime && (
                  <p className="text-xs text-text-faint">{formatDateTime(item.eventDatetime)}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
