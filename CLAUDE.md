@AGENTS.md

# Commit rules

- Never include "Co-Authored-By" lines referencing Claude or Anthropic in commits
- Never mention Claude, AI, or Anthropic in commit messages or code comments
- Commits should read as if written by a human developer

---

# Project: Clonebase

A web-based platform where users **vibecode web apps using plain English**, publish them to a marketplace, and allow others to clone them instantly — each clone gets its own subdomain, isolated data, config, and API keys.

**The core loop:** Describe an app → AI generates it → Preview and iterate → Publish → Others clone it.

## Core Product Requirements

### Vibecoding Sandbox (PRIMARY FEATURE)
- Users describe apps in plain English via a chat interface
- AI generates working template code (React components, admin panel, optional API handlers)
- Live preview in a sandboxed iframe shows the app as it's being built
- Users iterate conversationally: "add dark mode", "make the cards bigger"
- Generated code is stored in the database (not as files on disk)
- When satisfied, users publish to the marketplace

### App Templates
- Templates can be vibecoded (AI-generated) or hand-built (static files)
- A template includes: UI (React/Next.js), admin panel, backend logic (API routes), integration definitions
- Templates can be public (marketplace) or private

### Cloning / Remixing
- Cloning creates a new App Instance, tenant, isolated database records, and subdomain (e.g., johns-tacos.clonebase.com)
- Never copy secrets or API keys from the original template
- Works identically for vibecoded and static templates

### Subdomain Routing
- Wildcard subdomains (*.clonebase.com), proxy resolves tenant/app by hostname
- Custom domain support (CNAME mapping with DNS verification)
- In dev, use `?tenant=slug` query param

### Multi-Tenancy
- Row-level security (RLS) with strict tenant_id partitioning
- Prevent cross-tenant data leaks at all costs

### Integrations & API Keys
- Types: platform_managed, user_provided, optional
- API keys NEVER exposed to frontend, encrypted at rest
- Server-side functions call external APIs
- After cloning, integrations marked "not connected"

### Monetization
- Free and paid templates (one-time purchase via Stripe)
- Creator payouts (designed, not fully implemented yet)

### Deployment
- All apps hosted within the platform, instantly live, no manual setup

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind
- **Backend:** Next.js server actions + API routes, Supabase (Postgres)
- **Auth:** Supabase Auth
- **Database:** Postgres (multi-tenant design)
- **Hosting:** Vercel
- **Code Generation:** Anthropic API for vibecoding
- **Transpilation:** sucrase (pure JS, TSX → JS for runtime eval)

## Security Requirements

- Never expose API keys to client
- Environment variables for platform secrets
- Encrypt all user-provided API keys
- Enforce RLS policies strictly
- Validate all inputs server-side
- Preview sandbox: iframe with no network access, no parent window access
- Generated code validated via static analysis before publishing
- Prevent template creators from embedding malicious code

---

# Roadmap

## Phase 1 — Core Platform (DONE)
- [x] Auth (signup/login via Supabase)
- [x] Create app template (basic metadata)
- [x] Marketplace listing page
- [x] Clone template → create app instance
- [x] Subdomain routing via proxy.ts
- [x] Multi-tenant layout + data isolation
- [x] Template renderer (client-side registry)
- [x] First template: AI Support Bot

## Phase 2 — Integrations & Stability (DONE)
- [x] Integration system (API key management)
- [x] Encrypted secret storage (AES-256-GCM)
- [x] Setup wizard after cloning
- [x] Server-side integration proxy (callIntegration)
- [x] Fix memory leaks (singleton clients, template caching)
- [x] Fix server-only code leaking into client bundles

## Phase 3 — Payments & Publishing (DONE)
- [x] Stripe checkout for paid templates
- [x] Template pricing UI (free / one-time purchase)
- [x] Purchase verification on clone
- [x] Creator earnings dashboard
- [x] Webhook handler for Stripe events

## Phase 4 — Template Ecosystem (DONE)
- [x] Template export (standalone Next.js project download)
- [x] Template versioning (version + changelog fields on templates)
- [x] Template categories + search/filtering + sort in marketplace
- [x] Template ratings/reviews (with auto-aggregation trigger)
- [x] Second template: SaaS Waitlist page
- [x] Third template: Link-in-Bio page

## Phase 5 — Production Readiness (DONE)
- [x] Custom domain support (CNAME mapping, DNS verification, proxy resolution with cache)
- [x] Rate limiting on API routes and tenant pages (in-memory sliding window)
- [x] Abuse prevention (security headers, rate limiting, SSRF protection)
- [x] Analytics dashboard for template creators (page views, API calls, daily breakdown)
- [x] Analytics tracking (auto page views in tenant layout, API call logging)
- [x] Error boundaries (root + tenant app error.tsx)

## Phase 6 — Vibecoding Sandbox
- [ ] DB migration: generated_templates table, source_type on app_templates
- [ ] System prompt with SDK docs, template patterns, structured output format
- [ ] Code transpiler (sucrase: TSX → JS with import rewriting)
- [ ] Code validator (static analysis before publish)
- [ ] Builder API: generate (streaming), transpile, publish endpoints
- [ ] Builder UI: landing page, split-pane workspace, chat panel
- [ ] Preview sandbox: iframe with SDK shims, postMessage protocol
- [ ] Live preview component with error reporting
- [ ] Publish flow with validation + marketplace listing
- [ ] Production runtime: dynamic template loader from DB
- [ ] Dynamic renderer: evaluate transpiled code with real SDK hooks
- [ ] Dynamic API handler loading for generated templates
- [ ] Dashboard integration: "Build an App" button, edit links

## Phase 7 — Growth
- [ ] Template forking (clone a clone's customizations)
- [ ] Collaborative editing (invite team members to a tenant)
- [ ] SaaS revenue share model (recurring billing per tenant)
- [ ] Public API for programmatic template creation
- [ ] Email notifications (needs email provider integration)
- [ ] Error tracking + monitoring (needs Sentry or similar)
