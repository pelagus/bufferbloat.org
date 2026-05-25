# bufferbloat.org

bufferbloat.org is an attempt to build a browser-based test for a problem most people experience but very few tools explain properly:

an internet connection that looks fast, but starts feeling terrible the moment it gets busy.

The project focuses on responsiveness under load rather than raw bandwidth numbers. The goal is not to build another speed test, but something closer to a diagnostic instrument that explains why video calls freeze, games lag, or pages stop responding while someone else is uploading photos or downloading updates.

The frontend is built with Next.js and currently lives mostly under `/test`.

Download pressure is generated using large incompressible binary payloads hosted on Cloudflare R2. Upload pressure is generated through a Cloudflare Worker endpoint that accepts and discards temporary upload data without storing anything.

The current architecture looks roughly like this:

```text
browser
  ↓
latency sampling
  ↓
download pressure from R2
  ↓
upload pressure to Worker
  ↓
diagnosis

The project intentionally tries to avoid a lot of the typical networking language around bufferbloat. Most users do not care about queue disciplines or shaping algorithms. They care that their connection feels unstable during normal use.

The UI and wording try to explain the issue in terms of lived experience instead.

The measurement side is still evolving. Browser-based testing has real limitations: background tab throttling, Wi-Fi instability, browser scheduling, other devices on the network, and timing precision all affect results. The goal is not laboratory-grade accuracy, but believable and operationally useful measurements.

Current infrastructure:

Next.js frontend on Vercel
Cloudflare R2 for download payloads
Cloudflare Workers for upload testing

The upload endpoint currently includes:

Origin validation
upload size limits
basic per-IP rate limiting
no persistent storage

The current R2 payload set:

10mb.bin
50mb.bin
100mb.bin
250mb.bin

Local development:

npm install
npm run dev

This project is still experimental and evolving quickly.
