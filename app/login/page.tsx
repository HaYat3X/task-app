import { redirect } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import LoginForm from './login-form'
import Logo from '../logo'

export default async function LoginPage() {
  if (await isLoggedIn()) {
    redirect('/')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="animate-fade-up w-full max-w-sm rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-[0_10px_30px_-8px_rgba(24,24,27,0.22)] backdrop-blur">
        <Logo size={48} />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-900">
          Tasks
        </h1>
        <p className="mb-7 mt-1 text-sm text-neutral-500">
          続けるにはパスワードを入力してください
        </p>
        <LoginForm />
      </div>
    </main>
  )
}
