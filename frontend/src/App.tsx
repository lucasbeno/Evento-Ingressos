import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireRole } from './auth/RequireRole'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { CheckoutPage } from './pages/customer/CheckoutPage'
import { EventDetailPage } from './pages/customer/EventDetailPage'
import { EventsListPage } from './pages/customer/EventsListPage'
import { MyTicketsPage } from './pages/customer/MyTicketsPage'
import { SharedTicketPage } from './pages/SharedTicketPage'

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
