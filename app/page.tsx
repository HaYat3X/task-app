import { requireLogin } from '@/lib/auth'
import {
  getSupabase,
  type PrioritySetting,
  type Project,
  type Task,
} from '@/lib/supabase'
import AddTask from './add-task'
import Board from './board'
import Nav from './nav'
import Shell from './shell'

function todayLabel() {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())
}

export default async function Home() {
  await requireLogin()

  const supabase = getSupabase()
  const [{ data, error }, { data: projectsData }, { data: prioData }] =
    await Promise.all([
      supabase.from('tasks').select('*').order('position', { ascending: true }),
      supabase.from('projects').select('*').order('position', { ascending: true }),
      supabase.from('priority_settings').select('*'),
    ])

  if (error) {
    throw new Error(error.message)
  }

  const tasks = (data ?? []) as Task[]
  const projects = (projectsData ?? []) as Project[]
  const prioritySettings = (prioData ?? []) as PrioritySetting[]
  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  const remaining = total - done
  const progress = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <Shell>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
        {/* ヘッダー */}
        <header className="animate-fade-up mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-semibold leading-none tracking-tight">
              ボード
            </h1>
            <p className="mt-1.5 text-[13px] font-medium text-neutral-400">
              {todayLabel()}
            </p>
          </div>
          <Nav />
        </header>

        <div className="mx-auto max-w-lg">
          {/* 進捗カード */}
          {total > 0 && (
            <div className="animate-fade-up mb-4 rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_6px_16px_-8px_rgba(24,24,27,0.12)] backdrop-blur">
              <div className="mb-2.5 flex items-baseline justify-between">
                <span className="text-sm font-medium text-neutral-500">
                  {remaining > 0 ? `残り ${remaining} 件` : 'すべて完了 🎉'}
                </span>
                <span className="text-sm font-semibold tabular-nums text-neutral-900">
                  {progress}
                  <span className="text-neutral-400">%</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-[width] duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 追加フォーム */}
          <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <AddTask projects={projects} />
          </div>
        </div>

        {/* カンバンボード */}
        <div
          className="animate-fade-up mt-6"
          style={{ animationDelay: '120ms' }}
        >
          <Board
            tasks={tasks}
            projects={projects}
            prioritySettings={prioritySettings}
          />
        </div>
      </main>
    </Shell>
  )
}
