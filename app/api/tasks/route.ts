import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedRequest } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'
import type { Status } from '@/lib/types'

const STATUSES: Status[] = ['todo', 'doing', 'done']

// GET /api/tasks
// クエリパラメータ: status=todo|doing|done, project_id=<uuid>
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get('status')
  const projectId = request.nextUrl.searchParams.get('project_id')

  if (status && !STATUSES.includes(status as Status)) {
    return NextResponse.json(
      { error: `status は ${STATUSES.join(' / ')} のいずれかで指定してください` },
      { status: 400 }
    )
  }

  const supabase = getSupabase()
  let query = supabase.from('tasks').select('*').order('position', { ascending: true })

  if (status) query = query.eq('status', status)
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tasks: data })
}

// POST /api/tasks
// body: { title: string, status?, important?, urgent?, project_id? }
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '不正なJSONです' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) {
    return NextResponse.json({ error: 'title は必須です' }, { status: 400 })
  }

  const status: Status = STATUSES.includes(body.status as Status)
    ? (body.status as Status)
    : 'todo'
  const important = body.important === true
  const urgent = body.urgent === true
  const projectId =
    typeof body.project_id === 'string' && body.project_id ? body.project_id : null

  const supabase = getSupabase()

  const { data: top } = await supabase
    .from('tasks')
    .select('position')
    .eq('status', status)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()

  const position = (top?.position ?? 1) - 1

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      status,
      important,
      urgent,
      project_id: projectId,
      position,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ task: data }, { status: 201 })
}
