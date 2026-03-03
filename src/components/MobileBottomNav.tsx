'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'
import {
    LayoutDashboard, Package, Calculator, FileText, Grid3X3
} from 'lucide-react'
import { usePermissions } from '@/lib/UserContext'

interface MobileBottomNavProps {
    onMenuClick: () => void
    locale: string
}

interface NavItem {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
    permissionResource: string
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard, permissionResource: 'reports' },
    { href: '/products', label: 'Products', icon: Package, permissionResource: 'products' },
    { href: '/billing', label: 'POS', icon: Calculator, permissionResource: 'billing' },
    { href: '/invoices', label: 'Invoices', icon: FileText, permissionResource: 'invoices' },
]

const MobileBottomNav = memo(function MobileBottomNav({ onMenuClick, locale }: MobileBottomNavProps) {
    const pathname = usePathname()
    const { hasPermission, isOwner, isReady } = usePermissions()

    // Filter nav items based on permissions
    const filteredNavItems = useMemo(() => {
        // While loading or not ready, show all items to prevent empty nav
        if (!isReady) return navItems
        
        // OWNER can see all items
        if (isOwner) return navItems
        
        // Filter items based on read permission for each resource
        return navItems.filter(item => {
            return hasPermission(item.permissionResource, 'read')
        })
    }, [hasPermission, isOwner, isReady])

    const activeTab = useMemo(() => {
        for (const item of filteredNavItems) {
            const localized = `/${locale}${item.href}`
            if (pathname === localized || pathname.startsWith(`${localized}/`)) {
                return item.href
            }
        }
        // Check if on More page
        if (pathname === `/${locale}/more`) {
            return '/more'
        }
        return null
    }, [pathname, locale, filteredNavItems])

    const isMoreActive = pathname === `/${locale}/more`

    return (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
            <div className="mobile-bottom-nav-inner">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.href
                    const href = `/${locale}${item.href}`

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            prefetch={true}
                            className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : 'mobile-nav-item-inactive'}`}
                        >
                            <div className={`mobile-nav-icon-wrap ${isActive ? 'mobile-nav-icon-active' : ''}`}>
                                <Icon className="mobile-nav-icon" strokeWidth={isActive ? 2.5 : 1.8} />
                            </div>
                            <span className="mobile-nav-label">{item.label}</span>
                        </Link>
                    )
                })}

                {/* More Page Link - Always show for mobile to access hidden pages */}
                <Link
                    href={`/${locale}/more`}
                    prefetch={true}
                    className={`mobile-nav-item ${isMoreActive ? 'mobile-nav-item-active' : 'mobile-nav-item-inactive'}`}
                    aria-label="More"
                >
                    <div className={`mobile-nav-icon-wrap ${isMoreActive ? 'mobile-nav-icon-active' : ''}`}>
                        <Grid3X3 className="mobile-nav-icon" strokeWidth={isMoreActive ? 2.5 : 1.8} />
                    </div>
                    <span className="mobile-nav-label">More</span>
                </Link>
            </div>
        </nav>
    )
})

export default MobileBottomNav
