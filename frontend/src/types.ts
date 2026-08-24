export type UserRole = 'ORGANIZER' | 'CUSTOMER' | 'GATE'

export interface AuthResponse {
  token: string
  userId: string
  name: string
  email: string
  role: UserRole
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
export type EventSource = 'TICKETMASTER' | 'MANUAL'

export interface EventSummary {
  id: string
  organizerId: string
  organizerName: string
  title: string
  description: string | null
  externalSource: EventSource
  imageUrl: string | null
  venueName: string
  venueCity: string
  eventDatetime: string
  capacity: number
  soldCount: number
  availableTickets: number
  price: number
  status: EventStatus
  createdAt: string
}

export type ReservationStatus = 'PENDING_PAYMENT' | 'PAID' | 'PAYMENT_FAILED' | 'CANCELLED'

export interface ReservationResponse {
  id: string
  eventId: string
  eventTitle: string
  eventDatetime: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: ReservationStatus
  createdAt: string
}

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED'

export interface TicketResponse {
  id: string
  eventId: string
  eventTitle: string
  eventDatetime: string
  venueName: string
  venueCity: string
  qrCode: string
  shareToken: string
  status: TicketStatus
  usedAt: string | null
  createdAt: string
}

export interface PaymentResponse {
  approved: boolean
  message: string
  reservation: ReservationResponse
  tickets: TicketResponse[]
}

export interface ApiError {
  message: string
  timestamp: string
  fieldErrors: Record<string, string> | null
}

export type GateValidationResult = 'VALID' | 'INVALID' | 'ALREADY_USED' | 'WRONG_EVENT'

export interface GateValidationResponse {
  result: GateValidationResult
  message: string
  ticketId: string | null
  eventTitle: string | null
  customerName: string | null
  usedAt: string | null
}

export interface CatalogEventResponse {
  externalId: string
  title: string
  imageUrl: string | null
  venueName: string | null
  venueCity: string | null
  eventDatetime: string | null
}
