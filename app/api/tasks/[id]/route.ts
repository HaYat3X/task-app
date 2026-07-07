import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedRequest } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'
import type { Status } from '@/lib/types'

const STATUSES: Status[] = ['todo', 'doing', 'done']

// GET /api/tasks/:id
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/tasks/[id]'>
) {
  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'タスクが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ task: data })
}

// PATCH /api/tasks/:id
// body の指定されたフィールドだけ更新する
// { title?, status?, important?, urgent?, project_id?, position? }
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/tasks/[id]'>
) {
  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '不正なJSONです' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'title は空にできません' }, { status: 400 })
    }
    update.title = title
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as Status)) {
      return NextResponse.json(
        { error: `status は ${STATUSES.join(' / ')} のいずれかで指定してください` },
        { status: 400 }
      )
    }
    update.status = body.status
  }

  if (body.important !== undefined) update.important = body.important === true
  if (body.urgent !== undefined) update.urgent = body.urgent === true

  if (body.project_id !== undefined) {
    update.project_id =
      typeof body.project_id === 'string' && body.project_id ? body.project_id : null
  }

  if (body.position !== undefined) {
    const position = Number(body.position)
    if (Number.isNaN(position)) {
      return NextResponse.json({ error: 'position は数値で指定してください' }, { status: 400 })
    }
    update.position = position
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '更新する項目がありません' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (!data) {
    return NextResponse.json({ error: 'タスクが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ task: data })
}

// DELETE /api/tasks/:id
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<'/api/tasks/[id]'>
) {
  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const supabase = getSupabase()
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
