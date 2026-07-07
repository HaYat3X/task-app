import 'server-only'
import { createClient } from '@supabase/supabase-js'

// サーバー専用の Supabase クライアント。
// UI はパスワードで保護し、DB アクセスはすべてサーバー側で行う。
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase の環境変数が未設定です。.env.local を確認してください。'
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export * from './types'
