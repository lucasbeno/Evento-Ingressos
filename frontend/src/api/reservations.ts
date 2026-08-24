import client from './client'
import type { PaymentResponse, ReservationResponse } from '../types'

export function createReservation(eventId: string, quantity: number) {
  return client.post<ReservationResponse>('/reservations', { eventId, quantity }).then((r) => r.data)
}

export function listMyReservations() {
  return client.get<ReservationResponse[]>('/reservations').then((r) => r.data)
}

export function getMyReservation(id: string) {
  return client.get<ReservationResponse>(`/reservations/${id}`).then((r) => r.data)
}

export interface PaymentPayload {
  cardNumber: string
  cardHolderName: string
  expiry: string
  cvv: string
}

export function payReservation(reservationId: string, payload: PaymentPayload) {
  return client.post<PaymentResponse>(`/reservations/${reservationId}/pay`, payload).then((r) => r.data)
}
