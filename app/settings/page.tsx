import { requireLogin } from '@/lib/auth'
import { getSupabase, type PrioritySetting, type Quadrant } from '@/lib/supabase'
import Nav from '../nav'
import Shell from '../shell'
import SettingsClient from './settings-client'

const ORDER: Quadrant[] = [
  'important_urgent',
  'important_not_urgent',
  'not_important_urgent',
  'not_important_not_urgent',
]

export default async function SettingsPage() {
  await requireLogin()

  const supabase = getSupabase()
  const { data, error } = await supabase.from('priority_settings').select('*')
  if (error) throw new Error(error.message)

  const byQuadrant = new Map((data ?? []).map((s) => [s.quadrant, s]))
  const settings = ORDER.map((q) => byQuadrant.get(q)).filter(
    Boolean
  ) as PrioritySetting[]

  return (
    <Shell>
      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <header className="animate-fade-up mb-7 flex items-center justify-between">
          <h1 className="text-[26px] font-semibold tracking-tight">優先度設定</h1>
          <Nav />
        </header>

        <div className="animate-fade-up">
          <p className="mb-3 text-sm font-medium text-neutral-500">
            優先度（重要度 × 緊急度）のラベルと色
          </p>
          <SettingsClient settings={settings} />
        </div>
      </main>
    </Shell>
  )
}
