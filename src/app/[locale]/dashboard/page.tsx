'use client'

import { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Package, TrendingDown, AlertTriangle, Bell, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, Zap, Smartphone, Barcode, Clock, Shield, AlertCircle, Scan, X, Search, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { SubscriptionGate } from '@/components/SubscriptionGate'
import SidebarLayout from '@/components/SidebarLayout'
import dynamic from 'next/dynamic'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

interface DashboardStats {
    totalProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    unreadAlerts: number
    lowStockItems: Array<{ id: string; name: string; current_quantity: number; reorder_point: number }>
    subscription?: {
        status: string
        plan?: {
            name: string
            display_name: string
            max_team_members: number
            max_products: number
            max_locations: number
        }
        trial_end_date?: string
    }
    usage?: {
        teamMembers: number
        products: number
        locations: number
    }
    electronics?: {
        totalSerialNumbers: number
        serialByStatus: Record<string, number>
        warrantyExpiring30Days: number
        warrantyExpiring90Days: number
        warrantyExpired: number
        topWarrantyExpiring: Array<{
            id: string
            serialNumber: string
            warrantyExpiry: string
            status: string
            productName: string
        }>
        imeiRequiredCount: number
        serialRequiredCount: number
        warrantyAlertSettings?: {
            alertBefore30Days: boolean
            alertBefore60Days: boolean
            alertBefore90Days: boolean
            emailNotifications: boolean
            whatsappNotifications: boolean
        }
        highValueItems?: number
    }
}

interface StatCardProps {
    title: string
    value: number | string
    icon: React.ComponentType<{ className?: string }>
    color: string
    trend?: number
}

const StatCard = memo(({ title, value, icon: Icon, color, trend }: StatCardProps) => (
    <div className="card-elevated p-3.5 sm:p-5 tap-bounce">
        <div className="flex items-center justify-between mb-2.5">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-[1.1rem] h-[1.1rem] sm:w-5 sm:h-5 text-white" />
            </div>
            {trend !== undefined && trend > 0 && (
                <span className="text-[0.6875rem] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                    <ArrowUpRight className="w-3 h-3" />
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-[1.375rem] sm:text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-[0.75rem] text-gray-700 mt-0.5 font-semibold">{title}</p>
    </div>
))

StatCard.displayName = 'StatCard'

interface LowStockItemProps {
    item: {
        id: string
        name: string
        current_quantity: number
        reorder_point: number
    }
    onClick: () => void
}

const LowStockItem = memo(({ item, onClick }: LowStockItemProps) => {
    const percentage = item.reorder_point > 0
        ? Math.min(100, (item.current_quantity / item.reorder_point) * 100)
        : item.current_quantity > 0 ? 100 : 0

    return (
        <div
            className="native-list-item"
            onClick={onClick}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.current_quantity === 0 ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                <Package className={`w-[1.1rem] h-[1.1rem] ${item.current_quantity === 0 ? 'text-red-500' : 'text-amber-500'
                    }`} />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-[0.8125rem] truncate leading-tight">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${item.current_quantity === 0 ? 'bg-red-500' : 'bg-amber-500'}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <span className="text-[0.6875rem] text-gray-500 font-medium flex-shrink-0">
                        {item.current_quantity}/{item.reorder_point}
                    </span>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>
    )
})

LowStockItem.displayName = 'LowStockItem'

export default function DashboardPage() {
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [scannerOpen, setScannerOpen] = useState(false)
    const [imeiSearch, setImeiSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        fetchDashboard()
    }, [])

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/dashboard/stats', {
                credentials: 'include',
                next: { revalidate: 30 }
            })
            if (res.status === 401) {
                router.push('/auth')
                return
            }
            const data = await res.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImeiSearch = async () => {
        if (!imeiSearch.trim()) return
        setSearching(true)
        try {
            const res = await fetch(`/api/serial-numbers?search=${encodeURIComponent(imeiSearch)}&limit=10`, {
                credentials: 'include'
            })
            const data = await res.json()
            setSearchResults(data.serialNumbers || [])
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setSearching(false)
        }
    }

    const handleBarcodeDetected = (code: string) => {
        setImeiSearch(code)
        setScannerOpen(false)
        handleImeiSearch()
    }

    if (loading) {
        return (
            <SidebarLayout>
                <div className="max-w-7xl mx-auto">
                    {/* Skeleton loading */}
                    <div className="mb-5">
                        <div className="skeleton h-7 w-32 mb-2" />
                        <div className="skeleton h-4 w-48" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card-elevated p-4">
                                <div className="skeleton w-9 h-9 rounded-xl mb-3" />
                                <div className="skeleton h-6 w-16 mb-2" />
                                <div className="skeleton h-3 w-24" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="card-elevated p-4">
                            <div className="skeleton h-5 w-32 mb-4" />
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 mb-3">
                                    <div className="skeleton w-9 h-9 rounded-xl" />
                                    <div className="flex-1">
                                        <div className="skeleton h-3.5 w-24 mb-1.5" />
                                        <div className="skeleton h-1.5 w-full rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="skeleton h-64 rounded-2xl" />
                    </div>
                </div>
            </SidebarLayout>
        )
    }

    return (
        <SidebarLayout>
            <SubscriptionGate>
                <div className="max-w-7xl mx-auto">
                    {/* Trial Banner */}
                    {stats?.subscription?.status === 'trial' && stats.subscription.trial_end_date && (
                        <div className="card-elevated bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white px-4 py-3 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-[0.8125rem] font-semibold">
                                    {Math.ceil((new Date(stats.subscription.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                                </span>
                            </div>
                            <Link href="/subscription" className="text-[0.8125rem] font-semibold flex items-center gap-0.5 cursor-pointer">
                                Upgrade <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    {/* Page Title */}
                    <div className="mb-5 sm:mb-7">
                        <h1 className="text-[1.5rem] sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                        <p className="text-gray-500 mt-0.5 text-[0.8125rem] sm:text-base">Overview of your inventory</p>
                    </div>

                    {/* Electronics Stats - Always show for testing */}
                    <div className="mb-5 sm:mb-7">
                        <div className="flex items-center gap-2 mb-3">
                            <Smartphone className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-lg font-bold text-gray-900">Electronics Overview</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                            <StatCard
                                title="Serial Numbers"
                                value={stats?.electronics?.totalSerialNumbers ?? 0}
                                icon={Barcode}
                                color="bg-gradient-to-br from-indigo-500 to-purple-600"
                            />
                            <StatCard
                                title="Warranty Expired"
                                value={stats?.electronics?.warrantyExpired ?? 0}
                                icon={AlertCircle}
                                color="bg-gradient-to-br from-red-500 to-red-600"
                            />
                            <StatCard
                                title="Expiring (30d)"
                                value={stats?.electronics?.warrantyExpiring30Days ?? 0}
                                icon={Clock}
                                color="bg-gradient-to-br from-orange-500 to-red-500"
                            />
                            <StatCard
                                title="Expiring (90d)"
                                value={stats?.electronics?.warrantyExpiring90Days ?? 0}
                                icon={Shield}
                                color="bg-gradient-to-br from-amber-500 to-orange-500"
                            />
                            <StatCard
                                title="High Value (₹10k+)"
                                value={stats?.electronics?.highValueItems ?? 0}
                                icon={DollarSign}
                                color="bg-gradient-to-br from-emerald-500 to-green-600"
                            />
                            <StatCard
                                title="IMEI Required"
                                value={stats?.electronics?.imeiRequiredCount ?? 0}
                                icon={Smartphone}
                                color="bg-gradient-to-br from-cyan-500 to-blue-500"
                            />
                        </div>
                    </div>

                    {/* IMEI Scanner & Search */}
                    <div className="mb-5 sm:mb-7">
                        <div className="card-elevated-lg p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Scan className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg font-bold text-gray-900">Quick IMEI Search</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter IMEI or Serial Number..."
                                        value={imeiSearch}
                                        onChange={(e) => setImeiSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleImeiSearch()}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => setScannerOpen(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    <Scan className="w-4 h-4" />
                                    Scan
                                </button>
                                <button
                                    onClick={handleImeiSearch}
                                    disabled={!imeiSearch.trim() || searching}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    <Search className="w-4 h-4" />
                                    Search
                                </button>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h3 className="text-sm font-semibold text-gray-700">Search Results</h3>
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                                            onClick={() => router.push('/serial-numbers')}
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{result.serialNumber}</p>
                                                <p className="text-xs text-gray-500">{result.product?.name}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                result.status === 'IN_STOCK' ? 'bg-green-100 text-green-700' :
                                                result.status === 'SOLD' ? 'bg-blue-100 text-blue-700' :
                                                result.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {result.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {imeiSearch && searchResults.length === 0 && !searching && (
                                <div className="mt-4 text-center py-4 text-gray-500 text-sm">
                                    No serial numbers found for "{imeiSearch}"
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warranty Alert Settings */}
                    <div className="mb-5 sm:mb-7">
                        <div className="card-elevated-lg p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg font-bold text-gray-900">Warranty Alert Settings</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        defaultChecked={stats?.electronics?.warrantyAlertSettings?.alertBefore30Days ?? true}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Alert 30 days before</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        defaultChecked={stats?.electronics?.warrantyAlertSettings?.alertBefore60Days ?? true}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Alert 60 days before</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        defaultChecked={stats?.electronics?.warrantyAlertSettings?.alertBefore90Days ?? false}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Alert 90 days before</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        defaultChecked={stats?.electronics?.warrantyAlertSettings?.emailNotifications ?? true}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Email notifications</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        defaultChecked={stats?.electronics?.warrantyAlertSettings?.whatsappNotifications ?? false}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">WhatsApp notifications</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-7">
                        <StatCard
                            title="Total Products"
                            value={stats?.totalProducts || 0}
                            icon={Package}
                            color="bg-gradient-to-br from-blue-500 to-blue-600"
                        />
                        <StatCard
                            title="Low Stock"
                            value={stats?.lowStockProducts || 0}
                            icon={TrendingDown}
                            color="bg-gradient-to-br from-amber-500 to-orange-500"
                            trend={stats?.lowStockProducts || 0}
                        />
                        <StatCard
                            title="Out of Stock"
                            value={stats?.outOfStockProducts || 0}
                            icon={AlertTriangle}
                            color="bg-gradient-to-br from-red-500 to-red-600"
                        />
                        <StatCard
                            title="Unread Alerts"
                            value={stats?.unreadAlerts || 0}
                            icon={Bell}
                            color="bg-gradient-to-br from-indigo-500 to-purple-600"
                        />
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        {/* Warranty Expiring - Electronics Widget */}
                        <div className="card-elevated-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
                                <h2 className="text-[0.9375rem] sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    Warranty Expiring Soon
                                </h2>
                                <Link
                                    href="/serial-numbers"
                                    className="text-indigo-600 text-[0.75rem] sm:text-sm font-semibold flex items-center gap-0.5 cursor-pointer"
                                >
                                    View All
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            {stats?.electronics?.topWarrantyExpiring && stats.electronics.topWarrantyExpiring.length > 0 ? (
                                <div className="native-list-group mx-0 rounded-none border-x-0 border-b-0">
                                    {stats.electronics.topWarrantyExpiring.map((item) => {
                                        const daysUntilExpiry = item.warrantyExpiry 
                                            ? Math.ceil((new Date(item.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                            : 0
                                        const isCritical = daysUntilExpiry <= 30
                                        const isWarning = daysUntilExpiry <= 90
                                        
                                        return (
                                            <div
                                                key={item.id}
                                                className="native-list-item"
                                                onClick={() => router.push(`/serial-numbers`)}
                                            >
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-red-50' : isWarning ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                                    <Shield className={`w-[1.1rem] h-[1.1rem] ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-500'}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-900 text-[0.8125rem] truncate leading-tight">{item.productName}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[0.6875rem] text-gray-500">IMEI: {item.serialNumber}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold ${isCritical ? 'bg-red-100 text-red-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {daysUntilExpiry}d
                                                    </span>
                                                    <p className="text-[0.6875rem] text-gray-500 mt-1">
                                                        {item.warrantyExpiry ? new Date(item.warrantyExpiry).toLocaleDateString('en-IN') : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Shield className="w-7 h-7 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium text-[0.875rem]">No warranty expiring soon</p>
                                    <p className="text-[0.75rem] text-gray-400 mt-0.5">Add serial numbers with warranty dates</p>
                                </div>
                            )}
                        </div>

                        {/* Serial Numbers by Status - Electronics Widget */}
                        <div className="card-elevated-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
                                <h2 className="text-[0.9375rem] sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Barcode className="w-4 h-4 text-indigo-500" />
                                    Serial Numbers Status
                                </h2>
                                <Link
                                    href="/serial-numbers"
                                    className="text-indigo-600 text-[0.75rem] sm:text-sm font-semibold flex items-center gap-0.5 cursor-pointer"
                                >
                                    View All
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                                        <p className="text-2xl font-bold text-green-700">{stats?.electronics?.serialByStatus?.IN_STOCK ?? 0}</p>
                                        <p className="text-[0.6875rem] text-green-600 font-medium">In Stock</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-2xl font-bold text-blue-700">{stats?.electronics?.serialByStatus?.SOLD ?? 0}</p>
                                        <p className="text-[0.6875rem] text-blue-600 font-medium">Sold</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-2xl font-bold text-amber-700">{stats?.electronics?.serialByStatus?.RESERVED ?? 0}</p>
                                        <p className="text-[0.6875rem] text-amber-600 font-medium">Reserved</p>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-2xl font-bold text-red-700">{stats?.electronics?.serialByStatus?.DEFECTIVE ?? 0}</p>
                                        <p className="text-[0.6875rem] text-red-600 font-medium">Defective</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Items */}
                        <div className="card-elevated-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
                                <h2 className="text-[0.9375rem] sm:text-lg font-bold text-gray-900">Low Stock Items</h2>
                                <Link
                                    href="/products"
                                    className="text-indigo-600 text-[0.75rem] sm:text-sm font-semibold flex items-center gap-0.5 cursor-pointer"
                                >
                                    View All
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {stats?.lowStockItems?.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Package className="w-7 h-7 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium text-[0.875rem]">No low stock items</p>
                                    <p className="text-[0.75rem] text-gray-400 mt-0.5">All products are well stocked!</p>
                                </div>
                            ) : (
                                <div className="native-list-group mx-0 rounded-none border-x-0 border-b-0">
                                    {stats?.lowStockItems?.map((item) => (
                                        <LowStockItem
                                            key={item.id}
                                            item={item}
                                            onClick={() => router.push(`/products/${item.id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="card-elevated-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #4338ca 100%)' }}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                            <div className="p-4 sm:p-5 relative">
                                <h2 className="text-[0.9375rem] sm:text-lg font-bold mb-4 text-white drop-shadow-sm">Quick Actions</h2>
                                <div className="space-y-2.5">
                                    <Link
                                        href="/products/new"
                                        className="block bg-white/20 backdrop-blur-sm rounded-xl p-3.5 hover:bg-white/30 transition-all border border-white/20 cursor-pointer tap-bounce"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-white/30 rounded-lg flex items-center justify-center shadow-sm">
                                                <Plus className="w-[1.1rem] h-[1.1rem] text-white" />
                                            </div>
                                            <span className="font-semibold text-[0.875rem] text-white">Add New Product</span>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/products"
                                        className="block bg-white/20 backdrop-blur-sm rounded-xl p-3.5 hover:bg-white/30 transition-all border border-white/20 cursor-pointer tap-bounce"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-white/30 rounded-lg flex items-center justify-center shadow-sm">
                                                <Package className="w-[1.1rem] h-[1.1rem] text-white" />
                                            </div>
                                            <span className="font-semibold text-[0.875rem] text-white">View All Products</span>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/alerts"
                                        className="block bg-white/20 backdrop-blur-sm rounded-xl p-3.5 hover:bg-white/30 transition-all border border-white/20 cursor-pointer tap-bounce"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-white/30 rounded-lg flex items-center justify-center shadow-sm">
                                                <Bell className="w-[1.1rem] h-[1.1rem] text-white" />
                                            </div>
                                            <span className="font-semibold text-[0.875rem] text-white">Check Alerts</span>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/serial-numbers"
                                        className="block bg-white/20 backdrop-blur-sm rounded-xl p-3.5 hover:bg-white/30 transition-all border border-white/20 cursor-pointer tap-bounce"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-white/30 rounded-lg flex items-center justify-center shadow-sm">
                                                <Barcode className="w-[1.1rem] h-[1.1rem] text-white" />
                                            </div>
                                            <span className="font-semibold text-[0.875rem] text-white">Serial Numbers</span>
                                        </div>
                                    </Link>
                                </div>

                                <div className="mt-4 p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                                    <p className="text-[0.75rem] text-white">
                                        <span className="font-semibold text-white">💡 Tip:</span> Set reorder points to get alerts when stock runs low.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barcode Scanner Modal */}
                {scannerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold text-gray-900">Scan IMEI/Barcode</h3>
                                <button
                                    onClick={() => setScannerOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4">
                                <BarcodeScanner
                                    onDetected={handleBarcodeDetected}
                                    onClose={() => setScannerOpen(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </SubscriptionGate>
        </SidebarLayout>
    )
}
