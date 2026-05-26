# Bufferbloat.org architecture

This project is intentionally simple.

The goal is not to build a generic speed test. The goal is to explain bufferbloat in a way normal people can immediately understand.

The frontend is a Next.js app deployed on Vercel.

The actual test traffic is generated through:
- static files hosted on Cloudflare R2
- a lightweight upload worker running on Cloudflare Workers

The measurement logic runs locally in the browser.

---

# Main files

## app/page.tsx

Landing page.

This is the narrative and educational entry point of the project.

---

## app/test/page.tsx

Main test UI.

Responsible only for:
- rendering
- progress states
- displaying measurements
- diagnosis presentation

The actual networking logic should stay outside this file.

---

## lib/bufferbloat-test.ts

Core measurement engine.

Handles:
- latency probing
- download pressure generation
- upload pressure generation
- throughput estimation
- grading logic
- progress updates

This is the heart of the project.

---

## lib/test-copy.ts

Centralized messaging and diagnosis copy.

Keeps wording editable without touching test logic.

---

# Cloudflare infrastructure

## upload-sink/

Independent Cloudflare Worker.

Receives disposable upload traffic used during upload testing.

This exists separately so uploads do not hit the Next.js server.

Includes:
- CORS handling
- simple in-memory rate limiting
- upload size limits

---

# Static test files

Hosted on Cloudflare R2 behind:

https://files.bufferbloat.org

Current files:
- ping.txt
- 10mb.bin
- 100mb.bin

The download files should stay incompressible.

---

# Design philosophy

The UI should feel:
- technical but understandable
- trustworthy
- restrained
- informative
- slightly instrument-like

Avoid:
- gamer aesthetics
- glossy startup gradients
- networking jargon overload
- fake precision
- "AI assistant" tone

The important concept is:

Fast internet can still feel bad if latency spikes under load.

That is what the project exists to demonstrate.
