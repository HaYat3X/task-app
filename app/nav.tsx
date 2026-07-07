'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'ボード' },
  { href: '/projects', label: 'プロジェクト' },
  { href: '/settings', label: '優先度設定' },
]

// モバイル用の簡易ナビ（サイドバーは sm 以上でのみ表示されるため）
export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 rounded-full border border-neutral-200 bg-white/70 p-1 text-sm backdrop-blur sm:hidden">
      {links.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-3.5 py-1.5 font-medium transition ${
              active
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
