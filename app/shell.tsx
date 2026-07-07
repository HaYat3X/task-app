import Sidebar from './sidebar'
import { logoutAction } from './actions'

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh text-neutral-900">
      <Sidebar logout={logoutAction} />
      <div className="sm:pl-60">{children}</div>
    </div>
  )
}
