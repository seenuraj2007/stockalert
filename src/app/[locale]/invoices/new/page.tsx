'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Save, FileText, Plus, Trash2,
    Download, Printer, Receipt, Package,
    IndianRupee, Building2, User, MapPin
} from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

interface Product {
    id: string
    name: string
    sku: string
    selling_price: number
    gstRate?: number
    hsnCode?: string
}

interface InvoiceItem {
    productId: string
    description: string
    hsnCode: string
    quantity: number
    unitPrice: number
    discount: number
    cgstRate: number
    sgstRate: number
    igstRate: number
    taxableAmount: number
    cgstAmount: number
    sgstAmount: number
    igstAmount: number
    totalAmount: number
}

export default function InvoiceFormPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [products, setProducts] = useState<Product[]>([])

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        customerCity: '',
        customerState: '',
        customerPincode: '',
        customerGstNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        terms: 'Payment due within 30 days from invoice date.',
        items: [] as InvoiceItem[]
    })

    // GST rates
    const gstRates = [0, 3, 5, 12, 18, 28]

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                setProducts(data.products || [])
            }
        } catch (err) {
            console.error('Error fetching products:', err)
        }
    }

    const addItem = () => {
        const newItem: InvoiceItem = {
            productId: '',
            description: '',
            hsnCode: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            cgstRate: 0,
            sgstRate: 0,
            igstRate: 0,
            taxableAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalAmount: 0
        }
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }))
    }

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const items = [...formData.items]
        const item = { ...items[index] } as InvoiceItem

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ; (item as any)[field] = value

        // If product selected, auto-fill details
        if (field === 'productId' && value) {
            const product = products.find(p => p.id === value)
            if (product) {
                item.description = product.name
                item.unitPrice = product.selling_price
                item.hsnCode = product.hsnCode || ''
                // Auto-calculate GST
                if (product.gstRate) {
                    const gstHalf = product.gstRate / 2
                    item.cgstRate = gstHalf
                    item.sgstRate = gstHalf
                }
            }
        }

        // Recalculate amounts
        const taxableAmount = item.quantity * item.unitPrice - (item.discount || 0)
        item.taxableAmount = taxableAmount
        item.cgstAmount = taxableAmount * item.cgstRate / 100
        item.sgstAmount = taxableAmount * item.sgstRate / 100
        item.igstAmount = taxableAmount * item.igstRate / 100
        item.totalAmount = taxableAmount + item.cgstAmount + item.sgstAmount + item.igstAmount

        items[index] = item
        setFormData(prev => ({ ...prev, items }))
    }

    // Calculate totals
    const subtotal = formData.items.reduce((sum, item) => sum + item.taxableAmount, 0)
    const totalCgst = formData.items.reduce((sum, item) => sum + item.cgstAmount, 0)
    const totalSgst = formData.items.reduce((sum, item) => sum + item.sgstAmount, 0)
    const totalIgst = formData.items.reduce((sum, item) => sum + item.igstAmount, 0)
    const totalGst = totalCgst + totalSgst + totalIgst
    const totalAmount = subtotal + totalGst

    const handleSubmit = async (e: React.FormEvent, status: string = 'DRAFT') => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const items = formData.items.map(item => ({
                productId: item.productId || null,
                description: item.description,
                hsnCode: item.hsnCode || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                cgstRate: item.cgstRate,
                sgstRate: item.sgstRate,
                igstRate: item.igstRate
            }))

            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status,
                    items
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create invoice')
            }

            const data = await res.json()
            setSuccess('Invoice created successfully!')

            setTimeout(() => {
                router.push(`/invoices/${data.invoice.id}`)
            }, 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <SidebarLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/invoices"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
                            <p className="text-gray-500 mt-1">Generate GST-compliant invoices</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => handleSubmit(e, 'DRAFT')}
                            disabled={saving || formData.items.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            Save as Draft
                        </button>
                        <button
                            onClick={(e) => handleSubmit(e, 'ISSUED')}
                            disabled={saving || formData.items.length === 0 || !formData.customerName}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 cursor-pointer"
                        >
                            <Receipt className="w-4 h-4" />
                            Create & Issue
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                        {success}
                    </div>
                )}

                <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
                    {/* Customer Details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-500" />
                            Customer Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Customer or Company Name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GST Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.customerGstNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerGstNumber: e.target.value.toUpperCase() }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="22AAAAA0000A1Z5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="customer@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    value={formData.customerAddress}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                    placeholder="Full address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={formData.customerCity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerCity: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Mumbai"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    State
                                </label>
                                <input
                                    type="text"
                                    value={formData.customerState}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerState: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Maharashtra"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Invoice Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Invoice Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.invoiceDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-indigo-500" />
                                Line Items
                            </h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        {formData.items.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No items added yet. Click "Add Item" to start.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">HSN Code</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Discount</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">GST %</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {formData.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.productId}
                                                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        <option value="">Select Product</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} - ₹{p.selling_price}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        placeholder="Description"
                                                        className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.hsnCode}
                                                        onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                        placeholder="HSN Code"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-16 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.discount}
                                                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.cgstRate}
                                                        onChange={(e) => {
                                                            const rate = parseFloat(e.target.value)
                                                            updateItem(index, 'cgstRate', rate)
                                                            updateItem(index, 'sgstRate', rate)
                                                            updateItem(index, 'igstRate', 0)
                                                        }}
                                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                                    >
                                                        {gstRates.map(r => (
                                                            <option key={r} value={r}>{r}%</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    ₹{item.totalAmount.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex justify-end">
                            <div className="w-80 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>CGST</span>
                                    <span>₹{totalCgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>SGST</span>
                                    <span>₹{totalSgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>IGST</span>
                                    <span>₹{totalIgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-2">
                                    <span>Total GST</span>
                                    <span>₹{totalGst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-3">
                                    <span>Total Amount</span>
                                    <span>₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes & Terms */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Terms & Conditions
                                </label>
                                <textarea
                                    value={formData.terms}
                                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Payment terms..."
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </SidebarLayout>
    )
}
