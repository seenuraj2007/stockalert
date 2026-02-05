# Landing Page Redesign Prompt

Use this prompt with an AI coding assistant (like Cursor, GitHub Copilot, or ChatGPT) to redesign the landing page for this inventory management application.

---

## Context

This is DKS StockAlert, a Next.js 16 inventory management application built for Indian businesses. The app is currently running with a freemium model - completely free forever with generous limits (500 products, 5 locations, 3 team members).

## Current Tech Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Database**: PostgreSQL with Prisma ORM (Neon hosted)
- **Styling**: Tailwind CSS with Lucide React icons
- **Animations**: Framer Motion
- **Authentication**: Custom JWT-based auth (no Supabase Auth anymore)

## App Features

1. **Product Management**: Track products with barcode support, categories, SKU, unit cost, selling price
2. **Stock Tracking**: Real-time stock levels across multiple locations
3. **Smart Alerts**: Low stock and out-of-stock notifications
4. **GST Invoices**: Generate GST-ready invoices for Indian tax compliance
5. **Supplier Management**: Track suppliers and purchase orders
6. **Multi-location**: Manage inventory across multiple warehouse/locations
7. **Team Collaboration**: Add team members with role-based access
8. **Analytics**: Sales and inventory analytics with charts
9. **Data Export**: Export data in various formats
10. **Barcode Generation**: Generate barcodes for products

## Target Audience

- Small to medium Indian businesses
- Retail shops, warehouses, distribution businesses
- Businesses needing simple but powerful inventory management

## Current Landing Page Issues

1. Generic hero messaging not focused on inventory
2. Pricing section still mentions paid plans (we're free forever now)
3. Features list doesn't highlight core inventory capabilities
4. Tech stack includes Supabase (we've migrated to Prisma/Neon)
5. Stock demo stats look generic (1,247 products, etc.)

## What to Keep

- Dark theme with violet/fuchsia accents
- Animated UI elements with Framer Motion
- Responsive design (mobile-first approach)
- Clean, modern aesthetic
- Marquee for tech stack

## Changes Needed

### Hero Section
- **Focus**: Inventory/stock management for India
- **Headline**: Something like "Inventory Management Built for Indian Businesses"
- **Subhead**: "Track stock in Rupees, manage multiple locations, generate GST invoices - all free forever"
- **CTA**: "Start Free Forever" or "Get Started Free"

### How It Works
- Step 1: Add your products (bulk import or one-by-one with barcode support)
- Step 2: Set up locations and track stock levels
- Step 3: Get alerts and manage your inventory smarter

### Features Section (highlight these)
- Real-time stock tracking across locations
- Low stock alerts & notifications
- GST-compliant invoicing
- Multi-location inventory management
- Purchase order management
- Barcode generation & scanning
- Team collaboration
- Analytics & reports

### Pricing Section
- Keep it simple: Free Forever plan highlighted
- Maybe add an Enterprise option "Contact Sales" for larger businesses

### Tech Stack (update)
- Remove Supabase (we use Prisma + Neon)
- Keep: Next.js, React, TypeScript, Tailwind, Cashfree (for payments)

### Demo Stats
- Make them more realistic for a new user
- Or remove the demo section entirely and use a screenshot instead

---

## Prompt for AI Assistant

```
Redesign the landing page for DKS StockAlert, an inventory management app for Indian businesses. 

Key points:
1. This is a FREE FOREVER app (not a trial)
2. Target: Small-medium Indian businesses
3. Current stack: Next.js 16, Prisma, Neon PostgreSQL, Tailwind CSS, Framer Motion

Update these sections:
1. Hero: Focus on inventory/stock management, GST compliance, multi-location tracking
2. How It Works: Emphasize easy setup and free forever model
3. Features: Highlight real-time stock tracking, alerts, GST invoices, multi-location
4. Pricing: Emphasize Free Forever, remove trial language
5. Tech Stack: Replace Supabase with Prisma/Neon
6. Demo Stats: Make realistic or replace with feature screenshots

Style: Keep dark theme, modern UI, Framer Motion animations, mobile-responsive
```

---

## Design Inspiration

- Focus on trust signals (GST compliance, Indian servers, free forever)
- Use rupee symbols and Indian business terminology
- Show social proof if available (user testimonials)
- Highlight ease of migration from spreadsheets or other tools
- Emphasize "no credit card required" to reduce friction
