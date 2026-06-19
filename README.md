# NewWork Full Build-Out Package

## Product
**NewWork** is a work-creation operating system that helps under-employed youth become AI-assisted field agents for informal merchants.

Agents use NewWork to digitize receipts, summarize sales, prepare WhatsApp commerce materials, track renewal reminders, generate customer follow-ups, log paid work episodes, capture proof-of-work, and create partner-ready impact reports.

## Core category
**Work Creation Engine**

## Primary wedge
**NewWork Field Agents for informal merchants**

## North-star metric
**Verified paid work episodes completed by NewWork agents**

## Who this package is for
This package is written for the software team, product lead, design lead, AI prototyping lead, launch lead, and XPRIZE evidence lead.

## Contents

| Folder or file | Purpose |
|---|---|
| `00_EXECUTIVE_HANDOFF.md` | Product summary, build priority, and implementation boundary |
| `01_PRODUCT_REQUIREMENTS_SPEC.md` | Full PRD and MVP scope |
| `02_TECHNICAL_ARCHITECTURE.md` | System architecture and deployment plan |
| `03_AI_NATIVE_OPERATIONS_SPEC.md` | AI agents, prompts, policies, and decision loops |
| `04_PAYMENT_GATEWAY_SPEC.md` | Stripe, mobile money, revenue split, and evidence ledger |
| `05_DATA_MODEL_AND_API_SPEC.md` | Firestore collections, API routes, state machines |
| `06_TOOLCHAIN_EXECUTION_PLAN.md` | Gemini App, AI Studio, Stitch, Antigravity, Cloud, Flow, Pomelli workflows |
| `07_BUILD_BACKLOG_AND_SPRINT_PLAN.md` | Milestones, tickets, acceptance criteria |
| `08_QA_SECURITY_PRIVACY.md` | Test plan, safety, privacy, abuse prevention |
| `09_XPRIZE_EVIDENCE_DASHBOARD_SPEC.md` | Judge-facing evidence console |
| `10_LAUNCH_AND_GROWTH_PLAN.md` | Launch plan, partner motion, campaigns, video brief |
| `11_IMPLEMENTATION_CHECKLIST.md` | Final software team checklist |
| `prompts/` | Copy-paste prompts for each tool |
| `schemas/` | Data schemas and API contract starters |
| `visuals/` | SVG and PNG architecture visuals |
| `launch_assets/` | Website copy, video script, social copy, partner pitch |
| `engineering/` | Environment variables, repo structure, event taxonomy |

## Recommended implementation posture
Build the cohort-first MVP first, with a lightweight direct-user path. The B2B2C model is stronger than pure consumer because organizations have the budget and need measurable income-creation evidence.

## Build sequence
1. Cohort admin dashboard
2. Agent onboarding and skill intake
3. Merchant onboarding
4. AI Work Designer flow
5. Service offer generation
6. WhatsApp-ready outreach and merchant messages
7. Lead and paid work episode tracking
8. Proof upload and verification statuses
9. Stripe payment flow
10. Evidence dashboard mapped to judging criteria

## External reference links
These are included for the team to verify implementation paths and current capabilities:

- Google AI Studio and Gemini API: https://ai.google.dev/aistudio
- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Stitch: https://stitch.withgoogle.com/
- Google Antigravity: https://antigravity.google/
- Cloud Run docs: https://cloud.google.com/run/docs
- Firebase Authentication docs: https://firebase.google.com/docs/auth
- Flow: https://labs.google/flow/about
- Pomelli: https://labs.google.com/pomelli/about
- Stripe Checkout docs: https://docs.stripe.com/payments/checkout
- Stripe webhooks docs: https://docs.stripe.com/webhooks
- WhatsApp Business Platform docs: https://developers.facebook.com/docs/whatsapp

## Quality bar
Do not ship NewWork as a generic AI idea generator. It must operate as a work-creation system with structured workflow, payments, proof capture, and measurable economic outcomes.
