'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    BarChart3, TrendingUp, Package, Tag, MapPin, Truck,
    FileText, ArrowUpDown, Bell, Users, Settings, User,
    Calculator, Receipt, X, LogOut
} from 'lucide-react'

interface MobileMoreMenuProps {
    isOpen: boolean
    onClose: () => void
    locale: string
    onLogout: () => void
}

const moreMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, color: 'from-indigo-500 to-purple-600' },
    { href: '/analytics', label: 'Analytics', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
    { href: '/products', label: 'Products', icon: Package, color: 'from-blue-500 to-cyan-600' },
    { href: '/serial-numbers', label: 'Serial Numbers', icon: Tag, color: 'from-orange-500 to-amber-600' },
    { href: '/locations', label: 'Locations', icon: MapPin, color: 'from-pink-500 to-rose-600' },
    { href: '/suppliers', label: 'Suppliers', icon: Truck, color: 'from-teal-500 to-cyan-600' },
    { href: '/purchase-orders', label: 'Purchase Orders', icon: FileText, color: 'from-violet-500 to-purple-600' },
    { href: '/stock-transfers', label: 'Stock Transfers', icon: ArrowUpDown, color: 'from-red-500 to-orange-600' },
    { href: '/billing', label: 'POS', icon: Calculator, color: 'from-emerald-500 to-teal-600' },
    { href: '/invoices', label: 'Invoices', icon: Receipt, color: 'from-sky-500 to-blue-600' },
    { href: '/alerts', label: 'Alerts', icon: Bell, color: 'from-amber-500 to-yellow-600' },
    { href: '/team', label: 'Team', icon: Users, color: 'from-fuchsia-500 to-pink-600' },
    { href: '/profile', label: 'Profile', icon: User, color: 'from-slate-500 to-gray-600' },
    { href: '/settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-zinc-600' },
]

const MobileMoreMenu = memo(function MobileMoreMenu({ isOpen, onClose, locale, onLogout }: MobileMoreMenuProps) {
    const pathname = usePathname()

    const handleItemClick = useCallback(() => {
        onClose()
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in sm:hidden"
                onClick={onClose}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-hidden sm:hidden animate-slide-up">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(85vh-60px)] p-4 pb-8">
                    <div className="grid grid-cols-4 gap-3">
                        {moreMenuItems.map((item) => {
                            const Icon = item.icon
                            const localizedHref = `/${locale}${item.href}`
                            const isActive = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)

                            return (
                                <Link
                                    key={item.href}
                                    href={localizedHref}
                                    onClick={handleItemClick}
                                    className="flex flex-col items-center gap-1.5 p-2"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isActive
                                        ? `bg-gradient-to-br ${item.color} ring-2 ring-offset-2 ring-indigo-400`
                                        : `bg-gradient-to-br ${item.color}`
                                        }`}>
                                        <Icon className="w-5 h-5 text-white" strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className={`text-xs text-center leading-tight ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => {
                                onClose()
                                onLogout()
                            }}
                            className="flex items-center justify-center gap-2 w-full py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
})

MobileMoreMenu.displayName = 'MobileMoreMenu'

export default MobileMoreMenu
