'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Truck, Mail, Phone, MapPin, Edit, Trash2, Package, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  total_products: number
  created_at: string
  updated_at: string
}

interface SupplierProduct {
  id: string
  name: string
  sku: string | null
  current_quantity: number
  unit_cost: number | null
  selling_price: number | null
}

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSupplier()
    fetchProducts()
  }, [resolvedParams.id])

  const fetchSupplier = async () => {
    try {
      const res = await fetch(`/api/suppliers/${resolvedParams.id}`)
      if (!res.ok) throw new Error('Failed to fetch supplier')
      const data = await res.json()
      setSupplier(data.supplier)
    } catch (err) {
      setError('Failed to load supplier')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/suppliers/${resolvedParams.id}/products`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/suppliers/${resolvedParams.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/suppliers')
      }
    } catch (err) {
      setError('Failed to delete supplier')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Supplier not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/suppliers" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">StockAlert</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href={`/suppliers/${supplier.id}/edit`}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit supplier"
              >
                <Edit className="w-5 h-5" />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete supplier"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/suppliers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Suppliers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
          {supplier.contact_person && (
            <p className="text-gray-500 mt-1">Contact: {supplier.contact_person}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Supplier Information
              </h2>
              <div className="space-y-4">
                {supplier.contact_person && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0">
                      <Truck className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium text-gray-900">{supplier.contact_person}</p>
                    </div>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <a
                        href={`mailto:${supplier.email}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {supplier.email}
                      </a>
                    </div>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Phone</p>
                      <a
                        href={`tel:${supplier.phone}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {supplier.phone}
                      </a>
                    </div>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{supplier.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Products
                </h2>
                <Link
                  href={`/products/new?supplier_id=${supplier.id}`}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2 text-sm"
                >
                  <Package className="w-4 h-4" />
                  Add Product
                </Link>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">No products yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add products to this supplier</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100">
                                <Package className="w-5 h-5 text-indigo-600" />
                              </div>
                              <span className="font-medium text-gray-900">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {product.sku || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {product.current_quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900 text-sm">
                            ${product.unit_cost?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <p className="text-sm text-indigo-600 mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-indigo-900">{supplier.total_products}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">{new Date(supplier.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">{new Date(supplier.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {supplier.notes && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Notes</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            )}

            <Link
              href={`/suppliers/${supplier.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">View Supplier</span>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
