import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'app_session'

// パスワードが正しければ true。ログイン成功時にこの値を Cookie に入れる。
function sessionToken() {
  return process.env.APP_PASSWORD ?? ''
}

export async function isLoggedIn() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  return !!token && token === sessionToken()
}

// ログインしていなければ /login へ飛ばす（ページ・アクションの先頭で呼ぶ）
export async function requireLogin() {
  if (!(await isLoggedIn())) {
    redirect('/login')
  }
}

export async function login(password: string) {
  const expected = process.env.APP_PASSWORD
  if (!expected || password !== expected) {
    return false
  }
  const store = await cookies()
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30日
  })
  return true
}

export async function logout() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

// API 用の認証チェック。
// ブラウザからは Cookie（ログイン画面と共通）、curl 等の外部からは
// `Authorization: Bearer <APP_PASSWORD>` ヘッダーのどちらでも通す。
export async function isAuthorizedRequest(request: Request) {
  if (await isLoggedIn()) return true

  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const expected = process.env.APP_PASSWORD

  return !!token && !!expected && token === expected
}
