# DKS StockAlert

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)

Open-source inventory management system for small and medium businesses with WhatsApp alerts, Tally integration, and GST invoicing.

Built for Indian SMBs but works globally.

## 🚀 Features

- 📦 **Multi-location Inventory** - Track stock across multiple warehouses/stores
- 📱 **WhatsApp Alerts** - Get instant low stock alerts (1000 free/month)
- 📊 **Tally ERP Import** - Import data directly from Tally (XML/CSV)
- 🧾 **GST Invoicing** - Generate GST-compliant invoices
- 👥 **Team Collaboration** - Multi-user with role-based access
- 🔄 **Stock Transfers** - Move stock between locations
- 📈 **Analytics Dashboard** - Track sales, inventory value, and trends
- 🏪 **POS/Billing** - Point of sale system with barcode support
- 📋 **Purchase Orders** - Manage supplier orders
- 🔔 **Smart Alerts** - Low stock, out of stock notifications
- 📱 **Mobile Responsive** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Auth:** JWT-based authentication

## 📦 Installation

### Prerequisites

- Node.js 20.12.0 or higher
- PostgreSQL database
- npm or yarn


## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/dks-stockalert.git
cd dks-stockalert
npm install
cp .env.sample .env.local
# Edit .env.local with your DB credentials
npx prisma migrate dev
npm run dev
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Indian SMBs
- Inspired by Tally ERP workflows
- Open source community



**Made with ❤️ for the open source community**
