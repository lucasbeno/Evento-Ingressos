import client from './client'
import type { EventSummary } from '../types'

export interface CreateEventPayload {
  title: string
  description?: string
  imageUrl?: string
  venueName: string
  venueCity: string
  eventDatetime: string
  capacity: number
  price: number
}

export type UpdateEventPayload = CreateEventPayload

export interface CreateEventFromCatalogPayload {
  externalId: string
  capacity: number
  price: number
}

export function createEvent(payload: CreateEventPayload) {
  return client.post<EventSummary>('/organizer/events', payload).then((r) => r.data)
}

export function createEventFromCatalog(payload: CreateEventFromCatalogPayload) {
  return client.post<EventSummary>('/organizer/events/from-catalog', payload).then((r) => r.data)
}

export function listMyOrganizerEvents() {
  return client.get<EventSummary[]>('/organizer/events').then((r) => r.data)
}

export function getMyOrganizerEvent(id: string) {
  return client.get<EventSummary>(`/organizer/events/${id}`).then((r) => r.data)
}

export function updateEvent(id: string, payload: UpdateEventPayload) {
  return client.put<EventSummary>(`/organizer/events/${id}`, payload).then((r) => r.data)
}

export function publishEvent(id: string) {
  return client.post<EventSummary>(`/organizer/events/${id}/publish`).then((r) => r.data)
}

export function cancelEvent(id: string) {
  return client.post<EventSummary>(`/organizer/events/${id}/cancel`).then((r) => r.data)
}
