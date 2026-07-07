'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { saveBoard, deleteTask, updateTaskMeta } from './actions'
import {
  quadrantOf,
  type PrioritySetting,
  type Project,
  type Status,
  type Task,
} from '@/lib/types'

type BoardState = Record<Status, Task[]>

const STATUSES: Status[] = ['todo', 'doing', 'done']

const COLUMNS: { id: Status; title: string; dot: string }[] = [
  { id: 'todo', title: '未着手', dot: 'bg-neutral-400' },
  { id: 'doing', title: '進行中', dot: 'bg-indigo-500' },
  { id: 'done', title: '完了', dot: 'bg-emerald-500' },
]

function group(tasks: Task[]): BoardState {
  const b: BoardState = { todo: [], doing: [], done: [] }
  for (const t of tasks) b[t.status]?.push(t)
  for (const s of STATUSES) b[s].sort((a, c) => a.position - c.position)
  return b
}

function isColumnId(id: string): id is Status {
  return (STATUSES as string[]).includes(id)
}

function findColumn(state: BoardState, id: string): Status | undefined {
  if (isColumnId(id)) return id
  return STATUSES.find((s) => state[s].some((t) => t.id === id))
}

type BoardProps = {
  tasks: Task[]
  projects: Project[]
  prioritySettings: PrioritySetting[]
}

export default function Board({ tasks, projects, prioritySettings }: BoardProps) {
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const filtered = useMemo(
    () =>
      projectFilter ? tasks.filter((t) => t.project_id === projectFilter) : tasks,
    [tasks, projectFilter]
  )

  const [board, setBoard] = useState<BoardState>(() => group(filtered))
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setBoard(group(filtered))
  }, [filtered])

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  )
  const prioBySlug = useMemo(
    () => new Map(prioritySettings.map((s) => [s.quadrant, s])),
    [prioritySettings]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id)
    for (const s of STATUSES) {
      const t = board[s].find((x) => x.id === id)
      if (t) {
        setActiveTask(t)
        return
      }
    }
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)

    setBoard((prev) => {
      const from = findColumn(prev, activeId)
      const to = findColumn(prev, overId)
      if (!from || !to || from === to) return prev

      const fromItems = prev[from]
      const toItems = prev[to]
      const activeIndex = fromItems.findIndex((t) => t.id === activeId)
      if (activeIndex < 0) return prev

      const moved = { ...fromItems[activeIndex], status: to }
      const overIndex = isColumnId(overId)
        ? toItems.length
        : toItems.findIndex((t) => t.id === overId)
      const insertAt = overIndex < 0 ? toItems.length : overIndex

      console.log('[board] カラム移動', { title: moved.title, from, to })

      return {
        ...prev,
        [from]: fromItems.filter((t) => t.id !== activeId),
        [to]: [
          ...toItems.slice(0, insertAt),
          moved,
          ...toItems.slice(insertAt),
        ],
      }
    })
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveTask(null)

    if (!over) {
      console.warn('[board] drop先が見つからなかったため何もしません', {
        activeId: active.id,
      })
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    // setState の更新関数の外で使う値は、更新関数の戻り値に依存させない。
    // （更新関数は同期的に実行される保証がないため、外部変数への代入は罠になる）
    const col = findColumn(board, activeId)
    const overCol = findColumn(board, overId)

    if (!col || !overCol) {
      console.warn('[board] カラムが特定できませんでした', {
        activeId,
        overId,
        col,
        overCol,
      })
      return
    }

    let next = board
    if (col === overCol) {
      const items = board[col]
      const oldIndex = items.findIndex((t) => t.id === activeId)
      const newIndex = isColumnId(overId)
        ? items.length - 1
        : items.findIndex((t) => t.id === overId)
      if (newIndex >= 0 && oldIndex !== newIndex) {
        next = { ...board, [col]: arrayMove(items, oldIndex, newIndex) }
        setBoard(next)
      }
    }

    const payload = {
      todo: next.todo.map((t) => t.id),
      doing: next.doing.map((t) => t.id),
      done: next.done.map((t) => t.id),
    }
    console.log('[board] saveBoard 呼び出し', payload)

    startTransition(() => {
      saveBoard(payload)
        .then(() => console.log('[board] saveBoard 成功'))
        .catch((err) => console.error('[board] saveBoard 失敗', err))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            active={projectFilter === null}
            onClick={() => setProjectFilter(null)}
            label="すべて"
          />
          {projects.map((p) => (
            <FilterPill
              key={p.id}
              active={projectFilter === p.id}
              onClick={() => setProjectFilter(p.id)}
              label={p.name}
              color={p.color}
            />
          ))}
        </div>
      )}

      <DndContext
        id="kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 sm:gap-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              col={col}
              tasks={board[col.id]}
              projectById={projectById}
              prioBySlug={prioBySlug}
              projects={projects}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <OverlayCard
              task={activeTask}
              project={activeTask.project_id ? projectById.get(activeTask.project_id) : undefined}
              priority={prioBySlug.get(quadrantOf(activeTask.important, activeTask.urgent))}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100'
      }`}
    >
      {color && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </button>
  )
}

function Column({
  col,
  tasks,
  projectById,
  prioBySlug,
  projects,
}: {
  col: (typeof COLUMNS)[number]
  tasks: Task[]
  projectById: Map<string, Project>
  prioBySlug: Map<string, PrioritySetting>
  projects: Project[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <section className="flex w-[80vw] max-w-[320px] shrink-0 flex-col sm:w-auto sm:flex-1">
      <div className="mb-2.5 flex items-center gap-2 px-1.5">
        <span className={`h-2 w-2 rounded-full ${col.dot}`} />
        <h2 className="text-sm font-semibold text-neutral-700">{col.title}</h2>
        <span className="ml-auto rounded-full bg-neutral-200/70 px-2 py-0.5 text-xs font-medium tabular-nums text-neutral-500">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[140px] flex-1 flex-col gap-2 rounded-2xl border p-1.5 transition-colors ${
          isOver
            ? 'border-indigo-200 bg-indigo-50/50'
            : 'border-neutral-200/70 bg-neutral-500/[0.02]'
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((t) => (
            <SortableCard
              key={t.id}
              task={t}
              project={t.project_id ? projectById.get(t.project_id) : undefined}
              priority={prioBySlug.get(quadrantOf(t.important, t.urgent))}
              projects={projects}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="grid flex-1 place-items-center rounded-xl border border-dashed border-neutral-200 px-3 py-6 text-center text-xs text-neutral-400">
            ここにドラッグ
          </p>
        )}
      </div>
    </section>
  )
}

const PRIORITY_ORDER: [boolean, boolean][] = [
  [false, false],
  [false, true],
  [true, false],
  [true, true],
]

function SortableCard({
  task,
  project,
  priority,
  projects,
}: {
  task: Task
  project?: Project
  priority?: PrioritySetting
  projects: Project[]
}) {
  const [pending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function cyclePriority() {
    const idx = PRIORITY_ORDER.findIndex(
      ([i, u]) => i === task.important && u === task.urgent
    )
    const [important, urgent] = PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length]
    startTransition(() => {
      updateTaskMeta(task.id, { important, urgent }).catch((err) =>
        console.error('[board] 優先度の更新に失敗', err)
      )
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex cursor-grab touch-none flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(24,24,27,0.05)] transition active:cursor-grabbing ${
        isDragging ? 'opacity-40' : 'hover:shadow-[0_6px_16px_-8px_rgba(24,24,27,0.25)]'
      } ${pending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-1.5">
        <p
          className={`flex-1 break-words pt-0.5 text-[14px] leading-snug ${
            task.status === 'done'
              ? 'text-neutral-400 line-through'
              : 'text-neutral-800'
          }`}
        >
          {task.title}
        </p>

        {/* 削除 */}
        <button
          type="button"
          aria-label="削除"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() =>
            startTransition(() => {
              deleteTask(task.id).catch((err) =>
                console.error('[board] 削除に失敗', err)
              )
            })
          }
          className="shrink-0 rounded-md p-1 text-neutral-300 opacity-100 transition hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M6 6l8 8M14 6l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {priority && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={cyclePriority}
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white transition active:scale-95"
            style={{ backgroundColor: priority.color }}
          >
            {priority.label}
          </button>
        )}

        {projects.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100"
            >
              {project ? (
                <>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </>
              ) : (
                '+ プロジェクト'
              )}
            </button>

            {menuOpen && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-neutral-200 bg-white p-1 shadow-[0_10px_30px_-8px_rgba(24,24,27,0.22)]"
              >
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      updateTaskMeta(task.id, { project_id: null }).catch(
                        (err) => console.error('[board] プロジェクト解除に失敗', err)
                      )
                    })
                    setMenuOpen(false)
                  }}
                  className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-500 hover:bg-neutral-100"
                >
                  なし
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        updateTaskMeta(task.id, { project_id: p.id }).catch(
                          (err) => console.error('[board] プロジェクト設定に失敗', err)
                        )
                      })
                      setMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-100"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OverlayCard({
  task,
  project,
  priority,
}: {
  task: Task
  project?: Project
  priority?: PrioritySetting
}) {
  return (
    <div className="flex w-[260px] rotate-2 cursor-grabbing flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-[0_20px_50px_-12px_rgba(24,24,27,0.4)]">
      <div className="flex items-start gap-1.5">
        <p
          className={`flex-1 break-words pt-0.5 text-[14px] leading-snug ${
            task.status === 'done'
              ? 'text-neutral-400 line-through'
              : 'text-neutral-800'
          }`}
        >
          {task.title}
        </p>
      </div>
      {(priority || project) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {priority && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: priority.color }}
            >
              {priority.label}
            </span>
          )}
          {project && (
            <span className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
