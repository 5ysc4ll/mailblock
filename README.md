# Mailblock

Mailblock is a lightweight JavaScript SDK for scheduling and sending emails via the Mailblock API.

## 🚀 Installation

```
npm install mailblock
```

## 🛠️ Usage

```js
import Mailblock from "mailblock";

const mailblock = new Mailblock();

await mailblock.sendEmail({
  to: "recipient@example.com",
  subject: "Hello from Mailblock",
  content: "This is a test email.",
});
```

## 📦 Features

- Simple and lightweight
- Queues email jobs to Redis
- Server-friendly, easy to integrate
- Works great with Node.js environments

## 📝 License

MIT © Block Forge
