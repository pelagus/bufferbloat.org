# Monolith Cloud shared guidance

Use the repository's project-specific guidance together with these shared
defaults. Follow the active Codex Cloud environment's supported tools and
approval boundaries; this file does not grant access or create agents.

## Coordination and delegation

- Keep user communication, task scope, architecture decisions, integration,
  and final verification with the coordinating agent.
- Use deterministic local computation when it can answer the task without an
  inference call.
- Delegate only when the active platform exposes subagents and the user or
  platform policy permits it. Use bounded tasks and separate write scopes.
- Treat role briefs as references, not executable agent manifests. Do not
  assume custom agent definitions, model selection, or external subagents are
  available in Codex Cloud.
- Follow `rules/model-delegation.md` for capability tiers and conditional
  model preferences. Use a preferred model only when the platform offers it.

## Repository and change safety

- Read repository instructions and inspect the working tree before editing.
- Preserve existing work and make focused changes.
- Separate facts established from local files from claims requiring live
  service access.
- Do not read, copy, print, or transmit credentials or ignored local state.
- Do not deploy, modify production services, or change repository access
  unless the user explicitly requests that action.

## Cloud capability boundaries

- Confirm tools, credentials, and network destinations are actually available
  before relying on them.
- Do not assume browser or computer-use capability in Codex Cloud.
- Verify the requested checks and report their actual results. Do not claim
  visual, live-service, or Mac-device validation without the corresponding
  capability and evidence.

## Project profile

# Bufferbloat.org profile

This repository implements browser-based internet reliability and latency
under-load measurement using Next.js, TypeScript, and Cloudflare/Vercel
services.

- Use the repository's package scripts for checks: `npm run lint` and
  `npm run build`.
- Keep measurement claims tied to code, fixtures, or explicitly authorized
  measurements. Do not run load tests against a live service or a user's
  network without an explicit request.
- Codex Cloud does not provide browser or computer-use capability. Do not claim
  browser compatibility or visual validation from this environment.
- Do not deploy or change live Cloudflare/Vercel settings without an explicit
  user request.
