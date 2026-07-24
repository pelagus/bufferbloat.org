# Architecture

bufferbloat.org is a small Next.js App Router application for the public
browser-based bufferbloat test.

## Test phases

The browser performs:

1. Session warm-up with unscored ping, download, and upload preparation
2. Quiet-line latency measurement
3. Download pressure latency measurement
4. Upload pressure latency measurement

The final result combines:
- baseline latency
- loaded latency
- throughput
- bufferbloat grade
- diagnosis text

Warm-up latency samples can be visualized during the live run, but they are not
included in the reported medians, result chart, or grade.

## Important files

### lib/bufferbloat-test.ts

Core browser-side measurement engine.

Responsible for:
- ping sampling
- download load generation
- upload load generation
- median calculations
- live updates

### app/test/TestPageClient.tsx

Main orchestration UI.

Responsible for:
- running state
- rendering test phases
- diagnosis rendering
- adaptive layout behavior
- live and result chart rendering

### app/test/page.tsx

Route-level metadata and server entry point for the public `/test` page.

### app/styles/

CSS split by concern:
- admin.css
- legacy.css
- layout.css
- home.css
- test.css
- measurement.css
- measurement-runtime.css
- measurement-results.css
- measurement-signup.css
- nav.css
- responsive.css

## UX constraints

Important:
- avoid layout jumps
- keep mobile stable
- keep three phases visible on mobile
- preserve scientific instrument aesthetic
- avoid fake precision

## Deployment

- Vercel hosting
- Cloudflare DNS/proxy
- canonical domain:
  https://bufferbloat.org
