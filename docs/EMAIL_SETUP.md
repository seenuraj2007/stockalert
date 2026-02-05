# Email Notifications Setup Guide

## Overview

DKS StockAlert provides **email notifications FREE forever** - no limits, no costs, no credit card required.

Email is the best free alternative to WhatsApp alerts and perfect for businesses that want:

- ✅ 100% free notifications
- ✅ Unlimited messages
- ✅ No setup costs
- ✅ Reliability
- ✅ Easy to use

## Quick Setup Options

### Option 1: Gmail (Free, Personal Use)

Best for personal or small business testing.

1. **Generate App Password**:
   - Go to https://myaccount.google.com
   - Security → 2-Step Verification → App Passwords
   - Generate a new app password: "DKS StockAlert"
   - Copy the 16-character password

2. **Add to .env.local**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=your-email@gmail.com
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Mailtrap (Free, Testing)

Best for development and testing (emails not delivered to real recipients).

1. **Sign up at Mailtrap**: https://mailtrap.io/register
2. **Get credentials from SMTP Settings** → Integration → Nodemailer
3. **Add to .env.local**:
   ```env
   SMTP_HOST=live.smtp.mailtrap.io
   SMTP_PORT=587
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   SMTP_FROM=noreply@yourdomain.com
   ```

### Option 3: Ethereal Email (Free, Mock)

Best for testing without any signup.

```bash
npx ethereal-email
```

Copy the display credentials and add to .env.

### Option 4: Outlook.com (Free)

Similar to Gmail setup:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-outlook-password
SMTP_FROM=your-email@outlook.com
```

### Option 5: Custom SMTP (Paid but affordable)

For production use with custom domain:

- **Resend.com**: 100,000 emails/month FREE
- **SendGrid**: 100 emails/day FREE
- **Brevo (Sendinblue)**: 300 emails/day FREE
- **SES (AWS)**: Very cheap (~$0.10/1000 emails)

## Free Email Services Comparison

| Service | Free Tier | Best For |
|---------|-----------|----------|
| Gmail | Unlimited | Personal/small business |
| Resend | 100,000/mo | Production |
| Brevo | 9,000/mo (free) | Marketing |
| SendGrid | 100/day | Testing |
| Mailtrap | Sandbox only | Development |

## Supported Email Types

1. **Low Stock Alerts** - When stock drops below reorder point
2. **Out of Stock Alerts** - Critical alert when stock reaches zero
3. **Purchase Order Updates** - Track PO status changes
4. **Daily Inventory Summary** - End-of-day overview

## Testing Email Setup

### Send Test Email

Create a test script: `scripts/test-email.cjs`

```javascript
require('dotenv').config({ path: '.env.local' })
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'your-email@example.com',
  subject: 'Test Email',
  text: 'This is a test email from DKS StockAlert!',
}).then(() => console.log('✅ Email sent successfully!'))
  .catch(err => console.error('❌ Email failed:', err))
```

Run: `node scripts/test-email.cjs`

## Troubleshooting

### Common Gmail Issues

**"Invalid username or password"**
- Generate an App Password (don't use your regular password)
- Enable 2-Step Verification first

**"Less secure apps not allowed"**
- You must use App Password, not regular password

### Common Port Issues

| Port | Secure | Use Case |
|------|--------|----------|
| 587 | No | Most SMTP servers (Gmail, Outlook) |
| 465 | Yes | SSL connections |
| 25 | No | Legacy (often blocked) |

### Email Land in Spam?

- Set up SPF/DKIM records for your domain
- Use a reputable sending IP
- Avoid spammy content in emails
- Check https://www.mail-tester.com to score your emails

## Production Recommendations

For production use with custom domain:

1. **Use Resend.com** (100K/mo free):
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=your-resend-api-key
   SMTP_FROM=no-reply@yourdomain.com
   ```

2. **Add DNS Records** (for email reputation):
   - TXT record for SPF
   - TXT record for DKIM
   - CNAME record for domain verification

## When to Choose Email vs WhatsApp

| Factor | Choose Email | Choose WhatsApp |
|--------|--------------|-----------------|
| Budget | Free forever | Free (1,000/mo) then paid |
| Volume | Unlimited | Limited |
| Urgency | Check when convenient | Immediate |
| Device | Any device | Phone only |
| Setup | Very easy | Requires Meta account |
| Delivery | Reliable | Platform-dependent |
| Reach | Worldwide | Only WhatsApp users |

## Example .env.local

Save this file in project root:

```env
# Database
DATABASE_URL=postgres://...

# Email Notifications (FREE FOREVER)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com

# WhatsApp (Optional, paid after 1,000 free)
# WHATSAPP_PHONE_NUMBER_ID=
# WHATSAPP_ACCESS_TOKEN=
# WHATSAPP_BUSINESS_ACCOUNT_ID=
```

## Next Steps

1. ✅ Set up email service
2. ✅ Configure notifications in Settings
3. ✅ Send test email
4. ✅ Start receiving inventory alerts!

---

**Remember:** Email notifications are **100% free forever** with no hidden costs or message limits!
