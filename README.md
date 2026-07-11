# bufferbloat.org

An open-source project dedicated to measuring internet responsiveness.

Most internet speed tests measure **throughput**: how many megabits per second your connection can deliver. Bufferbloat.org measures something different: how responsive your connection remains while it is under load.

**Website:** https://bufferbloat.org

---

## Why this exists

I built Bufferbloat.org because I couldn't find the tool I wanted.

Most people are told to judge their internet connection by download speed. More technical users know to look at ping. Both are useful, but neither fully explains a question millions of people ask every day:

> **"Why is my internet still laggy if I have 500 Mbps?"**

A connection can deliver hundreds of megabits per second while video calls freeze, games stutter, websites hesitate and remote desktops become frustrating to use. The problem is often not bandwidth, but **latency under load**.

Networking researchers have understood this for years. Yet, despite excellent research and commercial products, I was surprised by how few open, transparent and browser-based tools existed to measure it.

I wanted a tool whose methodology anyone could inspect, whose implementation anyone could verify, and whose measurements anyone could improve.

So I built one.

---

## What is bufferbloat?

Bufferbloat is excessive latency caused by oversized or overloaded network queues.

When a connection becomes busy, packets can spend too long waiting before being transmitted. Throughput may remain high while responsiveness deteriorates dramatically.

That's why a connection can achieve an excellent speed test result and still perform poorly during video calls, online gaming, browsing or other interactive applications.

This project focuses on measuring **internet responsiveness**, not just throughput.

---

## Why open source?

Internet measurement should be transparent.

Measurements should be reproducible. Methodology should be public. Implementation should never be a black box.

Bufferbloat.org is built around those principles.

The project provides:

- Open measurement methodology
- Inspectable source code
- Browser-based testing
- Privacy-first design
- Reproducible measurements
- Community-driven development

---

## Live test

![Live bufferbloat test interface](docs/live-test-optimized.gif)

---

## What the test measures

The browser performs three measurement phases:

1. Quiet-line latency
2. Download latency under load
3. Upload latency under load

Results include:

- Median idle latency
- Median download latency under load
- Median upload latency under load
- Download throughput
- Upload throughput
- Overall responsiveness grade
- Plain-language diagnosis

---

## Why responsiveness matters

Throughput tells you **how much** data your connection can move.

Responsiveness tells you **how quickly** your connection continues to react while moving that data.

For many everyday applications, responsiveness has a greater impact on user experience than peak bandwidth.

Examples include:

- Video conferencing
- Online gaming
- Web browsing
- Remote desktop
- Voice calls
- Cloud development
- Streaming while other devices are active

---

## Features

- Browser-based latency-under-load measurement
- Open-source measurement engine
- Download and upload stress testing
- Median latency reporting
- Real-time visualisation
- Mobile-friendly interface
- Light and dark mode
- Public measurement methodology

---

## Local development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

Build for production:

```bash
npm run build
```

---

## Technology

- Next.js App Router
- TypeScript
- Cloudflare
- Vercel

---

## Contributing

Contributions are welcome.

Areas of particular interest include:

- Measurement methodology
- Browser compatibility
- Accessibility
- Documentation
- Privacy-preserving diagnostics
- Visualisation and reporting

If you disagree with the methodology, find a bug, or have an idea for improving the measurements, please open an issue or submit a pull request.

---

## Privacy

The core measurement runs entirely in the browser.

Optional email signup data is stored separately and should never be committed:

```
data/signups.json
```

---

## About the author

Bufferbloat.org is created and maintained by **Emanuele Brandi**.

I've spent more than twenty years building products that shape how people experience the web, including work on Google Search, AdSense and Firefox. Throughout my career, I've cared deeply about the health of the open web and about building technology that is transparent, useful and easy to understand.

Bufferbloat.org is an independent open-source project created because I believe internet responsiveness deserves the same attention as internet speed, and because the tools we use to measure the web should themselves be open to inspection and improvement.

- Website: https://bufferbloat.org
- GitHub: https://github.com/pelagus
- LinkedIn: https://linkedin.com/in/ebrandi

---

## License

MIT
