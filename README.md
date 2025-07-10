# Mailblock SDK

> The simplest email SDK for Node.js. Send transactional emails with just 3 lines of code.

[![npm version](https://badge.fury.io/js/mailblock.svg)](https://badge.fury.io/js/mailblock)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Mailblock?

Email APIs shouldn't be complicated. Mailblock provides a clean, developer-friendly SDK that gets you sending emails in minutes, not hours.

```javascript
import Mailblock from 'mailblock';

const client = new Mailblock('your-api-key');

await client.email()
  .to('user@example.com')
  .from('app@yourcompany.com')
  .subject('Welcome!')
  .html('<h1>Hello World!</h1>')
  .send();
```

## ✨ Features

- **🚀 2-minute setup** - No complex configuration needed
- **⛓️ Method chaining** - Write clean, readable code
- **📅 Built-in scheduling** - Send emails later without cron jobs
- **🔍 Debug mode** - See exactly what's happening with your emails
- **📘 TypeScript first** - Full type safety out of the box
- **🎯 99.9% delivery rate** - Pre-warmed domains for optimal deliverability
- **📖 Crystal clear docs** - Everything you need to get started

## Quick Start

### 1. Install

```bash
npm install mailblock
```

### 2. Get API Key

Sign up at [mailblock.de](https://www.mailblock.de/#beta) and create your API key.

### 3. Send Your First Email

```javascript
import Mailblock from 'mailblock';

const client = new Mailblock('your-api-key');

const result = await client.sendEmail({
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Hello from Mailblock!',
  text: 'This is my first email using the Mailblock SDK.'
});

if (result.success) {
  console.log('Email sent successfully!');
  console.log('Email ID:', result.data.id);
} else {
  console.error('Failed to send email:', result.error);
}
```

## 🔗 API Styles

Mailblock supports two API styles to match your coding preferences:

### Object Style (Traditional)

```javascript
const result = await client.sendEmail({
  to: 'user@example.com',
  from: 'noreply@yourapp.com',
  subject: 'Welcome to our service',
  html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
  scheduledAt: new Date(Date.now() + 3600000) // Send in 1 hour
});
```

### Method Chaining (Fluent)

```javascript
const result = await client.email()
  .to('user@example.com')
  .from('noreply@yourapp.com')
  .subject('Welcome to our service')
  .html('<h1>Welcome!</h1><p>Thanks for signing up.</p>')
  .scheduleAt(new Date(Date.now() + 3600000))
  .send();
```

## 📅 Email Scheduling

Schedule emails to be sent at any future date and time:

```javascript
// Schedule for a specific date
const scheduledTime = new Date('2024-12-25T09:00:00.000Z');

await client.sendEmail({
  to: 'customer@example.com',
  from: 'marketing@yourapp.com',
  subject: 'Merry Christmas!',
  text: 'Wishing you a wonderful holiday season.',
  scheduledAt: scheduledTime
});

// Or schedule relative to now
const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);

await client.email()
  .to('user@example.com')
  .from('app@yourcompany.com')
  .subject('Your order is ready!')
  .text('Your order #12345 is ready for pickup.')
  .scheduleAt(oneHourLater)
  .send();
```

## 🐛 Debug Mode

Enable debug mode during development to see detailed request logs:

```javascript
const client = new Mailblock('your-api-key', { debug: true });

// Now you'll see detailed logs for all API calls
await client.sendEmail({
  to: 'test@example.com',
  from: 'dev@yourapp.com',
  subject: 'Debug Test',
  text: 'Testing with debug mode enabled'
});

// Console output:
// [2024-01-15T10:30:45.123Z] Mailblock INFO: Initiating email send request
// [2024-01-15T10:30:45.124Z] Mailblock DEBUG: Sending API request
// [2024-01-15T10:30:45.369Z] Mailblock DEBUG: API response received
// [2024-01-15T10:30:45.370Z] Mailblock INFO: Email sent successfully
```

## 🔒 Error Handling

Mailblock uses a consistent response format that makes error handling straightforward:

```javascript
const result = await client.sendEmail({
  to: 'invalid-email', // This will cause a validation error
  from: 'sender@yourapp.com',
  subject: 'Test',
  text: 'Test message'
});

if (!result.success) {
  console.log('Error Type:', result.errorType);     // 'VALIDATION_ERROR'
  console.log('Error Message:', result.error);     // 'Invalid recipient email address: invalid-email'
  console.log('Suggestion:', result.suggestion);   // 'Check your request parameters and try again'
  console.log('Request ID:', result.requestId);    // 'req_abc123' (for support)
}
```

## 💎 TypeScript Support

Mailblock includes full TypeScript support out of the box:

```typescript
import Mailblock, { EmailOptions, EmailResponse } from 'mailblock';

const client: Mailblock = new Mailblock('your-api-key');

const emailOptions: EmailOptions = {
  to: 'recipient@example.com',
  from: 'sender@yourapp.com',
  subject: 'TypeScript Email',
  text: 'This email was sent with full type safety!'
};

const result: EmailResponse = await client.sendEmail(emailOptions);
```

## 📚 Documentation

- **[Getting Started](docs/getting-started.md)** - Complete setup guide
- **[Prerequisites](docs/prerequisites.md)** - Account setup and API key generation
- **[API Reference](docs/api-reference.md)** - Complete technical reference
- **[Quick Start](QUICKSTART.md)** - Send your first email in 2 minutes

## 🆚 Why Choose Mailblock?

| Feature | Mailblock | Others |
|---------|-----------|--------|
| **Setup Time** | 2 minutes | 30+ minutes |
| **API Design** | Method chaining + object style | Object style only |
| **TypeScript** | Built-in, full support | Add-on or limited |
| **Scheduling** | Native support | External service needed |
| **Debug Mode** | Built-in logging | Manual implementation |
| **Documentation** | Developer-focused | Marketing-heavy |
| **Pricing** | Pay per email | Monthly fees + overages |

## 🚀 Coming Soon

- **Email templates** - Pre-built responsive templates
- **Bulk sending** - Send to multiple recipients efficiently  
- **Webhooks** - Real-time delivery notifications
- **Analytics** - Open rates, click tracking, bounces
- **Attachments** - Send files with your emails

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **📖 Documentation**: [Full docs](docs/)
- **💬 Issues**: [GitHub Issues](https://github.com/your-org/mailblock-sdk/issues)
- **📧 Email**: support@mailblock.de
- **🌐 Website**: [mailblock.de](https://www.mailblock.de)

## 🏷️ Beta Access

Mailblock is currently in beta. [Sign up for free access](https://www.mailblock.de/#beta) and help us build the future of email APIs.

---

**Made with ❤️ for developers who just want to send emails without the hassle.**