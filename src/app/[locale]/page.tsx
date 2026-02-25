'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
  Package, TrendingDown, AlertTriangle, Bell, Users, MapPin,
  Truck, BarChart3, Shield, Zap, ArrowRight, CheckCircle,
  ChevronRight, Layers, Target, Sparkles, Cpu, Lock,
  Database, Code2, Globe, Server, Receipt, QrCode, FileText,
  IndianRupee, Building2, UserPlus, MessageSquare, Smartphone,
  Download, Languages, Star, TrendingUp, Check, Clock, Github, Heart,
  Menu, X, Play, ArrowUpRight, MoveRight, Eye, Settings, PieChart, Barcode
} from 'lucide-react'

const stats = [
  { value: '10K+', label: 'Active Users', icon: Users },
  { value: '5M+', label: 'Products Tracked', icon: Package },
  { value: '99.9%', label: 'Uptime', icon: Zap },
  { value: '0', label: 'Cost', icon: IndianRupee },
]

const features = [
  {
    icon: Smartphone,
    title: 'IMEI & Serial Tracking',
    description: 'Track every phone & electronic item by IMEI or serial number. Perfect for mobile stores.',
    badge: 'Electronics',
    accent: '#06b6d4'
  },
  {
    icon: Shield,
    title: 'Warranty Management',
    description: 'Automatic warranty expiry tracking. Get alerts before warranties expire.',
    badge: 'Pro Feature',
    accent: '#f59e0b'
  },
  {
    icon: Github,
    title: 'Open Source',
    description: 'Fully transparent codebase. Fork it, self-host it, contribute to it. No vendor lock-in.',
    badge: 'MIT License',
    accent: '#10b981'
  },
  {
    icon: Download,
    title: 'Tally Import',
    description: 'One-click migration from Tally. Products, stock, GST rates—all imported in seconds.',
    badge: 'Time Saver',
    accent: '#3b82f6'
  },
  {
    icon: Package,
    title: 'Real-time Stock',
    description: 'Live inventory tracking across all locations. Know your stock levels instantly.',
    badge: 'Live',
    accent: '#8b5cf6'
  },
  {
    icon: Receipt,
    title: 'GST Invoicing',
    description: 'Generate compliant invoices with automatic HSN codes, tax calculations, and e-way bills.',
    badge: 'GST Ready',
    accent: '#f59e0b'
  },
  {
    icon: Barcode,
    title: 'Barcode Scanner',
    description: 'Scan barcodes & IMEI with camera. Speed up billing and inventory operations.',
    badge: 'Mobile',
    accent: '#ec4899'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Low stock, warranty expiry, and reorder alerts. Never miss anything.',
    badge: 'Automated',
    accent: '#06b6d4'
  },
]

const comparisonData = [
  { feature: 'Monthly Cost', us: 'Free', zoho: '₹749', marg: '₹1,500', tally: '₹4,500' },
  { feature: 'Tally Import', us: true, zoho: false, marg: false, tally: false },
  { feature: 'IMEI/Serial Tracking', us: true, zoho: false, marg: false, tally: false },
  { feature: 'Warranty Tracking', us: true, zoho: false, marg: false, tally: false },
  { feature: 'GST Invoicing', us: true, zoho: true, marg: true, tally: true },
  { feature: 'Open Source', us: true, zoho: false, marg: false, tally: false },
]

const techStack = [
  { name: 'Next.js 15', icon: Code2 },
  { name: 'React 19', icon: Globe },
  { name: 'TypeScript', icon: Cpu },
  { name: 'Prisma', icon: Database },
  { name: 'PostgreSQL', icon: Server },
  { name: 'Tailwind CSS', icon: Sparkles },
]

const testimonials = [
  {
    quote: "Finally moved away from Tally. The import feature saved us weeks of manual work.",
    author: "Rajesh Kumar",
    role: "Operations Manager",
    company: "TechParts India"
  },
  {
    quote: "Open source means we can customize it for our specific needs. Game changer.",
    author: "Priya Sharma",
    role: "CTO",
    company: "RetailFlow"
  },
  {
    quote: "The multi-location feature is exactly what we needed. Clean, fast, reliable.",
    author: "Amit Patel",
    role: "Business Owner",
    company: "Gujarat Distributors"
  },
]

function AnimatedCounter({ value, suffix = '' }: { value: string, suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState('0')
  
  useEffect(() => {
    if (isInView) {
      const numValue = parseFloat(value.replace(/[^0-9.]/g, ''))
      const prefix = value.match(/^[^0-9]*/)?.[0] || ''
      let start = 0
      const duration = 2000
      const increment = numValue / (duration / 16)
      
      const timer = setInterval(() => {
        start += increment
        if (start >= numValue) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(prefix + Math.floor(start) + suffix)
        }
      }, 16)
      
      return () => clearInterval(timer)
    }
  }, [isInView, value, suffix])
  
  return <span ref={ref}>{displayValue}</span>
}

function MagneticButton({ children, className, ...props }: any) {
  const ref = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setPosition({ x: x * 0.2, y: y * 0.2 })
  }
  
  const reset = () => setPosition({ x: 0, y: 0 })
  
  return (
    <motion.button
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default function HomePage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  
  const y = useSpring(useTransform(scrollYProgress, [0, 0.3], [0, -100]), {
    stiffness: 100,
    damping: 30,
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full blur-[100px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}
        />
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight">StockAlert</span>
                  <span className="hidden sm:inline text-xs text-emerald-400 ml-2 px-2 py-0.5 bg-emerald-400/10 rounded-full">Open Source</span>
                </div>
              </Link>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a>
                <a href="#comparison" className="text-sm text-white/60 hover:text-white transition-colors">Compare</a>
                <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
                <a href="https://github.com/seenuraj2007/stockalert" target="_blank" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1">
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
              
              {/* CTA */}
              <div className="flex items-center gap-3">
                <Link 
                  href="/auth"
                  className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                >
                  Get Started
                </Link>
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden mt-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4"
              >
                <div className="space-y-2">
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">Features</a>
                  <a href="#comparison" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">Compare</a>
                  <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">Pricing</a>
                  <a href="https://github.com/seenuraj2007/stockalert" target="_blank" className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">GitHub</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4">
        <motion.div style={{ y, opacity }} className="max-w-7xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <a 
              href="https://github.com/seenuraj2007/stockalert"
              target="_blank"
              className="group flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:border-emerald-500/50 transition-all"
            >
              <Github className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/70 group-hover:text-white transition-colors">Star us on GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/40" />
            </a>
          </motion.div>
          
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-center max-w-5xl mx-auto mb-8"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="text-white">Inventory</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                management
              </span>
              <br />
              <span className="text-white/40 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">reimagined.</span>
            </h1>
          </motion.div>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The modern inventory system for electronics & mobile stores. 
            Track IMEI, serial numbers, warranty expiry, with GST invoicing and real-time stock.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/auth"
              className="group relative w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              See Features
            </a>
          </motion.div>
          
          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>No credit card required</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Setup in 5 minutes</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <span>Enterprise-grade security</span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="max-w-6xl mx-auto mt-20"
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl opacity-50" />
            
            {/* Dashboard Preview */}
            <div className="relative bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white/5 rounded-lg text-xs text-white/40 font-mono">
                    app.stockalert.io/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="p-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {stats.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-white/40">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-bold">
                          <AnimatedCounter value={stat.value} />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Main Content */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Inventory Chart Placeholder */}
                  <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Stock Overview</h3>
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">Live</span>
                    </div>
                    <div className="h-40 flex items-end gap-2">
                      {[65, 80, 45, 90, 60, 75, 85, 55, 70, 95, 50, 80].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-500/10 rounded-t-lg"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Alerts */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Alerts</h3>
                      <Bell className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { product: 'Widget A', status: 'Low Stock', color: 'text-amber-400' },
                        { product: 'Gadget B', status: 'Out of Stock', color: 'text-red-400' },
                        { product: 'Tool C', status: 'Reorder', color: 'text-cyan-400' },
                      ].map((alert, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.1 }}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-white/70">{alert.product}</span>
                          <span className={`text-xs ${alert.color}`}>{alert.status}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
      
      {/* Stats Section */}
      <section className="py-24 px-4 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-white/40">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Everything you need.<br />
              <span className="text-white/40">Nothing you don't.</span>
            </h2>
            <p className="text-lg text-white/50">
              Built with real businesses in mind. Every feature solves a real problem.
            </p>
          </motion.div>
          
          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Featured - Open Source */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 lg:row-span-2 group relative bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-8 overflow-hidden hover:border-emerald-500/40 transition-all"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full mb-6">
                  <Github className="w-3.5 h-3.5" />
                  MIT License
                </div>
                <Github className="w-16 h-16 text-emerald-400/50 mb-6" strokeWidth={1} />
                <h3 className="text-3xl font-bold mb-4">Open Source</h3>
                <p className="text-white/60 text-lg leading-relaxed mb-6">
                  Fully transparent codebase. Fork it, customize it, self-host it. 
                  No vendor lock-in, no hidden costs, no surprises.
                </p>
                <a 
                  href="https://github.com/seenuraj2007/stockalert" 
                  target="_blank"
                  className="inline-flex items-center gap-2 text-emerald-400 font-medium group-hover:gap-3 transition-all"
                >
                  View on GitHub
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
            
            {/* Tally Import */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-3xl p-6 overflow-hidden hover:border-blue-500/40 transition-all"
            >
              <Download className="w-10 h-10 text-blue-400/70 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold mb-2">Tally Import</h3>
              <p className="text-white/50 text-sm">One-click migration from Tally. Products, stock, GST details—all in seconds.</p>
            </motion.div>
            
            {/* Real-time Stock */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="group relative bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-3xl p-6 overflow-hidden hover:border-violet-500/40 transition-all"
            >
              <Package className="w-10 h-10 text-violet-400/70 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold mb-2">Real-time Stock</h3>
              <p className="text-white/50 text-sm">Live inventory tracking. Know exactly what you have, where you have it.</p>
            </motion.div>
            
            {/* GST Invoicing */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-6 overflow-hidden hover:border-amber-500/40 transition-all"
            >
              <Receipt className="w-10 h-10 text-amber-400/70 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold mb-2">GST Invoicing</h3>
              <p className="text-white/50 text-sm">Generate compliant invoices with automatic HSN codes and tax calculations.</p>
            </motion.div>
            
            {/* Multi-location */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="group relative bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20 rounded-3xl p-6 overflow-hidden hover:border-red-500/40 transition-all"
            >
              <MapPin className="w-10 h-10 text-red-400/70 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold mb-2">Multi-Location</h3>
              <p className="text-white/50 text-sm">Manage warehouses, stores, and godowns from one dashboard.</p>
            </motion.div>
            
            {/* More Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Bell, title: 'Smart Alerts', desc: 'Get notified before stock runs out' },
                  { icon: QrCode, title: 'Barcode Support', desc: 'Generate, print, and scan' },
                  { icon: Globe, title: 'Multi-Language', desc: 'Built for global teams' },
                  { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security' },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white/60" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-white/40">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Comparison Section */}
      <section id="comparison" className="py-24 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Comparison</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why choose us?
            </h2>
            <p className="text-lg text-white/50">
              See how we stack up against the competition.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div />
                <div className="text-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-2xl">
                  <div className="font-bold">StockAlert</div>
                  <div className="text-emerald-400 text-sm">Free</div>
                </div>
                <div className="text-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="font-medium text-white/60">Zoho</div>
                  <div className="text-white/40 text-sm">₹749/mo</div>
                </div>
                <div className="text-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="font-medium text-white/60">Marg</div>
                  <div className="text-white/40 text-sm">₹18,000</div>
                </div>
                <div className="text-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="font-medium text-white/60">Tally</div>
                  <div className="text-white/40 text-sm">₹54,000</div>
                </div>
              </div>
              
              {/* Rows */}
              {comparisonData.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-5 gap-4 py-4 border-b border-white/5"
                >
                  <div className="flex items-center text-sm text-white/70">{row.feature}</div>
                  <div className="flex items-center justify-center">
                    {typeof row.us === 'boolean' ? (
                      row.us ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-white/20" />
                    ) : (
                      <span className="text-sm text-emerald-400 font-medium">{row.us}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {typeof row.zoho === 'boolean' ? (
                      row.zoho ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-white/20" />
                    ) : (
                      <span className="text-sm text-white/50">{row.zoho}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {typeof row.marg === 'boolean' ? (
                      row.marg ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-white/20" />
                    ) : (
                      <span className="text-sm text-white/50">{row.marg}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {typeof row.tally === 'boolean' ? (
                      row.tally ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-white/20" />
                    ) : (
                      <span className="text-sm text-white/50">{row.tally}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold">
              Loved by businesses
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-white/40">{testimonial.role}, {testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Pricing</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Free forever.<br />
              <span className="text-white/40">No hidden costs.</span>
            </h2>
            <p className="text-lg text-white/50">
              Open source means you own your software. No subscriptions, no surprises.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-3xl p-8 overflow-hidden"
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                POPULAR
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Open Source</h3>
                <p className="text-white/50">Free forever, no credit card required</p>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-bold">₹0</span>
                <span className="text-white/40">/forever</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Up to 500 products',
                  '5 locations/godowns',
                  '3 team members',
                  'GST invoicing',
                  'Tally import',
                  'Email support',
                  'Self-hosting option',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="/auth"
                className="block w-full text-center bg-white text-black py-4 rounded-xl font-semibold hover:bg-white/90 transition-all"
              >
                Get Started Free
              </Link>
            </motion.div>
            
            {/* Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-white/50">For large businesses with custom needs</p>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-bold">Custom</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited products',
                  'Unlimited locations',
                  'Unlimited team members',
                  'Priority support',
                  'Custom integrations',
                  'Dedicated account manager',
                  'On-premise deployment',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <a
                href="mailto:hello@stockalert.io"
                className="block w-full text-center border border-white/20 py-4 rounded-xl font-semibold hover:bg-white/5 transition-all"
              >
                Contact Sales
              </a>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-12 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Ready to take control<br />of your inventory?
              </h2>
              <p className="text-lg text-white/50 mb-8 max-w-xl mx-auto">
                Join thousands of businesses already using StockAlert. 
                Free forever, no credit card required.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-all shadow-lg shadow-white/10"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">StockAlert</span>
              </Link>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-4">
                Open source inventory management. Track stock, generate invoices, 
                and manage multiple locations with ease.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com/seenuraj2007/stockalert"
                  target="_blank"
                  className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:border-white/20 transition-all"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#comparison" className="hover:text-white transition-colors">Comparison</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="https://github.com/seenuraj2007/stockalert" target="_blank" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} StockAlert. Open source under MIT License.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}