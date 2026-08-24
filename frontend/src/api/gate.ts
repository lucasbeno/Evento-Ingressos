import client from './client'
import type { GateValidationResponse } from '../types'

export function validateTicket(eventId: string, code: string) {
  return client.post<GateValidationResponse>('/gate/validate', { eventId, code }).then((r) => r.data)
}
