import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeftIcon } from "lucide-react"
import { Link, useLocation, useNavigate, type Location } from "react-router-dom"

import { Logo } from "@/components/app/logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { loginSchema, type LoginFormData } from "@/schemas"
import { handleError } from "@/utils"

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)

      // Volta pra página que tentou acessar antes de cair no login
      const from = (location.state as { from?: Location } | null)?.from
      navigate(from?.pathname ?? "/admin", { replace: true })
    } catch (error) {
      handleError(error, "Não foi possível entrar")
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-96 max-w-2xl rounded-full bg-primary/15 blur-3xl"
      />

      <Link to="/" aria-label="Ticketly - início">
        <Logo />
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Painel administrativo</CardTitle>
          <CardDescription>Entre com sua conta de admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup className="gap-5">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@ticketly.dev"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <FieldError errors={[errors.password]} />
              </Field>

              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Spinner data-icon="inline-start" />}
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link to="/" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Voltar para a loja
      </Button>
    </main>
  )
}
