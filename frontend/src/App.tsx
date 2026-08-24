import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireRole } from './auth/RequireRole'
import { Layout } from './components/Layout'
import { Spinner } from './components/Spinner'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { CheckoutPage } from './pages/customer/CheckoutPage'
import { EventDetailPage } from './pages/customer/EventDetailPage'
import { EventsListPage } from './pages/customer/EventsListPage'
import { MyTicketsPage } from './pages/customer/MyTicketsPage'
import { CreateEventPage } from './pages/organizer/CreateEventPage'
import { OrganizerEventDetailPage } from './pages/organizer/OrganizerEventDetailPage'
import { OrganizerEventsListPage } from './pages/organizer/OrganizerEventsListPage'
import { SharedTicketPage } from './pages/SharedTicketPage'

// A lib de leitura de QR (zxing) só importa de verdade quando alguém entra em
// /portaria — não faz sentido todo cliente navegando eventos baixar esse peso.
const GatePage = lazy(() => import('./pages/gate/GatePage').then((m) => ({ default: m.GatePage })))

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<EventsListPage />} />
        <Route path="/eventos/:id" element={<EventDetailPage />} />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastrar" element={<RegisterPage />} />
        <Route path="/ingressos/compartilhado/:shareToken" element={<SharedTicketPage />} />

        <Route
          path="/checkout/:id"
          element={
            <RequireRole roles={['CUSTOMER']}>
              <CheckoutPage />
            </RequireRole>
          }
        />
        <Route
          path="/meus-ingressos"
          element={
            <RequireRole roles={['CUSTOMER']}>
              <MyTicketsPage />
            </RequireRole>
          }
        />

        <Route
          path="/organizador"
          element={
            <RequireRole roles={['ORGANIZER']}>
              <OrganizerEventsListPage />
            </RequireRole>
          }
        />
        <Route
          path="/organizador/novo"
          element={
            <RequireRole roles={['ORGANIZER']}>
              <CreateEventPage />
            </RequireRole>
          }
        />
        <Route
          path="/organizador/eventos/:id"
          element={
            <RequireRole roles={['ORGANIZER']}>
              <OrganizerEventDetailPage />
            </RequireRole>
          }
        />

        <Route
          path="/portaria"
          element={
            <RequireRole roles={['GATE']}>
              <Suspense fallback={<Spinner label="Carregando…" />}>
                <GatePage />
              </Suspense>
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
