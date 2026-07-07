export type Status = 'todo' | 'doing' | 'done'

export type Quadrant =
  | 'important_urgent'
  | 'important_not_urgent'
  | 'not_important_urgent'
  | 'not_important_not_urgent'

export function quadrantOf(important: boolean, urgent: boolean): Quadrant {
  if (important && urgent) return 'important_urgent'
  if (important && !urgent) return 'important_not_urgent'
  if (!important && urgent) return 'not_important_urgent'
  return 'not_important_not_urgent'
}

export type PrioritySetting = {
  quadrant: Quadrant
  label: string
  color: string
}

export type Project = {
  id: string
  name: string
  color: string
  position: number
  created_at: string
}

export type Task = {
  id: string
  title: string
  status: Status
  position: number
  important: boolean
  urgent: boolean
  project_id: string | null
  created_at: string
}
