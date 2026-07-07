'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSupabase, type Status } from '@/lib/supabase'
import { login, logout, requireLogin } from '@/lib/auth'

// ---- 認証 ----

export type LoginState = { error?: string }

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')
  const ok = await login(password)
  if (!ok) {
    return { error: 'パスワードが違います' }
  }
  redirect('/')
}

export async function logoutAction() {
  await logout()
  redirect('/login')
}

// ---- タスク ----

export async function addTask(formData: FormData) {
  await requireLogin()
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return

  const projectId = String(formData.get('project_id') ?? '') || null
  const important = formData.get('important') === 'on'
  const urgent = formData.get('urgent') === 'on'

  const supabase = getSupabase()

  // 新しいタスクは「未着手」カラムの先頭に入れる
  const { data: top } = await supabase
    .from('tasks')
    .select('position')
    .eq('status', 'todo')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()

  const position = (top?.position ?? 1) - 1

  const { error } = await supabase.from('tasks').insert({
    title,
    status: 'todo',
    position,
    project_id: projectId,
    important,
    urgent,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/')
}

export async function updateTaskMeta(
  id: string,
  fields: { important?: boolean; urgent?: boolean; project_id?: string | null }
) {
  await requireLogin()
  const supabase = getSupabase()
  const { error } = await supabase.from('tasks').update(fields).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
}

// カンバンのドラッグ&ドロップ後、各カラムの状態と並び順をまとめて保存する
export async function saveBoard(columns: Record<Status, string[]>) {
  await requireLogin()
  const supabase = getSupabase()

  const jobs: { status: Status; id: string; index: number }[] = []
  ;(Object.keys(columns) as Status[]).forEach((status) => {
    columns[status].forEach((id, index) => {
      jobs.push({ status, id, index })
    })
  })

  const results = await Promise.all(
    jobs.map((j) =>
      supabase
        .from('tasks')
        .update({ status: j.status, position: j.index })
        .eq('id', j.id)
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)

  revalidatePath('/')
}

export async function deleteTask(id: string) {
  await requireLogin()
  const supabase = getSupabase()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
}

// ---- プロジェクト ----

export async function addProject(formData: FormData) {
  await requireLogin()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const color = String(formData.get('color') ?? '#6366f1')

  const supabase = getSupabase()
  const { data: top } = await supabase
    .from('projects')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (top?.position ?? 0) + 1

  const { error } = await supabase.from('projects').insert({ name, color, position })
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/projects')
}

export async function updateProject(id: string, name: string, color: string) {
  await requireLogin()
  const supabase = getSupabase()
  const { error } = await supabase
    .from('projects')
    .update({ name, color })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/projects')
}

export async function deleteProject(id: string) {
  await requireLogin()
  const supabase = getSupabase()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/projects')
}

// ---- 優先度設定（4象限のラベル・色） ----

export async function updatePrioritySetting(
  quadrant: string,
  label: string,
  color: string
) {
  await requireLogin()
  const supabase = getSupabase()
  const { error } = await supabase
    .from('priority_settings')
    .update({ label, color })
    .eq('quadrant', quadrant)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/settings')
}
