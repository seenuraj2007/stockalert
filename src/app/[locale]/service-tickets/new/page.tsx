'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Wrench, ArrowLeft, Save, Loader2, Package, Tag, User, Phone, Mail,
    Calendar, DollarSign, AlertTriangle, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

interface Product {
    id: string
    name: string
    sku: string
}

interface SerialNumber {
    id: string
    serialNumber: string
    status: string
}

const SERVICE_TYPES = [
    { value: 'REPAIR', label: 'Repair', description: 'General repair service' },
    { value: 'REPLACEMENT', label: 'Replacement', description: 'Device replacement' },
    { value: 'UPGRADE', label: 'Upgrade', description: 'Software/hardware upgrade' },
    { value: 'INSPECTION', label: 'Inspection', description: 'Quality check' },
    { value: 'UNLOCK', label: 'Unlock', description: 'Network unlock' },
    { value: 'DATA_RECOVERY', label: 'Data Recovery', description: 'Data backup/recovery' },
    { value: 'OTHER', label: 'Other', description: 'Other services' },
]

const PRIORITIES = [
    { value: 'LOW', label: 'Low', color: 'text-gray-500' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-500' },
    { value: 'HIGH', label: 'High', color: 'text-orange-500' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-500' },
]

export default function NewServiceTicketPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetchingProducts, setFetchingProducts] = useState(true)
    const [products, setProducts] = useState<Product[]>([])
    const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        productId: '',
        serialNumberId: '',
        serviceType: 'REPAIR',
        issueDescription: '',
        estimatedCost: '',
        priority: 'MEDIUM',
        isWarrantyClaim: false,
        estimatedDate: '',
    })

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setFetchingProducts(true)
            const res = await fetch('/api/products?limit=1000')
            if (res.ok) {
                const data = await res.json()
                setProducts(data.products || [])
            }
        } catch (err) {
            console.error('Error fetching products:', err)
        } finally {
            setFetchingProducts(false)
        }
    }

    const handleProductChange = async (productId: string) => {
        setFormData({ ...formData, productId, serialNumberId: '' })

        if (productId) {
            try {
                const res = await fetch(`/api/serial-numbers?productId=${productId}&status=IN_STOCK`)
                if (res.ok) {
                    const data = await res.json()
                    setSerialNumbers(data.serialNumbers || [])
                }
            } catch (err) {
                console.error('Error fetching serial numbers:', err)
            }
        } else {
            setSerialNumbers([])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/service-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create ticket')
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/service-tickets')
            }, 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <SidebarLayout>
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/service-tickets"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Tickets
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">New Service Ticket</h1>
                    <p className="text-gray-500 mt-1">Create a new repair or warranty service ticket</p>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-700 font-medium">Ticket created successfully! Redirecting...</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="+91 98765 43210"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="customer@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Device Info */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
                            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                                <Package className="w-5 h-5 text-cyan-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Device Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Product
                                </label>
                                <select
                                    value={formData.productId}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    disabled={fetchingProducts}
                                >
                                    <option value="">Select a product</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} ({product.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Serial Number
                                </label>
                                <select
                                    value={formData.serialNumberId}
                                    onChange={(e) => setFormData({ ...formData, serialNumberId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    disabled={!formData.productId || serialNumbers.length === 0}
                                >
                                    <option value="">Select serial number</option>
                                    {serialNumbers.map((sn) => (
                                        <option key={sn.id} value={sn.id}>
                                            {sn.serialNumber}
                                        </option>
                                    ))}
                                </select>
                                {!formData.productId && (
                                    <p className="text-xs text-gray-500 mt-1">Select a product first</p>
                                )}
                                {formData.productId && serialNumbers.length === 0 && !fetchingProducts && (
                                    <p className="text-xs text-orange-500 mt-1">No available serial numbers</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-amber-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Service Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Service Type *
                                </label>
                                <select
                                    required
                                    value={formData.serviceType}
                                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    {SERVICE_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label} - {type.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    {PRIORITIES.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Issue Description *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.issueDescription}
                                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    placeholder="Describe the issue in detail..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estimated Cost (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.estimatedCost}
                                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estimated Completion Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.estimatedDate}
                                    onChange={(e) => setFormData({ ...formData, estimatedDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isWarrantyClaim}
                                        onChange={(e) => setFormData({ ...formData, isWarrantyClaim: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">This is a warranty claim</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-8">
                                    Warranty status will be checked automatically if a serial number is provided
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href="/service-tickets"
                            className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Create Ticket
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </SidebarLayout>
    )
}
