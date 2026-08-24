import type { EventStatus, GateValidationResult, ReservationStatus, TicketStatus } from '../types'

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
}

export const EVENT_STATUS_TONE: Record<EventStatus, 'neutral' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  CANCELLED: 'danger',
}

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  PAYMENT_FAILED: 'Pagamento recusado',
  CANCELLED: 'Cancelada',
}

export const RESERVATION_STATUS_TONE: Record<ReservationStatus, 'neutral' | 'success' | 'danger' | 'warning'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'success',
  PAYMENT_FAILED: 'danger',
  CANCELLED: 'neutral',
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  VALID: 'Válido',
  USED: 'Utilizado',
  CANCELLED: 'Cancelado',
}

export const TICKET_STATUS_TONE: Record<TicketStatus, 'neutral' | 'success' | 'danger'> = {
  VALID: 'success',
  USED: 'neutral',
  CANCELLED: 'danger',
}

export const GATE_RESULT_LABEL: Record<GateValidationResult, string> = {
  VALID: 'Válido — entrada liberada',
  INVALID: 'Inválido',
  ALREADY_USED: 'Já utilizado',
  WRONG_EVENT: 'Evento errado',
}

export const GATE_RESULT_TONE: Record<GateValidationResult, 'success' | 'danger' | 'warning'> = {
  VALID: 'success',
  INVALID: 'danger',
  ALREADY_USED: 'warning',
  WRONG_EVENT: 'warning',
}
