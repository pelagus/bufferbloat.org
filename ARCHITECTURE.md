# Architecture

bufferbloat.org is a small Next.js App Router application focused on measuring latency under network load.

## Test phases

The browser performs:

1. Quiet-line latency measurement
2. Download pressure latency measurement
3. Upload pressure latency measurement

The final result combines:
- baseline latency
- loaded latency
- throughput
- responsiveness grade
- diagnosis text

## Important files

### lib/bufferbloat-test.ts

Core browser-side measurement engine.

Responsible for:
- ping sampling
- download load generation
- upload load generation
- median calculations
- live updates

### app/test/page.tsx

Main orchestration UI.

Responsible for:
- running state
- rendering test phases
- diagnosis rendering
- responsive behavior

### app/styles/

CSS split by concern:
- legacy.css
- home.css
- test.css
- responsive.css
- nav.css

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
