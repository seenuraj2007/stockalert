'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import {
  Package, MapPin, Truck, FileText, ArrowUpDown, Calculator,
  Bell, Users, Settings, User, LogOut,
  BarChart3, TrendingUp, Receipt, ChevronRight
} from 'lucide-react'
import SidebarLayout from '@/components/SidebarLayout'
import { usePermissions } from '@/lib/UserContext'

interface MenuItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  permissionResource: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50', permissionResource: 'reports' },
      { href: '/analytics', label: 'Analytics', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50', permissionResource: 'analytics' },
    ]
  },
  {
    title: 'Inventory',
    items: [
      { href: '/products', label: 'Products', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50', permissionResource: 'products' },
      { href: '/locations', label: 'Locations', icon: MapPin, color: 'text-green-600', bgColor: 'bg-green-50', permissionResource: 'locations' },
      { href: '/suppliers', label: 'Suppliers', icon: Truck, color: 'text-orange-600', bgColor: 'bg-orange-50', permissionResource: 'suppliers' },
      { href: '/purchase-orders', label: 'Purchase Orders', icon: FileText, color: 'text-pink-600', bgColor: 'bg-pink-50', permissionResource: 'purchase_orders' },
      { href: '/stock-transfers', label: 'Stock Transfers', icon: ArrowUpDown, color: 'text-teal-600', bgColor: 'bg-teal-50', permissionResource: 'stock_transfers' },
    ]
  },
  {
    title: 'Sales',
    items: [
      { href: '/billing', label: 'Billing / POS', icon: Calculator, color: 'text-emerald-600', bgColor: 'bg-emerald-50', permissionResource: 'billing' },
      { href: '/invoices', label: 'Invoices', icon: Receipt, color: 'text-violet-600', bgColor: 'bg-violet-50', permissionResource: 'invoices' },
    ]
  },
  {
    title: 'Management',
    items: [
      { href: '/alerts', label: 'Alerts', icon: Bell, color: 'text-red-600', bgColor: 'bg-red-50', permissionResource: 'alerts' },
      { href: '/team', label: 'Team', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50', permissionResource: 'users' },
      { href: '/profile', label: 'Profile', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-50', permissionResource: 'profile' },
      { href: '/settings', label: 'Settings', icon: Settings, color: 'text-slate-600', bgColor: 'bg-slate-50', permissionResource: 'settings' },
    ]
  }
]

export default function MorePage() {
  const pathname = usePathname()
  const { hasPermission, isOwner, isReady } = usePermissions()
  
  const locale = useMemo(() => {
    const pathParts = pathname.split('/')
    return pathParts[1] === 'en' || pathParts[1] === 'hi' ? pathParts[1] : 'en'
  }, [pathname])

  // Filter menu groups based on permissions
  const filteredGroups = useMemo(() => {
    // While loading or not ready, show all items to prevent empty page
    if (!isReady) return menuGroups
    
    // OWNER can see all items
    if (isOwner) return menuGroups
    
    // Filter items based on read permission for each resource
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        return hasPermission(item.permissionResource, 'read')
      })
    })).filter(group => group.items.length > 0) // Remove empty groups
  }, [hasPermission, isOwner, isReady])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
  }

  return (
    <SidebarLayout>
      <div className="sm:max-w-7xl mx-auto pb-24 sm:pb-0">
        {/* Mobile App Header - Improved with safe area support */}
        <div 
          className="sm:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-4 py-3.5 min-h-[56px]">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">More</h1>
            <div className="w-8" />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block mb-8">
          <h1 className="text-3xl font-bold text-gray-900">More</h1>
          <p className="text-gray-500 mt-1">Access all features</p>
        </div>

        {/* Mobile Content - Optimized for Touch */}
        <div 
          className="sm:hidden mt-[calc(56px+env(safe-area-inset-top))] space-y-4 px-4"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {filteredGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                {group.title}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {group.items.map((item, index) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={`/${locale}${item.href}`}
                      className={`
                        flex items-center gap-4 px-4 py-4 min-h-[60px]
                        active:scale-[0.98] active:bg-gray-50
                        transition-all duration-150 ease-out
                        ${index !== group.items.length - 1 ? 'border-b border-gray-50' : ''}
                        ${active ? 'bg-indigo-50/50' : ''}
                      `}
                    >
                      <div 
                        className={`
                          w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                          ${active ? 'bg-indigo-100' : item.bgColor}
                          transition-colors duration-200
                        `}
                      >
                        <Icon 
                          className={`
                            w-5 h-5 
                            ${active ? 'text-indigo-600' : item.color}
                          `} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p 
                          className={`
                            font-semibold text-base
                            ${active ? 'text-indigo-600' : 'text-gray-900'}
                          `}
                        >
                          {item.label}
                        </p>
                      </div>
                      <ChevronRight 
                        className={`
                          w-5 h-5 flex-shrink-0
                          ${active ? 'text-indigo-400' : 'text-gray-300'}
                        `} 
                      />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Logout Button - Enhanced Touch Target */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="
                w-full flex items-center gap-4 px-4 py-4 min-h-[60px]
                bg-white rounded-2xl border border-gray-100
                active:scale-[0.98] active:bg-red-50
                transition-all duration-150 ease-out
                shadow-sm
              "
            >
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base text-red-600">Logout</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </button>
          </div>

          {/* App Version - Improved Typography */}
          <div className="text-center pt-6 pb-4">
            <p className="text-xs font-medium text-gray-400 tracking-wide">DKS StockAlert v1.0.0</p>
          </div>
        </div>

        {/* Desktop Content - Grid Layout */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredGroups.flatMap(group => group.items).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={`
                  flex flex-col items-center gap-3 p-6 
                  bg-white rounded-2xl border transition-all 
                  hover:shadow-lg hover:border-indigo-200 
                  hover:scale-[1.02] active:scale-[0.98]
                  ${active ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'}
                `}
              >
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  ${active ? 'bg-indigo-100' : item.bgColor}
                  transition-colors duration-200
                `}>
                  <Icon className={`w-7 h-7 ${active ? 'text-indigo-600' : item.color}`} />
                </div>
                <span className={`
                  font-medium text-center
                  ${active ? 'text-indigo-600' : 'text-gray-900'}
                `}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </SidebarLayout>
  )
}
