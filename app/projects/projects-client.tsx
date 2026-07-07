'use client'

import { useRef, useState, useTransition } from 'react'
import { addProject, deleteProject, updateProject } from '../actions'
import type { Project } from '@/lib/types'

const COLORS = [
  '#6366f1',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
  '#ec4899',
  '#a1a1aa',
]

export default function ProjectsClient({ projects }: { projects: Project[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [color, setColor] = useState(COLORS[0])
  const [pending, startTransition] = useTransition()

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      {/* 追加フォーム */}
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await addProject(formData)
            formRef.current?.reset()
            setColor(COLORS[0])
          })
        }}
        className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_6px_16px_-8px_rgba(24,24,27,0.12)]"
      >
        <p className="mb-3 text-sm font-semibold text-neutral-700">
          新しいプロジェクト
        </p>
        <input type="hidden" name="color" value={color} />
        <div className="flex gap-2">
          <input
            name="name"
            placeholder="プロジェクト名…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-[15px] text-neutral-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 active:scale-95 disabled:opacity-40"
          >
            追加
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`色 ${c}`}
              className="h-7 w-7 rounded-full ring-offset-2 transition"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
              }}
            />
          ))}
        </div>
      </form>

      {/* 一覧 */}
      <div className="flex flex-col gap-2">
        {projects.length === 0 && (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white/50 py-10 text-center text-sm text-neutral-400">
            プロジェクトはまだありません
          </p>
        )}
        {projects.map((p) => (
          <ProjectRow key={p.id} project={p} />
        ))}
      </div>
    </div>
  )
}

function ProjectRow({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [pending, startTransition] = useTransition()

  if (editing) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-white p-3 shadow-[0_1px_2px_rgba(24,24,27,0.05)]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="mb-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[15px] outline-none focus:border-indigo-400 focus:bg-white"
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-6 w-6 rounded-full transition"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await updateProject(project.id, name.trim() || project.name, color)
                setEditing(false)
              })
            }
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => {
              setName(project.name)
              setColor(project.color)
              setEditing(false)
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: project.color }}
      />
      <span className="flex-1 text-[15px] font-medium text-neutral-800">
        {project.name}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg px-2.5 py-1.5 text-sm text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
      >
        編集
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteProject(project.id))}
        className="rounded-lg px-2.5 py-1.5 text-sm text-neutral-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
      >
        削除
      </button>
    </div>
  )
}
