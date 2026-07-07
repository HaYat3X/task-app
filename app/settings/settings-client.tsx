'use client'

import { useState, useTransition } from 'react'
import { updatePrioritySetting } from '../actions'
import type { PrioritySetting, Quadrant } from '@/lib/types'

const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#a1a1aa', '#ec4899']

const AXIS: Record<Quadrant, string> = {
  important_urgent: '重要 × 緊急',
  important_not_urgent: '重要 × 非緊急',
  not_important_urgent: '非重要 × 緊急',
  not_important_not_urgent: '非重要 × 非緊急',
}

export default function SettingsClient({
  settings,
}: {
  settings: PrioritySetting[]
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {settings.map((s) => (
        <QuadrantCard key={s.quadrant} setting={s} />
      ))}
    </div>
  )
}

function QuadrantCard({ setting }: { setting: PrioritySetting }) {
  const [label, setLabel] = useState(setting.label)
  const [color, setColor] = useState(setting.color)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const dirty = label !== setting.label || color !== setting.color

  function save() {
    startTransition(async () => {
      await updatePrioritySetting(setting.quadrant, label.trim() || setting.label, color)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_6px_16px_-8px_rgba(24,24,27,0.12)]">
      <p className="mb-2.5 text-xs font-medium text-neutral-400">
        {AXIS[setting.quadrant]}
      </p>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="mb-3 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[15px] font-medium outline-none focus:border-indigo-400 focus:bg-white"
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`色 ${c}`}
            className="h-6 w-6 rounded-full transition"
            style={{
              backgroundColor: c,
              boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {label || '—'}
        </span>
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={save}
          className="ml-auto rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-30"
        >
          {saved ? '保存しました' : '保存'}
        </button>
      </div>
    </div>
  )
}
