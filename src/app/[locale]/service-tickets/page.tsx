
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search, Plus, Wrench, Loader2, Edit, Eye, Shield
} from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

interface ServiceTicket {
    id: string
    ticketNumber: string
    customerName: string
    customerPhone: string | null
    customerEmail: string | null
    serialNumberId: string | null
    deviceSerial: string | null
    serviceType: string
    issueDescription: string
    estimatedCost: number | null
    status: string
    priority: string
    isWarrantyClaim: boolean
    warrantyStatus: string | null
    receivedAt: string
    estimatedDate: string | null
    completedAt: string | null
    resolution: string | null
    finalCost: number | null
    assignedTo: string | null
    product: {
        id: string
        name: string
        sku: string
    } | null
}

interface PaginationMeta {
    total: number
    totalPages: number
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    WAITING_PARTS: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Waiting Parts' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    DELIVERED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Delivered' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
}

const SERVICE_TYPES: Record<string, string> = {
    REPAIR: 'Repair',
    REPLACEMENT: 'Replacement',
    UPGRADE: 'Upgrade',
    INSPECTION: 'Inspection',
    UNLOCK: 'Unlock',
    DATA_RECOVERY: 'Data Recovery',
    OTHER: 'Other',
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    LOW: { color: 'text-gray-500', label: 'Low' },
    MEDIUM: { color: 'text-blue-500', label: 'Medium' },
    HIGH: { color: 'text-orange-500', label: 'High' },
    URGENT: { color: 'text-red-500', label: 'Urgent' },
}

export default function ServiceTicketsPage() {
    const router = useRouter()

    const [tickets, setTickets] = useState<ServiceTicket[]>([])
    const [loading, setLoading] = useState(true)
    
    // Separate page state from pagination metadata to prevent dependency loops
    const [page, setPage] = useState(1)
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
        total: 0,
        totalPages: 0,
    })
    const limit = 20

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        waitingParts: 0,
        completed: 0,
        delivered: 0,
        cancelled: 0,
    })

    // Filters
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', limit.toString())
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)

            const res = await fetch(`/api/service-tickets?${params}`)

            if (res.status === 401) {
                router.push('/auth')
                return
            }

            if (!res.ok) throw new Error('Failed to fetch tickets')

            const data = await res.json()
            setTickets(data.tickets)
            setPaginationMeta(data.pagination)
            setStats(data.stats)
        } catch (error) {
            console.error('Error fetching tickets:', error)
        } finally {
            setLoading(false)
        }
    }, [page, search, statusFilter, router])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])
    
    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [search, statusFilter])

    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/service-tickets?id=${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                fetchTickets()
            }
        } catch (error) {
            console.error('Error updating ticket:', error)
        }
    }

    return (
        <SidebarLayout>
            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Service Tickets</h1>
                            <p className="text-gray-500 mt-1">Track repairs and warranty service</p>
                        </div>
                        <Link
                            href="/service-tickets/new"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            New Service Ticket
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                        <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                        <p className="text-sm text-yellow-600">Pending</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                        <p className="text-sm text-blue-600">In Progress</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <p className="text-2xl font-bold text-orange-700">{stats.waitingParts}</p>
                        <p className="text-sm text-orange-600">Waiting Parts</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                        <p className="text-sm text-green-600">Completed</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-2xl font-bold text-purple-700">{stats.delivered}</p>
                        <p className="text-sm text-purple-600">Delivered</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by ticket#, customer name, phone, or serial..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="WAITING_PARTS">Waiting Parts</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-12">
                            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No service tickets</h3>
                            <p className="text-gray-500 mb-6">Start tracking repairs and warranty service</p>
                            <Link
                                href="/service-tickets/new"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Ticket
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Device</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Received</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tickets.map((ticket) => {
                                        const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING
                                        const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM

                                        return (
                                            <tr key={ticket.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{ticket.ticketNumber}</p>
                                                        {ticket.isWarrantyClaim && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                                <Shield className="w-3 h-3" /> Warranty
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{ticket.customerName}</p>
                                                        {ticket.customerPhone && (
                                                            <p className="text-sm text-gray-500">{ticket.customerPhone}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        {ticket.product ? (
                                                            <p className="font-medium text-gray-900">{ticket.product.name}</p>
                                                        ) : (
                                                            <p className="text-gray-500">-</p>
                                                        )}
                                                        {ticket.deviceSerial && (
                                                            <p className="text-xs text-gray-500 font-mono">{ticket.deviceSerial}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-gray-900">
                                                        {SERVICE_TYPES[ticket.serviceType] || ticket.serviceType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <select
                                                        value={ticket.status}
                                                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer ${statusConfig.bg} ${statusConfig.text}`}
                                                    >
                                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                            <option key={key} value={key}>{config.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`font-medium ${priorityConfig.color}`}>
                                                        {priorityConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(ticket.receivedAt).toLocaleDateString('en-IN')}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/service-tickets/${ticket.id}`}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            href={`/service-tickets/${ticket.id}/edit`}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No service tickets</h3>
                            <p className="text-gray-500 mb-6">Start tracking repairs and warranty service</p>
                            <Link
                                href="/service-tickets/new"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Ticket
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                            {tickets.map((ticket) => {
                                const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.PENDING
                                const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM

                                return (
                                    <div key={ticket.id} className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{ticket.ticketNumber}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(ticket.receivedAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {ticket.isWarrantyClaim && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                        <Shield className="w-3 h-3" /> Warranty
                                                    </span>
                                                )}
                                                <select
                                                    value={ticket.status}
                                                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${statusConfig.bg} ${statusConfig.text}`}
                                                >
                                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                        <option key={key} value={key}>{config.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Customer</span>
                                                <span className="font-medium text-gray-900">{ticket.customerName}</span>
                                            </div>
                                            {ticket.customerPhone && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500">Phone</span>
                                                    <span className="text-sm text-gray-900">{ticket.customerPhone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Service</span>
                                                <span className="text-sm text-gray-900">{SERVICE_TYPES[ticket.serviceType] || ticket.serviceType}</span>
                                            </div>
                                            {ticket.product && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-500">Product</span>
                                                    <span className="text-sm text-gray-900 truncate max-w-[150px]">{ticket.product.name}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Priority</span>
                                                <span className={`text-sm font-medium ${priorityConfig.color}`}>
                                                    {priorityConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                            <Link
                                                href={`/service-tickets/${ticket.id}`}
                                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/service-tickets/${ticket.id}/edit`}
                                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {paginationMeta.totalPages > 1 && (
                    <div className="px-4 py-3 mt-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, paginationMeta.total)} of {paginationMeta.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => p - 1)}
                                disabled={page === 1}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page === paginationMeta.totalPages}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    )
}
