import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { apiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { roleHome } from '../../lib/roleHome'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const user = await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? roleHome(user.role), { replace: true })
    } catch (err) {
      setServerError(apiErrorMessage(err, 'E-mail ou senha inválidos'))
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-5xl tracking-wide text-lime">Entrar</h1>
      <p className="mt-2 text-text-muted">Acesse sua conta pra reservar ingressos.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
        <Field label="E-mail" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        Não tem conta?{' '}
        <Link to="/cadastrar" className="font-semibold text-lime hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
