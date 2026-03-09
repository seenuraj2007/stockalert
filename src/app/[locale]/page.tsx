'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
  Package, Bell, Users, MapPin,
  Shield, Zap, ArrowRight, CheckCircle,
  X, Code2,
  Database, Receipt, QrCode,
  IndianRupee, Smartphone,
  Download, Star, Check, Clock, Heart,
  Menu, Construction, Flame, Sparkles, Barcode,
  TrendingUp, Warehouse, FileText, AlertTriangle,
  Truck, RefreshCw, Search, BarChart3, Settings,
  Plug, Globe, Lock, CreditCard, Target,
  MessageCircle, GitBranch, ExternalLink, ChevronRight,
  Layers, ShoppingCart, ClipboardList, Activity
} from 'lucide-react'

const stats = [
  { value: 'Beta', label: 'Access', icon: Sparkles },
  { value: '<1s', label: 'Load Time', icon: Zap },
  { value: 'Active', label: 'Development', icon: Construction },
  { value: '0', label: 'Cost', icon: IndianRupee },
]

const features = [
  {
    icon: Download,
    title: 'Tally Import',
    description: 'One-click migration from Tally. Products, stock, GST details—all in seconds.',
    status: 'Live',
    accent: '#3b82f6'
  },
  {
    icon: Package,
    title: 'Real-time Stock',
    description: 'Live inventory tracking across all locations. Know your stock levels instantly.',
    status: 'Live',
    accent: '#8b5cf6'
  },
  {
    icon: Receipt,
    title: 'GST Invoicing',
    description: 'Generate compliant invoices with automatic HSN codes, tax calculations.',
    status: 'Live',
    accent: '#f59e0b'
  },
  {
    icon: Barcode,
    title: 'Barcode Scanner',
    description: 'Scan barcodes with camera. Speed up billing and inventory operations.',
    status: 'Live',
    accent: '#ec4899'
  },
]

const moreFeatures = [
  {
    icon: Warehouse,
    title: 'Multi-Location Inventory',
    description: 'Manage stock across multiple warehouses, stores, or branches. Track transfers between locations.',
  },
  {
    icon: AlertTriangle,
    title: 'Smart Alerts',
    description: 'Get notified when stock runs low. Set custom thresholds per product and receive alerts via email or WhatsApp.',
  },
  {
    icon: Truck,
    title: 'Purchase Orders',
    description: 'Create and manage purchase orders from suppliers. Track deliveries and manage supplier relationships.',
  },
  {
    icon: RefreshCw,
    title: 'Stock Transfers',
    description: 'Transfer inventory between locations with full audit trail. Track movement history.',
  },
  {
    icon: FileText,
    title: 'Supplier Management',
    description: 'Maintain supplier database, track lead times, and manage purchase history with each vendor.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into stock movement, sales trends, and inventory valuation.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Role-based access control. Assign permissions to team members for secure collaboration.',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Create Account',
    description: 'Sign up for free and verify your email. Get instant access to the dashboard.',
  },
  {
    step: '02',
    title: 'Import Data',
    description: 'Import your existing inventory from Tally or add products manually.',
  },
  {
    step: '03',
    title: 'Start Managing',
    description: 'Track stock in real-time, create invoices, and manage your business efficiently.',
  },
]

const integrations = [
  { name: 'Tally', description: 'Import & sync data', icon: Database },
  { name: 'GST', description: 'Tax compliance', icon: FileText },
  { name: 'Barcode', description: 'Scanner integration', icon: Barcode },
  { name: 'Reports', description: 'Export & analysis', icon: TrendingUp },
]

const faqs = [
  {
    question: 'Is Stockox really free?',
    answer: 'Yes! Stockox is completely free during the beta period. The core features will remain free forever. We may introduce premium features in the future, but the basics will always be free.',
  },
  {
    question: 'How do I migrate from Tally?',
    answer: 'Simply export your data from Tally and use our one-click import feature. We support products, stock quantities, GST details, and supplier information. Our import wizard guides you through the entire process.',
  },
  {
    question: 'Can I self-host Stockox?',
    answer: 'Yes! Contact us for enterprise deployment options. We offer self-hosted solutions for businesses that need on-premise installation.',
  },
  {
    question: 'Is my data secure?',
    answer: 'We take security seriously. Your data is encrypted at rest and in transit. We also offer role-based access control so you can manage what your team members can see and do.',
  },
  {
    question: 'Do you offer support?',
    answer: 'Yes! During beta, all users get priority support from our founding team. You can reach us through email, WhatsApp, or our community Discord channel.',
  },
  {
    question: 'What happens after beta?',
    answer: 'The core functionality will remain free. We may introduce optional paid features for enterprise users, but the basic inventory management will always be free.',
  },
]

const roadmap = [
  { 
    quarter: 'Q1 2024', 
    title: 'Foundation', 
    items: ['Core Inventory', 'GST Invoicing', 'Tally Import'], 
    status: 'completed' 
  },
  { 
    quarter: 'Q2 2024', 
    title: 'Enhancement', 
    items: ['Dashboard Analytics', 'Stock Transfers', 'Team Roles'], 
    status: 'current' 
  },
  { 
    quarter: 'Q3 2024', 
    title: 'Scale', 
    items: ['Multi-branch sync', 'Offline Mode', 'Public API'], 
    status: 'upcoming' 
  },
]

function AnimatedCounter({ value, suffix = '' }: { value: string, suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState('0')
  
  useEffect(() => {
    if (isInView) {
      setDisplayValue(value)
    }
  }, [isInView, value, suffix])
  
  return <span ref={ref}>{displayValue}</span>
}

export default function HomePage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const y = useSpring(useTransform(scrollYProgress, [0, 0.3], [0, -100]), {
    stiffness: 100,
    damping: 30,
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full blur-[100px]" />
        
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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight">Stockox</span>
                  <span className="text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">BETA</span>
                </div>
              </Link>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">How It Works</a>
                <a href="#faq" className="text-sm text-white/60 hover:text-white transition-colors">FAQ</a>
                <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
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
                  className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10 flex items-center gap-2"
                >
                  Join Beta <ArrowRight className="w-4 h-4" />
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
                  <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">How It Works</a>
                  <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">FAQ</a>
                  <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">Pricing</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4">
        <motion.div style={{ y, opacity }} className="max-w-7xl mx-auto">
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
                simplified.
              </span>
            </h1>
          </motion.div>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            An inventory system in active development. 
            Track stock, generate invoices, and manage your business.
            <span className="block mt-2 text-cyan-400">Currently in Public Beta.</span>
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
                Join the Beta
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              View Progress
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
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Active Development</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Community Driven</span>
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
                  <div className="px-4 py-1 bg-white/5 rounded-lg text-xs text-white/40 font-mono flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    app.stockalert.io/beta
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
                      <h3 className="font-semibold">Beta Tasks</h3>
                      <Construction className="w-4 h-4 text-white/40" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { task: 'Dashboard', status: 'Live', color: 'text-emerald-400' },
                        { task: 'Invoicing', status: 'Live', color: 'text-emerald-400' },
                        { task: 'Mobile App', status: 'Planning', color: 'text-white/40' },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.1 }}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-white/70">{item.task}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 ${item.color}`}>{item.status}</span>
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
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Current Features</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Built for speed.<br />
              <span className="text-white/40">Ready for business.</span>
            </h2>
            <p className="text-lg text-white/50">
              Core features are live and stable. Here is what you can use right now.
            </p>
          </motion.div>
          
          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 overflow-hidden hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white/60" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Live
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Get started in minutes
            </h2>
            <p className="text-lg text-white/50">
              Three simple steps to start managing your inventory like a pro.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-8 bg-white/5 border border-white/10 rounded-3xl"
              >
                <div className="text-6xl font-bold text-white/5 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-white/50">{step.description}</p>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-white/20">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* More Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-violet-400 text-sm font-semibold uppercase tracking-wider mb-4 block">More Features</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Everything you need
            </h2>
            <p className="text-lg text-white/50">
              A complete inventory management solution with all the tools to scale your operations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moreFeatures.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all h-full"
                >
                  <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-violet-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Integrations</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Works with your<br />
              <span className="text-white/40">existing tools.</span>
            </h2>
            <p className="text-lg text-white/50">
              Seamless integration with popular tools and platforms.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {integrations.map((integration, i) => {
              const Icon = integration.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:border-white/20 transition-all"
                >
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white/60" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-xs text-white/40">{integration.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently asked questions
            </h2>
            <p className="text-lg text-white/50">
              Everything you need to know about Stockox.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              >
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <span className="font-semibold text-lg pr-4">{faq.question}</span>
                    <ChevronRight className="w-5 h-5 text-white/40 group-open:rotate-90 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-6 pb-6 text-white/60 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-24 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Roadmap</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Where we are going
            </h2>
            <p className="text-lg text-white/50">
              We have a clear path forward. Join us and help shape the product.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {roadmap.map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-3xl border ${
                  phase.status === 'current' 
                    ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30' 
                    : phase.status === 'completed'
                    ? 'bg-white/5 border-white/10 opacity-60'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {phase.status === 'current' && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    We are here
                  </div>
                )}
                <div className="text-sm text-white/40 mb-2">{phase.quarter}</div>
                <h3 className="text-xl font-bold mb-4">{phase.title}</h3>
                <ul className="space-y-3">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/70">
                      {phase.status === 'completed' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : phase.status === 'current' ? (
                        <div className="w-4 h-4 rounded-full border border-cyan-400 flex items-center justify-center">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/20" />
                      )}
                      {item}
                    </li>
                  ))}
                </ul>
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
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-4 block">Beta Pricing</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Free during beta.<br />
              <span className="text-white/40">Forever free.</span>
            </h2>
            <p className="text-lg text-white/50">
              The core system will always be free. Premium features may come later.
            </p>
          </motion.div>
          
          <div className="max-w-lg mx-auto">
            {/* Early Adopter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-3xl p-8 overflow-hidden"
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Beta Access
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Early Adopter</h3>
                <p className="text-white/50">Join now and lock in benefits</p>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-bold">₹0</span>
                <span className="text-white/40">/currently</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  'All current features',
                  'Direct access to founders',
                  'Shape the roadmap',
                  'Priority support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
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
              <Construction className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                This is just the beginning.
              </h2>
              <p className="text-lg text-white/50 mb-8 max-w-xl mx-auto">
                We are building this in the open. Try it out, break things, and help us build the inventory tool you actually want to use.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-all shadow-lg shadow-white/10"
              >
                Start Building With Us
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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">Stockox</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Beta</span>
                </div>
              </Link>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-4">
                Inventory management system. 
                Currently in active development.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Project</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Bug</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Stockox. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}