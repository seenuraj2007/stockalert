# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Yes (latest)    |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Do not** open a public GitHub issue for security vulnerabilities.

Instead, please email us at:

📧 **security@dksstockalert.com**

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information (optional)

### Response Time

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 5 business days
- **Fix**: As soon as possible depending on severity

## Security Best Practices

### For Users

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use strong, unique passwords for database
   - Rotate API keys regularly
   - Keep `DISABLE_EMAIL=true` if not using email

2. **Database Security**
   - Use SSL/TLS for database connections
   - Enable Row Level Security (RLS) policies
   - Regular database backups
   - Limit database user permissions

3. **Authentication**
   - Use strong passwords (12+ characters)
   - Enable 2FA when available
   - Regularly review user access
   - Log out from shared computers

4. **Deployment**
   - Use HTTPS in production
   - Set secure HTTP headers
   - Regular security updates
   - Monitor for suspicious activity

### For Developers

1. **Code Security**
   - Validate all user inputs
   - Use parameterized queries (Prisma handles this)
   - Implement proper authentication checks
   - Sanitize data before rendering

2. **Dependencies**
   - Keep dependencies updated
   - Run `npm audit` regularly
   - Review new dependencies before adding
   - Use lock files (`package-lock.json`)

3. **Secrets Management**
   ```bash
   # Never do this
   const apiKey = "sk-1234567890abcdef"
   
   # Do this instead
   const apiKey = process.env.API_KEY
   ```

4. **API Security**
   - Rate limiting on auth endpoints
   - CSRF protection enabled
   - Proper CORS configuration
   - Input validation on all routes

## Known Security Considerations

### Current Limitations

1. **Password Hashing**
   - Current: SHA256 (not recommended)
   - Recommended: bcrypt with salt rounds
   - Migration: Planned for v2.0

2. **Rate Limiting**
   - Current: In-memory (resets on restart)
   - Recommended: Redis for production
   - Note: Add `UPSTASH_REDIS_REST_URL` to env

3. **Session Management**
   - Current: JWT tokens
   - Consider: Refresh token rotation
   - Note: Implement for high-security deployments

### Security Checklist for Production

- [ ] Database credentials rotated
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Input validation enabled
- [ ] Error handling (no stack traces to users)
- [ ] Logging configured
- [ ] Backups automated
- [ ] Monitoring enabled

## Vulnerability Disclosure Process

### 1. Report Received
- Email acknowledged within 48 hours
- Issue assigned a tracking ID

### 2. Assessment
- Severity evaluated (Critical, High, Medium, Low)
- Impact analysis
- Reproduction confirmed

### 3. Fix Development
- Patch developed privately
- Tested thoroughly
- Security researcher notified (if provided)

### 4. Disclosure
- Fix deployed
- Security advisory published
- Credit given to reporter (with permission)
- CVE assigned if applicable

### 5. Timeline

| Severity | Fix Target | Public Disclosure |
|----------|-----------|-------------------|
| Critical | 7 days | After fix deployed |
| High | 14 days | After fix deployed |
| Medium | 30 days | After fix deployed |
| Low | 90 days | After fix deployed |

## Security Features

### Current Implementation

- ✅ JWT-based authentication
- ✅ Tenant isolation
- ✅ CSRF protection
- ✅ Rate limiting (basic)
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)

### Roadmap

- 🔒 bcrypt password hashing
- 🔒 Redis-based rate limiting
- 🔒 OAuth providers (Google, GitHub)
- 🔒 2FA/MFA support
- 🔒 Audit logging
- 🔒 IP whitelisting

## Compliance

### Data Protection

- GDPR-compliant data export
- Right to deletion
- Data minimization
- Encryption at rest (database)

### Indian Regulations

- GST-compliant invoicing
- Data localization support
- Audit trail maintenance

## Contact

**Security Team:** security@dksstockalert.com

**For general questions:** hello@dksstockalert.com

---

Thank you for helping keep DKS StockAlert secure! 🔐
