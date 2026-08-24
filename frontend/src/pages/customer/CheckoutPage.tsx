import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { apiErrorMessage } from '../../api/client'
import { getMyReservation, payReservation } from '../../api/reservations'
import type { PaymentResponse } from '../../types'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { Field } from '../../components/Field'
import { Spinner } from '../../components/Spinner'
import { formatCurrency, formatDateTime } from '../../lib/format'

const schema = z.object({
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{13,19}$/, 'Número do cartão inválido')),
  cardHolderName: z.string().min(1, 'Nome do titular é obrigatório'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use o formato MM/AA'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
})

type FormValues = z.infer<typeof schema>

export function CheckoutPage() {
  const { id = '' } = useParams()
  const [result, setResult] = useState<PaymentResponse | null>(null)

  const {
    data: reservation,
    isLoading,
    error,
  } = useQuery({ queryKey: ['reservation', id], queryFn: () => getMyReservation(id), enabled: !!id })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const payMutation = useMutation({
    mutationFn: (values: FormValues) => payReservation(id, values),
    onSuccess: setResult,
    onError: (err) => setError('root', { message: apiErrorMessage(err, 'Não foi possível processar o pagamento') }),
  })

  if (isLoading) return <Spinner label="Carregando reserva…" />
  if (error || !reservation) return <ErrorState message={apiErrorMessage(error, 'Reserva não encontrada')} />

  if (result) {
    return <PaymentResult result={result} />
  }

  if (reservation.status !== 'PENDING_PAYMENT') {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-4xl text-text">Esta reserva já foi processada</h1>
        <p className="mt-3 text-text-muted">
          Status atual: <strong className="text-text">{reservation.status}</strong>
        </p>
        <Link to="/meus-ingressos">
          <Button className="mt-6">Ver meus ingressos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-[1fr_1.2fr]">
      <div>
        <span className="text-sm font-semibold uppercase tracking-widest text-magenta">Resumo</span>
        <h1 className="mt-1 font-display text-4xl tracking-wide text-text">{reservation.eventTitle}</h1>
        <p className="mt-1 text-sm text-text-muted">{formatDateTime(reservation.eventDatetime)}</p>

        <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Quantidade</span>
            <span className="text-text">{reservation.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Preço unitário</span>
            <span className="text-text">{formatCurrency(reservation.unitPrice)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span className="text-lime">{formatCurrency(reservation.totalPrice)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-xs text-text-muted">
          <strong className="text-magenta">Pagamento simulado.</strong> Use qualquer número de cartão para
          aprovar, ou termine em <strong className="text-text">0002</strong> para simular recusa.
        </div>
      </div>

      <form onSubmit={handleSubmit((values) => payMutation.mutate(values))} className="flex flex-col gap-4">
        <Field
          label="Número do cartão"
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          {...register('cardNumber')}
          error={errors.cardNumber?.message}
        />
        <Field label="Nome do titular" {...register('cardHolderName')} error={errors.cardHolderName?.message} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Validade" placeholder="MM/AA" {...register('expiry')} error={errors.expiry?.message} />
          <Field label="CVV" placeholder="123" inputMode="numeric" {...register('cvv')} error={errors.cvv?.message} />
        </div>

        {errors.root?.message && <p className="text-sm text-danger">{errors.root.message}</p>}

        <Button type="submit" disabled={isSubmitting || payMutation.isPending} className="mt-2">
          {payMutation.isPending ? 'Processando…' : `Pagar ${formatCurrency(reservation.totalPrice)}`}
        </Button>
      </form>
    </div>
  )
}

function PaymentResult({ result }: { result: PaymentResponse }) {
  if (result.approved) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-3xl">
          ✓
        </div>
        <h1 className="mt-4 font-display text-4xl text-text">Pagamento aprovado</h1>
        <p className="mt-2 text-text-muted">
          {result.tickets.length} ingresso{result.tickets.length > 1 ? 's' : ''} gerado
          {result.tickets.length > 1 ? 's' : ''} para {result.reservation.eventTitle}.
        </p>
        <Link to="/meus-ingressos">
          <Button className="mt-6">Ver meus ingressos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/15 text-3xl">✕</div>
      <h1 className="mt-4 font-display text-4xl text-text">Pagamento recusado</h1>
      <p className="mt-2 text-text-muted">{result.message}. O estoque reservado foi liberado.</p>
      <Link to={`/eventos/${result.reservation.eventId}`}>
        <Button className="mt-6">Tentar de novo</Button>
      </Link>
    </div>
  )
}
