# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source release preparation
- CONTRIBUTING.md guidelines
- SECURITY.md policy
- GitHub issue and PR templates
- GitHub Actions CI workflow

## [1.0.0] - 2026-02-12

### Added
- Initial release of DKS StockAlert
- Multi-tenant inventory management system
- Product management with stock tracking
- Multi-location support
- GST-compliant invoice generation
- Purchase order management
- Stock transfers between locations
- WhatsApp Business API integration (1000 free messages/month)
- In-app notifications for real-time alerts
- Tally ERP import/export (XML and CSV formats)
- Team collaboration with role-based access
- Supplier management
- Customer management
- Analytics and reporting dashboard
- Low stock and out-of-stock alerts
- Barcode scanning support
- Shopify integration
- WooCommerce integration
- Mobile-responsive design
- Dark mode support
- Internationalization (i18n) support

### Features
- **Authentication**: JWT-based authentication with email verification
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS
- **Security**: CSRF protection, rate limiting, tenant isolation
- **API**: RESTful API with 50+ endpoints
- **Testing**: Vitest for unit testing
- **Documentation**: Comprehensive setup and deployment guides

### Technical Details
- Node.js 20.12.0+ required
- Supports PostgreSQL 14+
- Built for Indian SMBs with GST compliance
- Multi-currency support (₹, $)
- Responsive design for desktop, tablet, and mobile

### Security
- Tenant isolation ensures data separation
- Input validation on all endpoints
- SQL injection prevention via Prisma
- XSS protection via React
- CSRF token protection

### Deployment
- One-click deploy to Vercel
- Docker support with docker-compose
- Environment-based configuration
- Automated database migrations

## Migration Notes

### From Tally ERP
Use the built-in Tally import feature:
1. Go to Settings → Import
2. Export stock items from Tally (XML or CSV)
3. Upload the file
4. Review and import

### Database Migrations
Run migrations with:
```bash
npx prisma migrate dev
```

## Known Issues

### Version 1.0.0
- In-app notifications are always available and free
- WhatsApp alerts require Meta Business verification
- Password hashing uses SHA256 (migration to bcrypt planned for v2.0)
- Rate limiting uses in-memory storage (Redis recommended for production)

## Roadmap

### [1.1.0] - Planned
- Enhanced reporting with charts
- Inventory forecasting
- Multi-currency support improvement
- API rate limiting with Redis
- Mobile app (React Native)

### [2.0.0] - Planned
- Bcrypt password hashing
- OAuth providers (Google, GitHub)
- Two-factor authentication (2FA)
- Advanced analytics
- Multi-warehouse support
- Barcode printing

## Contributors

Thanks to all contributors who helped make DKS StockAlert possible!

See [CONTRIBUTORS.md](./CONTRIBUTORS.md) for a list of contributors.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

**Note**: This changelog was started with version 1.0.0. Earlier development versions were not tracked.
