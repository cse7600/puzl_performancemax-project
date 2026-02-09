'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Wallet,
  Menu,
  LogOut,
  ArrowLeft,
  Settings,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/partners', label: '파트너 관리', icon: Users },
  { href: '/admin/referrals', label: '피추천인 관리', icon: UserCheck },
  { href: '/admin/settlements', label: '정산 관리', icon: Wallet },
  { href: '/admin/campaigns', label: '캠페인 설정', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/admin' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b">
            <Link href="/admin" className="text-blue-600 text-xl font-bold">
              KEEPER Admin
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <NavLinks />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <ArrowLeft className="w-4 h-4 mr-2" />
                파트너 대시보드로
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4">
        <Link href="/admin" className="text-blue-600 text-xl font-bold">
          KEEPER Admin
        </Link>

        {mounted && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <p className="font-bold text-blue-600">KEEPER Admin</p>
                  <p className="text-xs text-gray-500">관리자 대시보드</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} />
                </nav>

                <div className="p-4 border-t">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      파트너 대시보드
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
