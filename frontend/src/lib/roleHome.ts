import type { UserRole } from '../types'

export function roleHome(role: UserRole): string {
  switch (role) {
    case 'ORGANIZER':
      return '/organizador'
    case 'GATE':
      return '/portaria'
    default:
      return '/'
  }
}
