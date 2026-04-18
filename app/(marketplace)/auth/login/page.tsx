import { LoginForm } from '@/components/marketplace/login-form'

export const metadata = { title: 'Prijava | Omarska Marketplace' }

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Prijava</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Unesite svoju email adresu i poslat ćemo vam link za prijavu.
      </p>
      <LoginForm />
    </div>
  )
}
