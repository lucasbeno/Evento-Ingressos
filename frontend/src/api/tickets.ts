import client from './client'
import type { TicketResponse } from '../types'

export function listMyTickets() {
  return client.get<TicketResponse[]>('/tickets/mine').then((r) => r.data)
}

export function getSharedTicket(shareToken: string) {
  return client.get<TicketResponse>(`/tickets/shared/${shareToken}`).then((r) => r.data)
}
