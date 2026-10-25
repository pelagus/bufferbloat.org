---
name: bufferbloat
description: Use for implementation and review of Bufferbloat.org measurement logic, latency reporting, or its Next.js interface. Do not use for live-network testing or deployment.
---

# Bufferbloat.org workflow

1. Inspect the measurement code, existing fixtures, and relevant tests before
   changing methodology or reporting.
2. Keep observed measurements separate from simulated or fixture results.
3. Use `npm run lint` and `npm run build` for applicable changes.
4. Do not run load tests against a live service or a user's network unless
   explicitly requested.
5. Codex Cloud does not provide browser/computer use. Do not claim browser or
   visual validation without evidence from a supported environment.
6. Do not deploy or change live infrastructure without an explicit request.
