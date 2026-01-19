'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Minus, Trash2, Search, X, CreditCard, DollarSign, 
  Printer, Receipt, Package, Barcode, User, RotateCcw,
  Calculator, CheckCircle, AlertTriangle, ShoppingCart, 
  History, Key, Zap, Grid, List, Clock, Tag
} from 'lucide-react'
import Link from 'next/link'
import { SubscriptionGate } from '@/components/SubscriptionGate'

interface Product {
  id: number
  name: string
  sku: string | null
  barcode: string | null
  category: string | null
  current_quantity: number
  reorder_point: number
  selling_price: number
  unit_cost: number | null
  unit: string
  image_url: string | null
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
}

interface SaleResult {
  success: boolean
  sale?: {
    id: number
    sale_number: string
    total: number
  }
  error?: string
}

interface HeldSale {
  id: string
  cart: CartItem[]
  customer: Customer | null
  timestamp: Date
  total: number
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]
const HOTKEYS = {
  'F1': { action: 'clear', label: 'Clear Cart' },
  'F2': { action: 'hold', label: 'Hold Sale' },
  'F3': { action: 'recall', label: 'Recall Sale' },
  'F4': { action: 'customer', label: 'Select Customer' },
  'F5': { action: 'cash', label: 'Cash Payment' },
  'F6': { action: 'card', label: 'Card Payment' },
  'F7': { action: 'discount', label: 'Apply Discount' },
  'F8': { action: 'search', label: 'Search Products' },
  'F9': { action: 'scan', label: 'Scan Barcode' },
  'F10': { action: 'complete', label: 'Complete Sale' },
  'Escape': { action: 'close', label: 'Close Modal' },
  'Enter': { action: 'complete', label: 'Complete Sale' },
  '+': { action: 'add', label: 'Add Quantity' },
  '-': { action: 'remove', label: 'Remove Quantity' },
}

export default function BillingPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)
  
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<SaleResult | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [taxRate, setTaxRate] = useState(10)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState(0)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [userRole, setUserRole] = useState<string>('viewer')
  const [heldSales, setHeldSales] = useState<HeldSale[]>([])
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [recentItems, setRecentItems] = useState<CartItem[]>([])
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcValue, setCalcValue] = useState('')

  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[])),
    [products]
  )

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/products')
      if (res.status === 401) {
        router.push('/auth')
        return
      }
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }, [])

  const fetchUserRole = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || 'viewer')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    fetchUserRole()
    searchInputRef.current?.focus()
  }, [fetchProducts, fetchCustomers, fetchUserRole])

  useEffect(() => {
    if (showScanner && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [showScanner])

  useEffect(() => {
    if (showScanner && scannedBarcode) {
      const product = products.find(p => p.barcode === scannedBarcode || p.sku === scannedBarcode)
      if (product) {
        addToCart(product)
        setScannedBarcode('')
        setShowScanner(false)
      }
    }
  }, [scannedBarcode, products, showScanner])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          if (showCompleteModal) setShowCompleteModal(false)
          else if (showCustomerSelect) setShowCustomerSelect(false)
          else if (showHoldModal) setShowHoldModal(false)
          else if (showDiscountModal) setShowDiscountModal(false)
        }
        return
      }

      if (e.key === 'Escape') {
        setShowScanner(false)
        return
      }

      if (e.key === 'F8') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'F9') {
        e.preventDefault()
        setShowScanner(true)
      }
      if (e.key === 'F1') {
        e.preventDefault()
        clearCart()
      }
      if (e.key === 'F10' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault()
        if (cart.length > 0) setShowCompleteModal(true)
      }
      if (e.key === '+' && !e.ctrlKey) {
        e.preventDefault()
        if (cart.length > 0 && cart[0]) {
          updateQuantity(cart[0].product.id, cart[0].quantity + 1)
        }
      }
      if (e.key === '-' && !e.ctrlKey) {
        e.preventDefault()
        if (cart.length > 0 && cart[0]) {
          updateQuantity(cart[0].product.id, cart[0].quantity - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, showCompleteModal, showCustomerSelect, showHoldModal, showDiscountModal])

  const addToCart = (product: Product) => {
    if (product.current_quantity <= 0) {
      alert('Product is out of stock!')
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.current_quantity) {
          alert('Not enough stock available!')
          return prev
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        product,
        quantity: 1,
        unitPrice: product.selling_price,
        discount: 0
      }]
    })

    setRecentItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ).slice(0, 10)
      }
      return [{ product, quantity: 1, unitPrice: product.selling_price, discount: 0 }, ...prev].slice(0, 10)
    })
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }

    setCart(prev => {
      const item = prev.find(i => i.product.id === productId)
      if (item && newQuantity > item.product.current_quantity) {
        alert('Not enough stock available!')
        return prev
      }
      return prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    })
  }

  const updateDiscount = (productId: number, discount: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, discount: Math.max(0, Math.min(discount, item.unitPrice * item.quantity)) }
        : item
    ))
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setDiscountPercent(0)
    setGlobalDiscount(0)
    setCashReceived(0)
  }

  const holdSale = () => {
    if (cart.length === 0) return
    const heldSale: HeldSale = {
      id: Date.now().toString(),
      cart: [...cart],
      customer: selectedCustomer,
      timestamp: new Date(),
      total
    }
    setHeldSales(prev => [heldSale, ...prev])
    clearCart()
    setShowHoldModal(false)
  }

  const recallSale = (held: HeldSale) => {
    setCart(held.cart)
    setSelectedCustomer(held.customer)
    setShowHoldModal(false)
  }

  const deleteHeldSale = (id: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0)
  const percentDiscount = (subtotal * discountPercent) / 100
  const globalDiscAmount = (subtotal * globalDiscount) / 100
  const totalDiscount = itemDiscounts + percentDiscount + globalDiscAmount
  const taxableAmount = subtotal - totalDiscount
  const taxAmount = (taxableAmount * taxRate) / 100
  const total = taxableAmount + taxAmount
  const change = Math.max(0, cashReceived - total)

  useEffect(() => {
    if (cart.length > 0 && paymentMethod === 'cash' && cashReceived === 0) {
      setCashReceived(Math.ceil(total / 10) * 10)
    }
  }, [cart.length, paymentMethod, total, cashReceived])

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to the cart!')
      return
    }

    if (paymentMethod === 'cash' && cashReceived < total) {
      alert('Insufficient cash received!')
      return
    }

    setProcessing(true)

    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount
      }))

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id,
          items,
          payment_method: paymentMethod,
          payment_status: 'paid',
          notes: `Tax: ${taxRate}%, Discount: ${discountPercent}%`
        })
      })

      const data = await res.json()

      if (res.ok) {
        setLastSale({ success: true, sale: data.sale })
        setShowReceipt(true)
        clearCart()
        fetchProducts()
      } else {
        setLastSale({ success: false, error: data.error || 'Sale failed' })
        alert(data.error || 'Sale failed')
      }
    } catch (error) {
      console.error('Error completing sale:', error)
      setLastSale({ success: false, error: 'Network error' })
      alert('Network error. Please try again.')
    } finally {
      setProcessing(false)
      setShowCompleteModal(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleBarcodeScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const barcode = e.target.value
    if (barcode.length >= 8) {
      const product = products.find(p => p.barcode === barcode || p.sku === barcode)
      if (product) {
        addToCart(product)
        setSearchTerm('')
      }
    }
    setSearchTerm(barcode)
  }

  const printReceipt = () => {
    window.print()
  }

  const handleCalc = (op: string) => {
    try {
      switch (op) {
        case 'C': setCalcValue(''); break
        case '=': setCalcValue(eval(calcValue).toString()); break
        default: setCalcValue(calcValue + op);
      }
    } catch (e) {
      setCalcValue('Error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <SubscriptionGate>
      <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">StockAlert</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 mx-2"></div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <span className="text-lg font-semibold text-gray-900">POS</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">F1 Clear</span>
              <span className="px-2 py-1 bg-gray-100 rounded">F8 Search</span>
              <span className="px-2 py-1 bg-gray-100 rounded">F9 Scan</span>
              <span className="px-2 py-1 bg-gray-100 rounded">F10 Pay</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Calculator"
              >
                <Calculator className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowHoldModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">Hold ({heldSales.length})</span>
              </button>
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Barcode className="w-5 h-5" />
                <span className="hidden sm:inline">Scan</span>
              </button>
              <button
                onClick={clearCart}
                className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showScanner && (
        <div className="bg-indigo-600 text-white px-4 py-3">
          <div className="max-w-full mx-auto">
            <div className="flex items-center gap-4">
              <Barcode className="w-5 h-5" />
              <span className="text-sm">Scan barcode or enter manually:</span>
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchTerm}
                onChange={handleBarcodeScan}
                placeholder="Scan barcode..."
                className="flex-1 max-w-md px-3 py-2 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-white"
                autoFocus
              />
              <button
                onClick={() => setShowScanner(false)}
                className="p-1 hover:bg-indigo-500 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalculator && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl p-4 z-50 w-64">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-900">Calculator</span>
            <button onClick={() => setShowCalculator(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={calcValue}
            readOnly
            className="w-full p-2 text-right text-lg border border-gray-300 rounded mb-2 bg-gray-50"
          />
          <div className="grid grid-cols-4 gap-2">
            {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
              <button
                key={btn}
                onClick={() => handleCalc(btn)}
                className={`p-2 rounded text-sm font-medium ${
                  btn === 'C' ? 'bg-red-100 text-red-600' :
                  btn === '=' ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products... (Press F8)"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <Grid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-indigo-600' : 'text-gray-600'}`} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-indigo-600' : 'text-gray-600'}`} />
                </button>
              </div>

              <button
                onClick={() => setShowDiscountModal(true)}
                className="flex items-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <Tag className="w-5 h-5" />
                <span>Discount</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {filteredProducts.length} products
              </span>
              {recentItems.length > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recentItems.length} recent items
                </span>
              )}
            </div>
          </div>

          {recentItems.length > 0 && !searchTerm && !selectedCategory && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
              <p className="text-sm text-yellow-800 font-medium mb-2">Recently Added:</p>
              <div className="flex flex-wrap gap-2">
                {recentItems.map(item => (
                  <button
                    key={item.product.id}
                    onClick={() => addToCart(item.product)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm"
                  >
                    <span className="text-gray-900">{item.product.name}</span>
                    <span className="text-gray-500">×{item.quantity}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Package className="w-16 h-16 mb-4" />
                <p className="text-lg">No products found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.current_quantity <= 0}
                    className={`p-3 rounded-xl border transition-all text-left hover:shadow-lg ${
                      product.current_quantity <= 0
                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-indigo-600">
                        ${product.selling_price.toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        product.current_quantity <= 0
                          ? 'bg-red-100 text-red-700'
                          : product.current_quantity <= (product.reorder_point || 0)
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {product.current_quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.current_quantity <= 0}
                    className={`w-full p-3 rounded-xl border transition-all text-left hover:shadow-lg flex items-center gap-4 ${
                      product.current_quantity <= 0
                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.sku || 'No SKU'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-indigo-600 block">
                        ${product.selling_price.toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        product.current_quantity <= 0
                          ? 'bg-red-100 text-red-700'
                          : product.current_quantity <= (product.reorder_point || 0)
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        Stock: {product.current_quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Current Sale</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{cart.length} items</span>
                {selectedCustomer && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                    {selectedCustomer.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-center text-gray-900">No items in cart</p>
                <p className="text-sm text-center opacity-70 text-gray-600">Search and add products to get started</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => searchInputRef.current?.focus()}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200"
                  >
                    Search (F8)
                  </button>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200"
                  >
                    Scan (F9)
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.map(item => (
                  <div key={item.product.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">
                          <span className="text-gray-900">${item.unitPrice.toFixed(2)}</span> × {item.quantity}
                          {item.discount > 0 && (
                            <span className="text-green-600 ml-2">(-${item.discount.toFixed(2)})</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${((item.unitPrice * item.quantity) - item.discount).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        ref={quantityInputRef}
                        type="number"
                        value={item.quantity || ''}
                        placeholder="1"
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border border-gray-300 rounded py-1 text-gray-900 bg-white"
                        min="1"
                        max={item.product.current_quantity}
                      />
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.current_quantity}
                        className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        placeholder="Disc $"
                        value={item.discount ? item.discount.toFixed(2) : ''}
                        onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                        className="w-16 text-right text-sm border border-gray-300 rounded py-1 text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            {itemDiscounts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Item Discounts</span>
                <span className="text-green-600">-${itemDiscounts.toFixed(2)}</span>
              </div>
            )}
            {globalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Global Discount ({globalDiscount}%)</span>
                <span className="text-green-600">-${globalDiscAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({taxRate}%)</span>
              <span className="text-gray-900">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-300">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCustomerSelect(true)}
                className="flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 text-sm"
              >
                <User className="w-4 h-4" />
                {selectedCustomer ? selectedCustomer.name.slice(0, 15) : 'Customer'}
              </button>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="transfer">🏦 Transfer</option>
              </select>
            </div>

            {paymentMethod === 'cash' && (
              <>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    placeholder="Cash received"
                    className="flex-1 border border-gray-300 rounded-lg py-2 px-3 text-gray-900 bg-white"
                  />
                  <button
                    onClick={() => setCashReceived(Math.ceil(total))}
                    className="px-2 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-xs text-gray-900"
                  >
                    Exact
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_AMOUNTS.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setCashReceived(amount >= total ? amount : Math.ceil(total / amount) * amount)}
                      className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-xs text-gray-900"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                {cashReceived > 0 && (
                  <div className="flex justify-between text-sm p-2 bg-green-50 rounded-lg">
                    <span className="text-green-700">Change</span>
                    <span className="font-semibold text-green-700">${change.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={cart.length === 0 || processing}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {processing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Sale - ${total.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showCustomerSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Customer</h3>
              <button onClick={() => setShowCustomerSelect(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full border border-gray-300 rounded-lg py-2 px-4 text-gray-900 bg-white mb-4"
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer)
                    setShowCustomerSelect(false)
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Sale</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="text-gray-900">{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">-${totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${total.toFixed(2)}</span>
              </div>
              {paymentMethod === 'cash' && (
                <div className="flex justify-between text-green-600">
                  <span>Cash Received</span>
                  <span>${cashReceived.toFixed(2)}</span>
                </div>
              )}
              {paymentMethod === 'cash' && cashReceived > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Change</span>
                  <span>${change.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={processing}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Held Sales</h3>
              <button onClick={() => setShowHoldModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {heldSales.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No held sales</p>
            ) : (
              <div className="space-y-2">
                {heldSales.map(held => (
                  <div key={held.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {held.customer?.name || 'No Customer'} - ${held.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {held.timestamp.toLocaleString()} - {held.cart.length} items
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => recallSale(held)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
                        >
                          Recall
                        </button>
                        <button
                          onClick={() => deleteHeldSale(held.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Apply Discount</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Percentage Discount</label>
                <input
                  type="number"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-900 bg-white"
                  placeholder="0"
                  min="0"
                  max="100"
                />
                <p className="text-sm text-gray-500 mt-1">Discount amount: -${globalDiscAmount.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 25, 50].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setGlobalDiscount(pct)}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      globalDiscount === pct
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastSale && lastSale.success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sale Completed!</h3>
              <p className="text-gray-500">Receipt #{lastSale.sale?.sale_number}</p>
            </div>
            <div className="border-t border-b py-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items</span>
                <span className="text-gray-900">{cart.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">${lastSale.sale?.total?.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReceipt(false)
                  setLastSale(null)
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          nav, aside, button, .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `}      </style>
    </div>
    </SubscriptionGate>
  )
}
