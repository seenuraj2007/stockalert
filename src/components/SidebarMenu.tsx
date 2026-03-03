'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'
import {
  Package, MapPin, Truck, FileText, ArrowUpDown, Calculator,
  Bell, Users, Settings, User,
  BarChart3, TrendingUp, Receipt
} from 'lucide-react'
import { usePermissions } from '@/lib/UserContext'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permissionResource: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, permissionResource: 'reports' },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp, permissionResource: 'analytics' },
  { href: '/products', label: 'Products', icon: Package, permissionResource: 'products' },
  { href: '/locations', label: 'Locations', icon: MapPin, permissionResource: 'locations' },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, permissionResource: 'suppliers' },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: FileText, permissionResource: 'purchase_orders' },
  { href: '/stock-transfers', label: 'Stock Transfers', icon: ArrowUpDown, permissionResource: 'stock_transfers' },
  { href: '/billing', label: 'Billing / POS', icon: Calculator, permissionResource: 'billing' },
  { href: '/invoices', label: 'Invoices', icon: Receipt, permissionResource: 'invoices' },
  { href: '/alerts', label: 'Alerts', icon: Bell, permissionResource: 'alerts' },
  { href: '/team', label: 'Team', icon: Users, permissionResource: 'users' },
  { href: '/profile', label: 'Profile', icon: User, permissionResource: 'profile' },
  { href: '/settings', label: 'Settings', icon: Settings, permissionResource: 'settings' },
]

const NavItemComponent = memo(({ item, isActive, locale }: {
  item: NavItem
  isActive: boolean
  locale: string
}) => {
  const Icon = item.icon

  return (
    <Link
      href={`/${locale}${item.href}`}
      prefetch={!isActive}
      className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all cursor-pointer hover:shadow-md ${isActive
        ? 'text-gray-900 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100'
        : 'text-gray-700 hover:bg-gray-50'
        }`}
    >
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${isActive
        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg'
        : 'bg-gray-100'
        }`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
      </div>
      <span className="text-sm sm:text-base">{item.label}</span>
    </Link>
  )
})

NavItemComponent.displayName = 'NavItemComponent'

const SidebarMenu = memo(function SidebarMenu() {
  const pathname = usePathname()
  const { hasPermission, isOwner, isReady } = usePermissions()

  const locale = useMemo(() => {
    const pathParts = pathname.split('/')
    return pathParts[1] === 'en' || pathParts[1] === 'hi' ? pathParts[1] : 'en'
  }, [pathname])

  // Filter nav items based on permissions
  const filteredNavItems = useMemo(() => {
    // While loading or not ready, show all items to prevent empty sidebar
    if (!isReady) return navItems
    
    // OWNER can see all items
    if (isOwner) return navItems
    
    // Filter items based on read permission for each resource
    return navItems.filter(item => {
      return hasPermission(item.permissionResource, 'read')
    })
  }, [hasPermission, isOwner, isReady])

  const activeItems = useMemo(() => {
    return filteredNavItems.map(item => {
      const localizedHref = `/${locale}${item.href}`
      const isActive = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
      return { ...item, isActive, locale }
    })
  }, [filteredNavItems, pathname, locale])

  return (
    <nav className="px-3 sm:px-4 space-y-1 sm:space-y-2">
      {activeItems.map((item) => (
        <NavItemComponent
          key={item.href}
          item={item}
          isActive={item.isActive}
          locale={item.locale}
        />
      ))}
    </nav>
  )
})

export { navItems }
export default SidebarMenu
