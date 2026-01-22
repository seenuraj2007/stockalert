'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3, TrendingUp, DollarSign, Package,
  AlertTriangle, ShoppingCart, ArrowUpRight, ArrowDownRight, RefreshCw,
  ArrowLeft, Crown, Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  AreaChart, Area, Legend
} from 'recharts'
import SidebarLayout from '@/components/SidebarLayout'
import { SubscriptionGate } from '@/components/SubscriptionGate'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e']

interface AnalyticsData {
  sales: { total: number; count: number; average: number; byStatus: Record<string, number> }
  products: { total: number; totalValue: number; categories: number; withImages: number }
  stock: { total: number; lowStock: number; outOfStock: number; value: number; potentialRevenue: number }
  alerts: { total: number; byType: Record<string, number>; unread: number }
  revenueByDay: Array<{ date: string; revenue: number }>
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>
  categoryBreakdown: Array<{ category: string; count: number; value: number; revenue: number }>
  supplierPerformance: Array<{ supplierId: string; orders: number; total: number; items: number }>
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-sm font-medium text-indigo-600">${(payload[0]?.value || 0).toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchAnalytics() }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Analytics error:', err)
    } finally { setLoading(false) }
  }

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(data?.sales.total || 0), change: '+12.5%', trend: 'up', icon: DollarSign, color: 'from-green-500 to-green-600' },
    { title: 'Total Orders', value: data?.sales.count || 0, change: '+8.2%', trend: 'up', icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
    { title: 'Avg Order Value', value: formatCurrency(data?.sales.average || 0), change: '-2.1%', trend: 'down', icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
    { title: 'Inventory Value', value: formatCurrency(data?.stock.value || 0), change: '+5.3%', trend: 'up', icon: Package, color: 'from-orange-500 to-orange-600' },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'stock', label: 'Stock', icon: AlertTriangle },
  ]

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-indigo-300" />
              </div>
            </div>
            <p className="text-gray-600 font-medium">Loading analytics...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <SubscriptionGate>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {error && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 cursor-pointer">
                  <span className="text-xl">&times;</span>
                </button>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value)} 
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                <button 
                  onClick={fetchAnalytics} 
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all cursor-pointer border border-gray-200"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'text-indigo-600 border-indigo-600'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pb-8">
              {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statCards.map((stat, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                      Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={data?.revenueByDay || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                      Category Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={data?.categoryBreakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="category"
                        >
                          {(data?.categoryBreakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                    Top Products
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.topProducts || []).slice(0, 10).map((product, i) => (
                          <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="font-medium text-gray-900">{product.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-600">{product.quantity}</td>
                            <td className="text-right py-3 px-4 font-semibold text-green-600">{formatCurrency(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'revenue' && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                  Revenue Over Time
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data?.revenueByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                    Products by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.categoryBreakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                    Product Value by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.categoryBreakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'stock' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-green-700 font-medium">In Stock</span>
                  </div>
                  <p className="text-3xl font-bold text-green-800">{(data?.stock.total || 0) - (data?.stock.lowStock || 0) - (data?.stock.outOfStock || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-amber-700 font-medium">Low Stock</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-800">{data?.stock.lowStock || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-red-700 font-medium">Out of Stock</span>
                  </div>
                  <p className="text-3xl font-bold text-red-800">{data?.stock.outOfStock || 0}</p>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SubscriptionGate>
    </SidebarLayout>
  )
}
