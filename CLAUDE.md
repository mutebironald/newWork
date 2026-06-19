@AGENTS.md

# Build Specification

All implementation must strictly follow the spec docs in the folders below. These are the authoritative source of truth for product requirements, data model, AI workflows, payments, evidence, and QA.

## Spec doc locations (already copied into this repo)

- `product/` — 00 Executive Handoff, 01 Product Requirements, 06 Toolchain Execution Plan, 07 Sprint Plan, 10 Launch Plan, 11 Implementation Checklist
- `engineering/` — 02 Technical Architecture, 05 Data Model & API Spec, event taxonomy, Firestore schemas, OpenAPI stub, repo structure
- `ai/` — 03 AI-Native Operations Spec, Gemini prompts
- `payments/` — 04 Payment Gateway Spec
- `qa/` — 08 QA, Security & Privacy
- `evidence/` — 09 XPRIZE Evidence Dashboard Spec
- `design/` — Stitch design prompts, visuals

## Stack (non-negotiable per spec)

| Layer | Tool |
|---|---|
| Frontend | Next.js + React + TypeScript |
| Auth | Firebase Authentication |
| Database | Cloud Firestore (via `lib/firebase.ts`) |
| AI | Gemini API via `@google/genai` |
| Payments | Stripe Checkout + Webhooks |
| File storage | Cloud Storage (or mock for local dev) |

**Never use Prisma or PostgreSQL** — the spec mandates Firestore. The `lib/db.ts` Prisma client is a legacy artifact; all routes must use `db` from `@/lib/firebase`.

## Firestore collections (canonical per 05_DATA_MODEL_AND_API_SPEC.md)

- `users` — auth and role records
- `agent_profiles` — agent skill profiles
- `cohorts` — program cohorts
- `organizations` — NGOs, schools, partners
- `org_members` — org membership
- `cohort_enrollments` — agent-cohort enrollment
- `merchants` — informal merchant records
- `service_offers` — AI-generated service offer cards per agent
- `work_episodes` — paid work episode records (state machine: planned → delivered → paid → verified)
- `proof_items` — proof uploads with AI verification status
- `merchant_confirmations` — merchant confirmation of work
- `payments` — service payment records
- `income_ledger` — agent income records
- `ai_workflow_logs` — every AI call logged here
- `fraud_flags` — AI-detected fraud flags
- `org_subscriptions` — Stripe subscription records
- `impact_reports` — AI-generated reports
- `opportunities` — org-created job postings (platform extension)

## AI workflow types (canonical per 03_AI_NATIVE_OPERATIONS_SPEC.md)

Spec-required: `skill_profile | offer_generation | extraction | outreach | report | safety_check`
Platform-added: `proof_verification | opportunity_matching | career_profile | program_monitoring | fraud_detection | agent_recommendation | risk_assessment`

## API routes (per 05_DATA_MODEL_AND_API_SPEC.md)

### AI Work Designer
- `POST /api/ai/service-offers` — generate 3 merchant service offer cards
- `POST /api/ai/outreach-pack` — generate outreach scripts
- `POST /api/ai/extract-artifact` — multimodal receipt/ledger extraction
- `POST /api/ai/merchant-summary` — weekly merchant business summary
- `POST /api/ai/next-action` — next action recommendation for agent
- `POST /api/ai/career-profile/[agentId]` — AI career profile (maps to `skill_profile`)
- `POST /api/ai/run-all` — batch run all AI workflows

### Evidence
- `GET /api/evidence/xprize-snapshot` — JSON export for judges
- `GET /api/evidence/dashboard` — aggregated platform metrics
- `GET /api/evidence/cohort/[id]` — cohort impact export

### Payments (per 04_PAYMENT_GATEWAY_SPEC.md)
- `POST /api/payments/create-checkout-session`
- `POST /api/payments/stripe-webhook`
- Revenue split: 85% agent / 15% platform for merchant service payments

## North-star metric
**Verified paid work episodes** — episodes reaching `merchant_confirmed` or higher.

## Implementation principle (from 00_EXECUTIVE_HANDOFF.md)
Every feature must support one of:
1. A user earns money.
2. An organization proves work creation.
3. AI runs a material operational step.
