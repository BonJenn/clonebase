@AGENTS.md

# Commit rules

- Never include "Co-Authored-By" lines referencing Claude or Anthropic in commits
- Never mention Claude, AI, or Anthropic in commit messages or code comments
- Commits should read as if written by a human developer

---

# Project: Clonebase

A web-based platform where users can build/publish web apps, share them as templates in a marketplace, and allow other users to clone them instantly — each clone gets its own subdomain, isolated data, config, and API keys.

## Core Product Requirements

### App Templates
- Users create and publish "App Templates" containing UI (React/Next.js), backend logic (API routes/server actions), database schema, and integration definitions (OpenAI, Stripe, etc.)
- Templates can be public (marketplace) or private

### Cloning / Remixing
- Cloning creates a new App Instance, tenant, isolated database records, and subdomain (e.g., johns-tacos.clonebase.com)
- Never copy secrets or API keys from the original template

### Subdomain Routing
- Wildcard subdomains (*.clonebase.com), middleware resolves tenant/app by hostname
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

- **Frontend:** Next.js (App Router), TypeScript, Tailwind
- **Backend:** Next.js server actions + API routes, Supabase (Postgres)
- **Auth:** Supabase Auth
- **Database:** Postgres (multi-tenant design)
- **Hosting:** Vercel
- **Functions:** Supabase Edge Functions (for secure API calls)

## Security Requirements

- Never expose API keys to client
- Environment variables for platform secrets
- Encrypt all user-provided API keys
- Enforce RLS policies strictly
- Validate all inputs server-side
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

## Phase 3 — Payments & Publishing
- [ ] Stripe integration for paid templates
- [ ] Template pricing UI (free / one-time purchase)
- [ ] Purchase flow + access control on clone
- [ ] Creator earnings dashboard (basic)
- [ ] Webhook handler for Stripe events

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
- [ ] Email notifications (infrastructure ready, needs email provider integration)
- [ ] Error tracking + monitoring (needs Sentry or similar service setup)

## Phase 6 — Growth
- [ ] Template forking (clone a clone's customizations)
- [ ] Collaborative editing (invite team members to a tenant)
- [ ] SaaS revenue share model (recurring billing per tenant)
- [ ] Public API for programmatic template creation
- [ ] CLI tool for local template development
