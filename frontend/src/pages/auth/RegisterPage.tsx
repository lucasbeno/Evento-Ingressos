import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { apiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await registerAccount(values.name, values.email, values.password)
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Não foi possível criar a conta'))
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-5xl tracking-wide text-lime">Criar conta</h1>
      <p className="mt-2 text-text-muted">
        Cadastro é só para clientes — organizador e portaria são contas provisionadas à parte.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
        <Field label="Nome" autoComplete="name" {...register('name')} error={errors.name?.message} />
        <Field label="E-mail" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <Field
          label="Senha"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
          hint={<span className="text-xs text-text-faint">Mínimo de 8 caracteres.</span>}
        />
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-semibold text-lime hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
