'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '../actions'

const initial: LoginState = {}

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial)

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="password"
        name="password"
        autoFocus
        autoComplete="current-password"
        placeholder="パスワード"
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      />
      {state.error && (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white shadow-[0_4px_14px_-4px_rgba(24,24,27,0.5)] transition hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? '確認中…' : 'ログイン'}
      </button>
    </form>
  )
}
