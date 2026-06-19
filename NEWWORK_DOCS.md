# NewWork — Complete Platform Documentation

> AI-native workforce activation and income-verification platform.  
> Built with Next.js (App Router), Firebase/Firestore, Firebase Auth, and Gemini AI (gemini-2.5-flash).  
> **All spec docs are in the repo — see `product/`, `engineering/`, `ai/`, `payments/`, `qa/`, `evidence/`**

---

## Table of Contents

1. [What is NewWork? (Newbie Explanation)](#1-what-is-newwork-newbie-explanation)
2. [Key Highlights](#2-key-highlights)
3. [What Has Been Built — Complete Inventory](#3-what-has-been-built--complete-inventory)
4. [Expected Behaviour — Feature by Feature](#4-expected-behaviour--feature-by-feature)
5. [Code Architecture — Deep Dive](#5-code-architecture--deep-dive)
6. [Firestore Data Model Explained](#6-firestore-data-model-explained)
7. [AI Engine Explained](#7-ai-engine-explained)
8. [Running the Project](#8-running-the-project)
9. [Assessment Corrections Index](#9-assessment-corrections-index)

---

## 1. What is NewWork? (Newbie Explanation)

### The Problem in Plain English

Imagine an NGO called "Central Youth Fund." Every year they spend $50,000 running a programme that trains 100 young people in digital skills. At the end of the year, their donor asks: **"Did your participants actually earn any money from this training?"**

The NGO cannot answer confidently. They have attendance sheets, certificates, and workshop photos — but **no proof that a single participant actually earned a single shilling.**

This is the problem NewWork solves.

### What NewWork Does

NewWork connects three groups of people:

**1. Agents (Workers)**
Young people, freelancers, or community workers who want to earn money. They register on NewWork with their skills — photography, sales, data entry, merchant visits, etc. AI analyses their skills and generates tailored service offers they can pitch to merchants.

**2. Merchants (Businesses)**
Local shops, pharmacies, restaurants, and market stalls that need small digital services — receipt digitization, WhatsApp catalogues, weekly sales summaries, customer follow-up messages. Agents deliver these services directly.

**3. Organizations (NGOs, Schools, Government)**
They fund the whole thing. They pay NewWork a subscription fee to run their employment programme through the platform. Instead of just measuring "did participants attend?" they can now measure "did participants earn money?"

### How a Single Transaction Works — Start to Finish

```
1. Agent registers and completes the skill intake wizard (/agents/[id]/onboard)
   → Enters location, skills, education, tools available

2. AI generates a service offer card (/api/ai/service-offers)
   → "WhatsApp Product Catalog — $5–$15 — for shops, food stalls, beauty services"
   → "Receipt Digitization — $2–$8 — for shops, markets"
   → "Customer Follow-Up Pack — $3–$10 — for any merchant"

3. Agent selects an offer and finds a merchant to pitch it to

4. Agent generates outreach scripts (/api/ai/outreach-pack)
   → AI writes intro script, follow-up script, objection responses

5. Agent visits a merchant and delivers the service
   → E.g., photographs products, AI generates WhatsApp catalog text

6. Agent logs the paid work episode (/work-episodes)
   → Records: merchant, service type, amount paid, payment method

7. Agent uploads proof (screenshot, photo, PDF)
   → AI reviews the proof automatically — no human involved
   → "Screenshot matches catalog creation task. 91% confidence. Accepted."

8. Merchant confirms via phone: "Yes, Sarah completed this. 5 stars."

9. Income is logged at "merchant_confirmed" level in the income ledger
   → Note: merchant paid Sarah directly — NewWork never handles the money

10. The organization's dashboard now shows:
    → 1 verified work episode
    → Sarah Namukasa: UGX 25,000 earned
    → Merchant-confirmed income
```

Now the NGO can tell their donor: **"Our 50 participants completed 320 work episodes and earned a combined UGX 2.4 million in verified, merchant-confirmed income."**

### Why "AI-Native"?

Most software adds AI as a feature — a chatbot here, a suggestion there. NewWork is different: **AI runs the back-office operations.** There is no human reviewing every proof upload, manually matching workers to jobs, monitoring cohort health, or writing impact reports. The AI does all of that automatically.

What humans do: merchants confirm whether work actually happened (they are the external trust anchor), and organizations set programme goals. Everything else — proof verification, opportunity matching, fraud detection, cohort monitoring, report generation, career profiling, service offer design, outreach scripts, artifact extraction, merchant summaries — is AI-executed.

---

## 2. Key Highlights

### Revenue Model

The platform earns from **organization subscriptions only**. The 85/15 agent-fee split from the spec is a Phase 2 mechanic — it is not collected in MVP.

| Tier | Price | What's included |
|------|-------|-----------------|
| Free | $0 | Up to 1 cohort, no support |
| Cohort Pack | $499/mo | Up to 10 cohorts, full AI, reports |
| Partner | $999/mo | Unlimited cohorts, priority support, XPRIZE evidence reports |

**Money model:** Merchant pays agent directly (Mobile Money / cash). The platform is pure SaaS. It never holds, routes, or splits agent earnings.

### North-Star Metric

**Verified paid work episodes** — specifically, episodes reaching `merchant_confirmed` or higher. Self-reported income is tracked but is not the north-star count.

### What Makes This Different from a Spreadsheet

1. **Income has a verification level.** Every record is tagged: self-reported → proof uploaded → merchant confirmed → program verified.
2. **AI executes decisions.** The AI verifies, assigns, detects fraud, monitors cohorts, generates offers, writes reports. Autonomously.
3. **The status machine is enforced.** A work episode cannot jump from `planned` to `verified`. Every stage must be passed in order.
4. **Merchants are the external trust anchor.** Merchant confirmation is independent of the agent and the organization.
5. **Everything is auditable.** Every AI decision is logged with entity, workflow type, latency, tokens, and success status.

---

## 3. What Has Been Built — Complete Inventory

### Pages

| Route | Type | What It Does |
|-------|------|-------------|
| `/` | Redirect | → `/overview` if logged in, → `/login` if not |
| `/login` | Client | Email + password form |
| `/register` | Client | Role-selecting registration (Agent / Org Admin / Operator) |
| `/overview` | Server | Platform-wide metrics: parallel Firestore queries, AI autonomy rate, verification ladder, recent episodes |
| `/agents` | Server | Agent list with skills, income, AI-profiled badge, status |
| `/agents/[id]` | Server | Economic profile, AI career profile, **AI service offer cards**, work history |
| `/agents/[id]/onboard` | Client | Multi-step skill intake wizard: location, skills, tools, bio |
| `/merchants` | Server | Merchant directory |
| `/merchants/[id]` | Server | Merchant detail: stats, money model note, agents worked with, all episodes, feedback |
| `/merchants/[id]/service-workspace` | Server+Client | **Service template picker** + AI tools: outreach scripts, artifact extraction, merchant summary |
| `/programs` | Server | Organization list with subscription tier and cohort progress |
| `/programs/[id]` | Server | Full org detail: cohort targets vs actual, at-risk agents, agent roster |
| `/programs/[id]/cohorts/new` | Client | Create new cohort for an organization |
| `/opportunities` | Server | AI-matched opportunity marketplace |
| `/opportunities/new` | Client | Create opportunity form |
| `/work-episodes` | Server | All episodes with status pipeline visualization |
| `/work-episodes/[id]` | Server | Episode detail: status bar, advance button, dispute controls, proof items, merchant confirmation |
| `/income` | Server | Income ledger with verification ladder breakdown |
| `/ai` | Server | AI engine dashboard: governance map, workflow log, fraud flags, pending verification queue |
| `/reports` | Server | AI-generated impact reports |
| `/xprize` | Server | **XPRIZE judge dashboard**: Business Viability, AI-Native Operations, Category Impact, Decision Replay |

### API Routes

| Endpoint | Method(s) | Purpose |
|----------|-----------|---------|
| `/api/auth/login` | POST | Validate credentials → create Firebase session cookie |
| `/api/auth/register` | POST | Create user + Firebase Auth + Firestore records → session |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/auth/me` | GET | Return current session user |
| `/api/agents/[id]` | PATCH | Update agent profile fields |
| `/api/cohorts` | POST | Create a new cohort |
| `/api/opportunities` | GET, POST | List / create opportunities |
| `/api/organizations` | GET | List orgs for dropdowns |
| `/api/work-episodes` | POST | Log a new work episode |
| `/api/work-episodes/[id]/advance` | POST | Advance episode one step in the status machine |
| `/api/work-episodes/[id]/dispute` | POST, PATCH | Flag as disputed / resolve dispute |
| `/api/work-episodes/[id]/proof` | POST | Upload proof item |
| `/api/payments/create-checkout-session` | POST | Create Stripe checkout session |
| `/api/payments/stripe-webhook` | POST | Handle Stripe webhook events |
| `/api/payments/mock-checkout-success` | POST | Dev mock for checkout success |
| **AI Work Designer** | | |
| `/api/ai/service-offers` | POST | Generate 3 merchant service offer cards from agent profile |
| `/api/ai/outreach-pack` | POST | Generate outreach scripts for a merchant |
| `/api/ai/extract-artifact` | POST | Multimodal receipt/ledger/notes extraction |
| `/api/ai/merchant-summary` | POST | Generate weekly merchant business summary |
| `/api/ai/next-action` | POST | Income insight — recommend next action for agent |
| `/api/ai/career-profile/[agentId]` | POST | Generate AI career profile |
| `/api/ai/monitor-cohort/[cohortId]` | POST | Run cohort health assessment |
| `/api/ai/run-all` | POST | Batch run all pending AI workflows |
| **Evidence** | | |
| `/api/evidence/xprize-snapshot` | GET | JSON export for XPRIZE judges (spec §09 schema) |
| `/api/evidence/dashboard` | GET | Aggregated metrics across all 3 judging criteria |
| `/api/evidence/cohort/[id]` | GET | Per-cohort impact export |
| `/api/reports/generate` | POST | Generate AI impact report |

### Library Modules

| File | Purpose |
|------|---------|
| `lib/firebase.ts` | Firebase Admin SDK (Firestore + Auth + Storage) with full offline mock. Exports `db`, `auth`, `storage`. |
| `lib/auth.ts` | `getSession()` (reads cookie → verifies with Firebase Auth → fetches user from Firestore), `hashPassword()`, `createSession()` |
| `lib/ai.ts` | 11 AI workflow functions + `runAiWorkflow()` logging wrapper + Gemini client + offline mock responses |
| `lib/utils.ts` | Formatting helpers (`formatLocal`, `formatUsd`, `timeAgo`), badge/color maps, status machine, `calculateAiAutonomyRate()` |
| `lib/db.ts` | Legacy Prisma artifact — **not used by any route**. All routes use `db` from `lib/firebase.ts`. |

### Co-located Interactive Components

| File | Purpose |
|------|---------|
| `agents/[id]/generate-profile-button.tsx` | Triggers AI career profile → refreshes page |
| `agents/[id]/generate-offers-button.tsx` | Triggers AI service offer generation → refreshes page |
| `agents/[id]/edit-profile-button.tsx` | Inline profile edit form |
| `agents/[id]/onboard/page.tsx` | Multi-step skill intake wizard (Client Component) |
| `merchants/[id]/service-workspace/service-workspace-client.tsx` | AI tools panel (outreach, extraction, merchant summary) |
| `programs/[id]/monitor-cohort-button.tsx` | Triggers cohort health assessment → shows result inline |
| `work-episodes/log-episode-modal.tsx` | Modal for logging a new work episode |
| `work-episodes/[id]/status-advancer.tsx` | One-click stage advancement |
| `work-episodes/[id]/dispute-controls.tsx` | Flag as disputed / resolve dispute |
| `work-episodes/[id]/proof-uploader.tsx` | Proof file upload |
| `reports/generate-report-button.tsx` | Org + type dropdowns + generate button |
| `ai/run-ai-button.tsx` | Triggers all pending AI workflows |

---

## 4. Expected Behaviour — Feature by Feature

### 4.1 Authentication

**Registration** (`/register`)
- Select role: Agent, Organization Admin, or Operator
- Org Admins must provide their organization name — auto-creates the org and membership records in Firestore
- On submit: Firebase Auth user created, Firestore `users` doc created, session cookie set (7 days, httpOnly), redirect to `/overview`

**Login** (`/login`)
- Email + password — both wrong email and wrong password return the same error (no enumeration)
- Session token stored as `httpOnly` cookie named `session`

**Session guard**
- Every dashboard page calls `getSession()` server-side
- No valid session → immediate `redirect("/login")`
- `getSession()` wrapped in React's `cache()` — Firestore hit once per render tree

**Offline mode**
- If `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are all absent, the app uses a local filesystem mock at `.firebase_mock/`
- This means the app runs fully without any Firebase credentials during development

---

### 4.2 Agent Onboarding + AI Work Designer

**Skill intake wizard** (`/agents/[id]/onboard`)
Multi-step client-side form:
- Step 1: Location (district + specific location)
- Step 2: Personal info (gender, age, education)
- Step 3: Skills (toggle chips from 8 preset options)
- Step 4: Bio

On completion: PATCH to `/api/agents/[id]` to save profile, then POST to `/api/ai/career-profile/[agentId]` to trigger AI profile generation.

**Service offer generation** (`/agents/[id]` → Generate Service Offers button)
- Calls `POST /api/ai/service-offers` with the agent's skill profile
- Gemini returns 3 offer cards, each with: title, service type, merchant type, problem solved, agent tasks, AI support tasks, price range, tools needed, difficulty, first step
- Cards are saved to the `service_offers` Firestore collection and displayed on the agent profile page

---

### 4.3 Merchant Service Workspace (`/merchants/[id]/service-workspace`)

**Service template picker** — 6 cards matching the spec's MVP templates:
1. Receipt Digitization
2. Weekly Sales Summary
3. WhatsApp Product Catalog
4. Customer Follow-Up Pack
5. Renewal Reminder Tracker
6. Proof-of-Business Profile

Each card shows what the AI assists with and the delivery steps.

**AI tools panel (client-side)**

| Tool | Endpoint | Output |
|------|----------|--------|
| Generate Outreach Scripts | `POST /api/ai/outreach-pack` | Intro script, follow-up script, objection handling |
| Generate Business Summary | `POST /api/ai/merchant-summary` | Revenue summary + WhatsApp-ready message + next actions |
| Extract from Receipt/Ledger | `POST /api/ai/extract-artifact` | Structured JSON of extracted transaction data with confidence score |

The panel is fully interactive — results render inline with copy-to-clipboard for scripts and messages.

**AI activity log** — shows the 5 most recent AI workflow executions for this merchant.

---

### 4.4 Work Episode Engine (`/work-episodes` and `/work-episodes/[id]`)

**Status machine** — enforced at both UI and API level:

```
planned → assigned → accepted → in_progress → delivered
→ proof_uploaded → merchant_confirmed → paid → verified
Side exits: cancelled | disputed
```

**Advance button** — shows `current → next` with a single click. The API validates the transition using `getWorkEpisodeNextStatus()`.

**Side-effects on transition:**
- `in_progress` → sets `startedAt` timestamp
- `delivered` → sets `deliveredAt` timestamp
- `verified` → sets `verifiedAt` timestamp
- `proof_uploaded` or `merchant_confirmed` → fraud detection fires in background
- `paid` or `verified` → income ledger entry auto-created in Firestore

**Proof upload** — files saved to Cloud Storage (or local mock at `.firebase_mock/storage/`). Proof items written to `proof_items` collection. AI verification runs automatically on every new proof item.

**Dispute flow** — any non-terminal episode can be flagged as disputed. Resolution moves it back to `merchant_confirmed` (the last externally-verified state).

---

### 4.5 Evidence API + XPRIZE Dashboard

**XPRIZE Snapshot export** (`GET /api/evidence/xprize-snapshot`)
Returns a JSON object matching the spec §09 schema:
```json
{
  "snapshotDate": "...",
  "businessViability": { "users": 0, "paidUsers": 0, "platformRevenue": 0, "paidOrganizations": 0 },
  "aiNativeOperations": { "aiWorkflowsExecuted": 0, "serviceOffersGenerated": 0, "merchantOutputsGenerated": 0 },
  "categoryImpact": { "agentsOnPlatform": 0, "merchantsOnboarded": 0, "paidWorkEpisodes": 0, "verifiedPaidWorkEpisodes": 0, "merchantConfirmedEpisodes": 0, "agentIncomeLoggedLocal": 0, "proofUploads": 0 }
}
```

**Evidence dashboard** (`GET /api/evidence/dashboard`)
Returns all three XPRIZE criterion metrics in one call.

**Cohort export** (`GET /api/evidence/cohort/[id]`)
Returns per-cohort metrics: participants, work episodes by status, income, verification breakdown, AI workflow count.

---

## 5. Code Architecture — Deep Dive

### 5.1 Project Structure

```
newWork/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                             # Auth guard + sidebar
│   │   ├── overview/page.tsx
│   │   ├── agents/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx                       # Includes service offer cards
│   │   │       ├── generate-profile-button.tsx
│   │   │       ├── generate-offers-button.tsx     # NEW: AI Work Designer trigger
│   │   │       ├── edit-profile-button.tsx
│   │   │       └── onboard/page.tsx               # Skill intake wizard
│   │   ├── merchants/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── service-workspace/             # NEW
│   │   │           ├── page.tsx
│   │   │           └── service-workspace-client.tsx
│   │   ├── programs/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── monitor-cohort-button.tsx
│   │   │       └── cohorts/new/page.tsx
│   │   ├── opportunities/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── work-episodes/
│   │   │   ├── page.tsx
│   │   │   ├── log-episode-modal.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── status-advancer.tsx
│   │   │       ├── dispute-controls.tsx
│   │   │       └── proof-uploader.tsx
│   │   ├── income/page.tsx
│   │   ├── ai/
│   │   │   ├── page.tsx
│   │   │   └── run-ai-button.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   └── generate-report-button.tsx
│   │   └── xprize/page.tsx
│   │
│   └── api/
│       ├── auth/{login,register,logout,me}/route.ts
│       ├── agents/[id]/route.ts
│       ├── cohorts/route.ts
│       ├── opportunities/route.ts
│       ├── organizations/route.ts
│       ├── work-episodes/
│       │   ├── route.ts
│       │   └── [id]/{advance,dispute,proof}/route.ts
│       ├── payments/
│       │   ├── create-checkout-session/route.ts
│       │   ├── stripe-webhook/route.ts
│       │   └── mock-checkout-success/route.ts
│       ├── ai/
│       │   ├── service-offers/route.ts            # NEW
│       │   ├── outreach-pack/route.ts             # NEW
│       │   ├── extract-artifact/route.ts          # NEW
│       │   ├── merchant-summary/route.ts          # NEW
│       │   ├── next-action/route.ts               # NEW
│       │   ├── career-profile/[agentId]/route.ts
│       │   ├── monitor-cohort/[cohortId]/route.ts
│       │   └── run-all/route.ts
│       ├── evidence/
│       │   ├── xprize-snapshot/route.ts           # NEW
│       │   ├── dashboard/route.ts                 # NEW
│       │   └── cohort/[id]/route.ts               # NEW
│       └── reports/generate/route.ts
│
├── components/
│   ├── dashboard/sidebar.tsx
│   └── ui/{badge,button,card,input,select,stat-card}.tsx
│
├── lib/
│   ├── firebase.ts          # Firebase Admin SDK + full offline filesystem mock
│   ├── auth.ts              # getSession(), hashPassword(), createSession()
│   ├── ai.ts                # 11 AI workflows + runAiWorkflow() + Gemini client
│   ├── utils.ts             # Formatters, badge maps, status machine
│   └── db.ts                # Legacy Prisma artifact — NOT used
│
├── prisma/                  # Legacy schema artifact — NOT used at runtime
├── .firebase_mock/          # Local Firestore + Storage filesystem mock
├── product/ engineering/ ai/ payments/ qa/ evidence/ design/ launch/
│                            # Spec docs (authoritative source of truth)
└── CLAUDE.md                # Build rules and spec references
```

### 5.2 Firebase Architecture

The app uses **Firebase Admin SDK** on the server side — no client-side Firebase SDK.

**`lib/firebase.ts`** exports three objects: `db` (Firestore), `auth` (Firebase Auth), `storage` (Cloud Storage).

When environment credentials are present, these use the real Firebase services. When absent, a **full offline mock** (`MockFirestore`, `MockAuth`, `MockStorage`) uses the local filesystem at `.firebase_mock/` for development without any cloud dependency.

**Firestore access pattern** (consistent across all API routes):
```typescript
// Read a document
const userDoc = await db.collection("users").doc(userId).get();
if (!userDoc.exists) return null;
const user = userDoc.data();

// Query a collection
const snapshot = await db.collection("work_episodes")
  .where("agentId", "==", agentId)
  .orderBy("createdAt", "desc")
  .limit(10)
  .get();
const episodes = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));

// Write a document
const ref = db.collection("work_episodes").doc();
await ref.set({ id: ref.id, ...data, createdAt: new Date().toISOString() });

// Update a document (merge)
await db.collection("agent_profiles").doc(agentId).update({ updatedAt: new Date().toISOString() });
```

### 5.3 Authentication Flow

**Registration:**
```
POST /api/auth/register
  → auth.createUser({ email, displayName })        # Firebase Auth
  → db.collection("users").doc(uid).set(...)       # Firestore user doc
  → if org_admin: create org + org_members docs
  → auth.createSessionCookie(uid, { expiresIn })   # Session cookie
  → cookies().set("session", token, { httpOnly: true })
```

**Page access:**
```
layout.tsx → getSession() [cached with React cache()]
  → cookies().get("session").value
  → auth.verifySessionCookie(token)                # Verify with Firebase Auth
  → db.collection("users").doc(uid).get()          # Fetch user + role
  → if agent: db.collection("agent_profiles").where("userId","==",uid).get()
  → return { id, email, name, role, agentId?, orgId? }
```

**Offline mock session:** The `MockAuth.createSessionCookie()` returns the userId directly, and `MockAuth.verifySessionCookie()` looks up the user in the local filesystem mock. This allows full auth flow without Firebase credentials.

### 5.4 The AI Workflow System

All AI logic lives in `lib/ai.ts`. The design principle:

> **AI executes decisions and writes results back to Firestore. It does not return suggestions for human approval.**

**The `runAiWorkflow()` wrapper** wraps every Gemini call:
```typescript
export async function runAiWorkflow<T>(
  workflowType: string,
  entityId: string | null,
  entityType: string | null,
  fn: () => Promise<{ result: T; inputSummary: string; outputSummary: string; tokensUsed?: number }>
): Promise<T> {
  const start = Date.now();
  let success = true;
  try {
    const output = await fn();
    result = output.result;
  } catch (err) {
    success = false; throw err;
  } finally {
    // Logs ALWAYS — even on failure
    const logRef = db.collection("ai_workflow_logs").doc();
    await logRef.set({
      id: logRef.id, workflowType, entityId, entityType,
      success, inputSummary, outputSummary, modelUsed: "gemini-2.5-flash",
      tokensUsed, latencyMs: Date.now() - start,
      autonomousDecision: true, createdAt: new Date().toISOString(),
    });
  }
  return result!;
}
```

**Offline mock:** When `GEMINI_API_KEY` is absent, `getMockGeminiResponse()` returns realistic structured JSON for every workflow type — so all AI buttons work in local development with no API key.

### 5.5 The Work Episode Status Machine

Defined in `lib/utils.ts` as a simple map — the single source of truth for legal transitions:

```typescript
export function getWorkEpisodeNextStatus(current: string): string | null {
  const flow: Record<string, string> = {
    planned:            "assigned",
    assigned:           "accepted",
    accepted:           "in_progress",
    in_progress:        "delivered",
    delivered:          "proof_uploaded",
    proof_uploaded:     "merchant_confirmed",
    merchant_confirmed: "paid",
    paid:               "verified",
  };
  return flow[current] || null;
}
```

Both the UI (to decide whether to show the advance button) and the API (to validate the request) call this function. A request to skip stages returns `null` and is rejected.

---

## 6. Firestore Data Model Explained

### Collections (canonical per `engineering/05_DATA_MODEL_AND_API_SPEC.md`)

| Collection | Purpose |
|-----------|---------|
| `users` | Auth record + role |
| `agent_profiles` | Agent skill profile, location, tools, AI profile |
| `organizations` | NGO / school / partner records |
| `org_members` | User-to-org membership |
| `org_subscriptions` | Stripe subscription records |
| `cohorts` | Programme cohorts |
| `cohort_enrollments` | Agent-to-cohort enrollment |
| `merchants` | Informal merchant records (no auth) |
| `service_offers` | AI-generated service offer cards per agent |
| `opportunities` | Org-created job postings (platform extension) |
| `opportunity_assignments` | AI-matched agent-to-opportunity assignments |
| `work_episodes` | Paid work episode records (status machine) |
| `proof_items` | Uploaded proof files with AI verification status |
| `merchant_confirmations` | Merchant confirmation of work completion |
| `payments` | Service payment records (agent income) |
| `income_ledger` | Agent income entries by period |
| `ai_workflow_logs` | Every AI call, its inputs, outputs, latency, tokens |
| `fraud_flags` | AI-raised anomalies on work episodes |
| `impact_reports` | AI-generated donor/board reports |

### Key Design Decisions

**Why is `Merchant` not a `User`?**
Merchants do not log in. They are records in Firestore — they confirm work via phone outside the platform. Merchant auth is Phase 2.

**Why are `Payment` and `IncomeLedger` separate from `WorkEpisode`?**
`WorkEpisode` tracks whether work happened. `Payment` tracks whether the agent logged receiving money. `IncomeLedger` tracks what the platform counts as verified income. These are three different facts.

**Why does `IncomeLedger` auto-create on advance?**
When an episode advances to `paid` or `verified`, the API auto-creates the ledger entry. This prevents agents from forgetting to log income.

**Why use `service_offers` and `opportunities` as separate collections?**
`service_offers` are AI-generated offer cards per agent (what the agent can offer merchants). `opportunities` are org-created job postings (what organizations need agents to do). These are different concepts: one is agent-facing, the other is org-facing.

**Why `ai_workflow_logs.autonomousDecision = true` on all logs?**
All current workflows are autonomous — AI executes without human approval. The field exists so that if a human-review workflow is ever added, the governance rate calculation (used on the XPRIZE dashboard) remains accurate.

### Verification Ladder

```
self_reported → proof_uploaded → merchant_confirmed → program_verified
```

North-star = `merchant_confirmed` or higher. This is the count that matters for XPRIZE and donor reporting.

---

## 7. AI Engine Explained

### The 11 AI Workflows

#### Workflows 1–6: Core Autonomous Operations

| # | Function | Workflow Type | What Gemini Does | Writes To |
|---|----------|--------------|-----------------|-----------|
| 1 | `verifyProof` | `proof_verification` | Scores proof credibility (0–1), accepts/rejects/needs_more_info | `proof_items` |
| 2 | `matchAgentsToOpportunity` | `opportunity_matching` | Ranks agents by fit (skills, district, track record), auto-assigns top 5 | `opportunity_assignments` |
| 3 | `generateCareerProfile` | `career_profile` | 8-field career profile: summary, strengths, weaknesses, jobs, training, growth, risks, tips | `agent_profiles.aiProfile` |
| 4 | `monitorCohortHealth` | `program_monitoring` | Health score 0–100, status, risks, interventions, at-risk agents | `ai_workflow_logs` only |
| 5 | `generateImpactReport` | `report_generation` | Full donor report: executive summary, key metrics, success story, recommendation | `impact_reports` |
| 6 | `detectFraud` | `fraud_detection` | Checks 4 fraud patterns (volume, value, proof, duplicates), auto-flags if suspicious | `fraud_flags` |

#### Workflows 7–11: AI Work Designer (spec §03)

| # | Function | Workflow Type | What Gemini Does | Writes To |
|---|----------|--------------|-----------------|-----------|
| 7 | `generateServiceOffers` | `offer_generation` | 3 merchant service offer cards with price range, tasks, first step | `service_offers` |
| 8 | `generateOutreachPack` | `outreach` | Intro script, follow-up script, objection responses, approach tips | `ai_workflow_logs` only |
| 9 | `extractArtifact` | `extraction` | Extracts structured data from receipts/ledgers/notes with confidence score | `ai_workflow_logs` only |
| 10 | `generateMerchantSummary` | `report` | Weekly business summary + WhatsApp-ready message + next actions | `ai_workflow_logs` only |
| 11 | `generateNextAction` | `agent_recommendation` | Single highest-impact next action for agent with estimated income and steps | `ai_workflow_logs` only |

### Prompt Engineering Pattern

All prompts follow the same structure:
```
1. Role: "You are the NewWork Work Designer / autonomous verification engine..."
2. Context data: structured entity data from Firestore
3. Task: explicit instructions on what to evaluate
4. Output format: "Respond ONLY as JSON: { ... }"
5. Fallback: try/catch around JSON.parse — safe default on failure
```

The regex `raw.match(/\{[\s\S]*\}/)` extracts JSON even if Gemini adds prose wrapping.

### AI Governance Rate

```typescript
// lib/utils.ts
export function calculateAiAutonomyRate(logs: Array<{ autonomousDecision: boolean }>): number {
  if (!logs.length) return 0;
  return logs.filter(l => l.autonomousDecision).length / logs.length;
}
```

Currently 100% — all 11 workflows set `autonomousDecision: true`.

---

## 8. Running the Project

### Prerequisites

- Node.js 18+
- No database installation needed — runs offline with a local filesystem mock

### Setup (first time)

```bash
cd /Users/ronaldmutebi/newWork
npm install
npm run dev
# → http://localhost:3000
```

The app runs fully offline with no cloud credentials. All data is stored in `.firebase_mock/`.

### Environment Variables

| Variable | Required for | Notes |
|----------|-------------|-------|
| `FIREBASE_PROJECT_ID` | Real Firebase | All three must be set together |
| `FIREBASE_CLIENT_EMAIL` | Real Firebase | If any is missing, offline mock is used |
| `FIREBASE_PRIVATE_KEY` | Real Firebase | |
| `GEMINI_API_KEY` | Live AI | Without it, mock AI responses are used |
| `STRIPE_SECRET_KEY` | Live payments | Mock checkout available without it |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | |
| `GCS_PROOF_BUCKET` | Real storage | Without it, local mock storage is used |
| `NEXT_PUBLIC_APP_URL` | Stripe redirect | |

### Registration (first user)

Go to `http://localhost:3000/register` and create accounts:
- An Org Admin (provide an org name)
- An Agent (pick skills during onboarding)

### Useful Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build + TypeScript check
```

---

## 9. Assessment Corrections Index

| Assessment Finding | Correction | Where |
|-------------------|------------|-------|
| Revenue model centres 85/15 split MVP doesn't collect | Subscription revenue only; split is Phase 2 | `xprize/page.tsx`, CLAUDE.md |
| AI is "copilot" — recommends but doesn't execute | All 11 workflows write to Firestore directly without human approval | `lib/ai.ts` |
| No AI governance breadth metric | `calculateAiAutonomyRate()` + governance % on XPRIZE dashboard | `lib/utils.ts`, `xprize/page.tsx` |
| No AI Work Designer | 5 new AI workflows: service offers, outreach, extraction, summary, next action | `lib/ai.ts`, `/api/ai/service-offers` etc. |
| No service offer cards | `service_offers` collection + offer card UI on agent profile | `agents/[id]/page.tsx` |
| No merchant service workspace | `/merchants/[id]/service-workspace` with 6 templates + live AI tools | `service-workspace/` |
| No XPRIZE evidence export | `GET /api/evidence/xprize-snapshot` returns spec §09 JSON schema | `api/evidence/xprize-snapshot/route.ts` |
| No evidence API | `GET /api/evidence/dashboard` and `GET /api/evidence/cohort/[id]` | `api/evidence/` |
| Platform touches agent funds | Payment model is direct merchant-to-agent; platform is pure SaaS | All payment UI notes |
| North-star rests on self-report | `merchant_confirmed` is explicit north-star throughout | `lib/utils.ts`, income page, xprize page |
| Category definition never stated | "The Category Thesis" section on XPRIZE page | `xprize/page.tsx` |
| No decision auditability | Decision Replay on XPRIZE page with score breakdown | `xprize/page.tsx` |

---

*NewWork — Next.js · Firebase/Firestore · Firebase Auth · Gemini AI (gemini-2.5-flash) · Stripe*  
*~25 pages · 27 API endpoints · 11 autonomous AI workflows · Offline-capable with local filesystem mock*
