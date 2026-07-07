import { requireLogin } from '@/lib/auth'
import { getSupabase, type Project } from '@/lib/supabase'
import Nav from '../nav'
import Shell from '../shell'
import ProjectsClient from './projects-client'

export default async function ProjectsPage() {
  await requireLogin()

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)

  const projects = (data ?? []) as Project[]

  return (
    <Shell>
      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <header className="animate-fade-up mb-7 flex items-center justify-between">
          <h1 className="text-[26px] font-semibold tracking-tight">
            プロジェクト
          </h1>
          <Nav />
        </header>

        <ProjectsClient projects={projects} />
      </main>
    </Shell>
  )
}
