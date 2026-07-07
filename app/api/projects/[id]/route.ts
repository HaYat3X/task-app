import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedRequest } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

// GET /api/projects/:id
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/projects/[id]'>
) {
  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ project: data })
}

// PATCH /api/projects/:id
// body: { name?, color?, position? }
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/projects/[id]'>
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

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'name は空にできません' }, { status: 400 })
    }
    update.name = name
  }

  if (body.color !== undefined) {
    const color = typeof body.color === 'string' ? body.color.trim() : ''
    if (!color) {
      return NextResponse.json({ error: 'color は空にできません' }, { status: 400 })
    }
    update.color = color
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
    .from('projects')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (!data) {
    return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ project: data })
}

// DELETE /api/projects/:id
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<'/api/projects/[id]'>
) {
  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const supabase = getSupabase()
  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
