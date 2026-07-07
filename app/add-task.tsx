'use client'

import { useRef, useState, useTransition } from 'react'
import { addTask } from './actions'
import type { Project } from '@/lib/types'

export default function AddTask({ projects }: { projects: Project[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [important, setImportant] = useState(false)
  const [urgent, setUrgent] = useState(false)

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await addTask(formData)
          formRef.current?.reset()
          setImportant(false)
          setUrgent(false)
        })
      }}
      className="group rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_6px_16px_-8px_rgba(24,24,27,0.12)] transition focus-within:border-indigo-300 focus-within:shadow-[0_10px_30px_-8px_rgba(24,24,27,0.22)]"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center text-neutral-400 transition group-focus-within:text-indigo-500">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          name="title"
          placeholder="新しいタスクを追加…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_-2px_rgba(24,24,27,0.5)] transition hover:bg-neutral-700 active:scale-95 disabled:opacity-40"
        >
          追加
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-1 pt-2">
        {projects.length > 0 && (
          <select
            name="project_id"
            defaultValue=""
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-600 outline-none focus:border-indigo-400"
          >
            <option value="">プロジェクトなし</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100">
          <input
            type="checkbox"
            name="important"
            checked={important}
            onChange={(e) => setImportant(e.target.checked)}
            className="h-3.5 w-3.5 accent-indigo-500"
          />
          重要
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100">
          <input
            type="checkbox"
            name="urgent"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="h-3.5 w-3.5 accent-red-500"
          />
          緊急
        </label>
      </div>
    </form>
  )
}
