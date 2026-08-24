import client from './client'
import type { EventSummary } from '../types'

export function listPublishedEvents() {
  return client.get<EventSummary[]>('/events').then((r) => r.data)
}

export function getPublishedEvent(id: string) {
  return client.get<EventSummary>(`/events/${id}`).then((r) => r.data)
}
