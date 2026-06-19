# 02 Technical Architecture

## Recommended stack

| Layer | Tool or service |
|---|---|
| Frontend | Next.js, React, TypeScript |
| UI | Tailwind CSS or CSS Modules with design tokens |
| Auth | Firebase Authentication |
| Backend | Cloud Run service with Node.js and Express or Next.js API routes |
| Database | Cloud Firestore |
| File storage | Google Cloud Storage |
| Async processing | Cloud Pub/Sub |
| AI | Gemini API, prototyped in Google AI Studio |
| Payments | Stripe Checkout, Stripe Billing, Stripe Webhooks |
| Future mobile money | M-Pesa Daraja, Paystack, Flutterwave, or regional aggregator |
| Secrets | Secret Manager |
| Logs | Cloud Logging |
| Monitoring | Cloud Monitoring and Error Reporting |
| Deployment | Google Cloud Run |

## System overview

The MVP should run as a web application backed by a Cloud Run API. Firestore stores operational state. Cloud Storage stores proof uploads. Gemini handles AI workflows. Stripe handles payment events. Pub/Sub supports async processing for uploads, AI extraction, and evidence generation.

## Core services

### Web frontend
Responsibilities:
- Landing page
- Agent dashboard
- Admin dashboard
- Merchant profile screens
- Work episode logger
- Proof upload
- Payment unlock screens

### API backend
Responsibilities:
- Auth validation
- Role-based access checks
- Firestore CRUD
- Gemini request orchestration
- Stripe Checkout session creation
- Stripe webhook processing
- Evidence report generation

### AI orchestration service
Responsibilities:
- Skill intake summarization
- Service offer generation
- Outreach generation
- Receipt or note extraction
- Business summary generation
- Next action recommendation
- AI workflow logging

### Evidence service
Responsibilities:
- Aggregate metrics
- Generate XPRIZE evidence snapshots
- Export cohort reports
- Track proof verification states

### Payments service
Responsibilities:
- Create Stripe checkout sessions
- Process Stripe webhooks
- Update subscriptions and entitlements
- Record platform revenue
- Record manual merchant service transactions
- Prepare future mobile-money integration

## Environment variables

```
NEXT_PUBLIC_APP_URL=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
GOOGLE_CLOUD_PROJECT=
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_LAUNCH_KIT=
STRIPE_PRICE_PLUS_MONTHLY=
STRIPE_PRICE_COHORT_PACK=
GCS_PROOF_BUCKET=
PUBSUB_AI_JOBS_TOPIC=
PUBSUB_EVIDENCE_TOPIC=
```

## Request flow: skill intake

1. Agent submits intake answers.
2. API stores raw intake in Firestore.
3. API calls Gemini with structured output schema.
4. Gemini returns skill profile, constraints, confidence, recommended roles.
5. API stores AI output and AI workflow log.
6. Frontend displays skill profile and offer cards.

## Request flow: merchant service output

1. Agent creates merchant record.
2. Agent selects service template.
3. Agent uploads artifact or enters notes.
4. File is stored in Cloud Storage.
5. Upload event is published to Pub/Sub.
6. AI worker extracts structured data.
7. Gemini creates merchant-facing output.
8. Agent reviews output.
9. Agent marks service delivered.
10. Work episode can be logged if paid.

## Payment flow: Stripe

1. User selects Launch Kit, Plus, Cohort Pack, or Partner Pilot.
2. Backend creates Stripe Checkout Session.
3. User completes hosted checkout.
4. Stripe sends webhook.
5. Backend validates signature.
6. Backend records payment event.
7. Backend updates entitlement.
8. Dashboard reflects revenue.

## Future payment flow: mobile money

Phase two can support M-Pesa or regional mobile-money aggregators.

Suggested flow:
1. Merchant requests service payment.
2. Payment provider triggers mobile-money prompt.
3. Payment webhook confirms transaction.
4. Platform records gross payment.
5. Agent payout is recorded or executed through provider if available.
6. Platform fee is recorded separately.
7. Work episode is linked to payment.

## Security model

### Roles
- `agent`
- `merchant`
- `program_admin`
- `operator`
- `super_admin`

### Access rules
- Agents can read and update their own profiles.
- Agents can manage merchants assigned to them.
- Program admins can view cohort members and aggregated cohort data.
- Operators can review safety logs, payments, and proof status.
- Super admins can manage system configuration.

## Audit logs
Track:
- Login events
- AI workflow requests
- AI workflow outputs
- Payment webhook events
- Work episode status changes
- Proof verification changes
- Admin exports

## Technical risks and mitigations

| Risk | Mitigation |
|---|---|
| AI hallucinated business advice | Use structured outputs, disclaimers, retrieval templates, review states |
| Legal or tax advice risk | Only track reminders and document organization, do not advise on compliance outcome |
| Payment webhook loss | Idempotent processing, raw event storage, retries |
| Proof fraud | Verification status, merchant confirmation, program admin review |
| Low-quality uploads | Confidence scores, re-upload request, manual edit path |
| Cost overruns | Cache AI outputs, enforce rate limits, monitor token usage |
| Data leakage | Role-based access, signed URLs, encryption, least privilege |
