'use client'

import { useState, useCallback, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Bell, Menu, X, LogOut } from 'lucide-react'
import SidebarMenu from '@/components/SidebarMenu'
import MobileBottomNav from '@/components/MobileBottomNav'

interface SidebarProps {
  children: React.ReactNode
}

const MemoizedSidebarMenu = memo(SidebarMenu)

export default function SidebarLayout({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const locale = pathname.split('/')[1] === 'en' || pathname.split('/')[1] === 'hi'
    ? pathname.split('/')[1]
    : 'en'

  const getLocalizedHref = useCallback((href: string) => {
    return `/${locale}${href}`
  }, [locale])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* ── Header ── */}
      <header className="glass-header fixed top-0 left-0 right-0 h-14 sm:h-16 z-40 safe-area-top">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2.5">
            {/* Desktop-only hamburger */}
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer hidden sm:block"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href={getLocalizedHref('/dashboard')} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <Package className="w-[1.1rem] h-[1.1rem] text-white" />
              </div>
              <span className="text-[1.05rem] sm:text-xl font-bold text-gray-900 tracking-tight">DKS StockAlert</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href={getLocalizedHref('/products/new')}
              prefetch={true}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200/50 cursor-pointer text-[0.8125rem] tap-bounce"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </Link>
            <Link
              href={getLocalizedHref('/alerts')}
              prefetch={true}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer relative"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
            </Link>
            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="sm:hidden p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full pt-3">
          <div className="px-4 pb-3 flex justify-end">
            <button
              onClick={closeSidebar}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pb-4 border-b border-gray-100">
            <Link
              href={getLocalizedHref('/dashboard')}
              className="flex items-center gap-2.5"
              onClick={closeSidebar}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">DKS StockAlert</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1 pb-24">
            <MemoizedSidebarMenu />
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-gray-500" />
              </div>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="pt-14 sm:pt-16 pb-[5.5rem] sm:pb-0 min-h-screen">
        <div className="p-3 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <MobileBottomNav onMenuClick={toggleSidebar} locale={locale} />
    </div>
  )
}
