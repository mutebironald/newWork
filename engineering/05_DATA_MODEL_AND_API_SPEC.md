# 05 Data Model and API Specification

## Firestore collections

### users
```json
{
  "userId": "string",
  "email": "string",
  "displayName": "string",
  "role": "agent | program_admin | operator | super_admin",
  "organizationId": "optional string",
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp"
}
```

### agent_profiles
```json
{
  "agentId": "string",
  "userId": "string",
  "cohortId": "optional string",
  "location": "string",
  "languages": ["string"],
  "skills": ["string"],
  "toolsAvailable": ["smartphone", "whatsapp", "laptop", "transport", "camera"],
  "availabilityHoursPerWeek": 0,
  "constraints": ["string"],
  "preferredServices": ["string"],
  "status": "draft | active | paused",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### cohorts
```json
{
  "cohortId": "string",
  "organizationId": "string",
  "name": "string",
  "location": "string",
  "startDate": "date",
  "endDate": "date",
  "status": "planned | active | completed",
  "createdBy": "userId",
  "createdAt": "timestamp"
}
```

### organizations
```json
{
  "organizationId": "string",
  "name": "string",
  "type": "ngo | school | incubator | church | local_government | private_partner",
  "billingPlan": "none | cohort_pack | partner_pilot",
  "stripeCustomerId": "optional string",
  "createdAt": "timestamp"
}
```

### merchants
```json
{
  "merchantId": "string",
  "assignedAgentId": "string",
  "businessName": "string",
  "businessType": "shop | food | tailoring | beauty | repair | farm | event | other",
  "contactName": "string",
  "phone": "string",
  "locationText": "string",
  "preferredChannel": "whatsapp | sms | phone | in_person",
  "status": "lead | active | inactive",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### service_offers
```json
{
  "offerId": "string",
  "agentId": "string",
  "title": "string",
  "serviceType": "receipt_digitization | sales_summary | whatsapp_catalog | customer_followup | renewal_tracker | proof_profile",
  "description": "string",
  "priceRange": {"min": 0, "max": 0, "currency": "string"},
  "deliverySteps": ["string"],
  "toolsNeeded": ["string"],
  "aiGenerated": true,
  "selected": false,
  "createdAt": "timestamp"
}
```

### work_episodes
```json
{
  "workEpisodeId": "string",
  "agentId": "string",
  "merchantId": "string",
  "cohortId": "optional string",
  "serviceType": "string",
  "description": "string",
  "amountPaid": 0,
  "currency": "string",
  "paymentMethod": "cash | mobile_money | stripe | bank | unknown",
  "paymentStatus": "unpaid | paid | disputed | refunded",
  "proofStatus": "self_reported | proof_uploaded | merchant_confirmed | program_verified",
  "status": "planned | delivered | paid | verified",
  "deliveredAt": "timestamp",
  "createdAt": "timestamp"
}
```

### proof_items
```json
{
  "proofId": "string",
  "workEpisodeId": "string",
  "agentId": "string",
  "merchantId": "string",
  "fileUrl": "signed or private reference",
  "fileType": "image | pdf | screenshot | audio | text",
  "description": "string",
  "verificationStatus": "pending | accepted | rejected | needs_more_info",
  "reviewedBy": "optional userId",
  "createdAt": "timestamp"
}
```

### ai_workflow_logs
```json
{
  "workflowId": "string",
  "userId": "string",
  "workflowType": "skill_profile | offer_generation | extraction | outreach | report | safety_check",
  "model": "string",
  "inputHash": "string",
  "outputRef": "string",
  "status": "success | failed | flagged | needs_review",
  "confidence": 0.0,
  "latencyMs": 0,
  "tokenEstimate": 0,
  "createdAt": "timestamp"
}
```

### payment_ledger
```json
{
  "ledgerId": "string",
  "source": "stripe | mobile_money | manual",
  "grossAmount": 0,
  "platformRevenue": 0,
  "agentPayout": 0,
  "currency": "string",
  "status": "pending | succeeded | failed | refunded",
  "stripeEventId": "optional string",
  "workEpisodeId": "optional string",
  "createdAt": "timestamp"
}
```

## API routes

### Auth and profile
- `GET /api/me`
- `POST /api/agent-profile`
- `GET /api/agent-profile/:id`
- `PATCH /api/agent-profile/:id`

### Cohorts
- `POST /api/cohorts`
- `GET /api/cohorts`
- `GET /api/cohorts/:id`
- `POST /api/cohorts/:id/invite`
- `GET /api/cohorts/:id/metrics`

### Merchants
- `POST /api/merchants`
- `GET /api/merchants`
- `GET /api/merchants/:id`
- `PATCH /api/merchants/:id`

### AI workflows
- `POST /api/ai/skill-profile`
- `POST /api/ai/service-offers`
- `POST /api/ai/outreach-pack`
- `POST /api/ai/extract-artifact`
- `POST /api/ai/merchant-summary`
- `POST /api/ai/next-action`
- `POST /api/ai/admin-evidence-summary`

### Work episodes
- `POST /api/work-episodes`
- `GET /api/work-episodes`
- `PATCH /api/work-episodes/:id`
- `POST /api/work-episodes/:id/proof`
- `PATCH /api/work-episodes/:id/verify`

### Payments
- `POST /api/payments/create-checkout-session`
- `POST /api/payments/stripe-webhook`
- `POST /api/payments/manual-service-payment`
- `GET /api/payments/revenue-summary`

### Evidence
- `GET /api/evidence/dashboard`
- `GET /api/evidence/cohort/:id/export`
- `GET /api/evidence/xprize-snapshot`

## State machine: work episode

```
planned -> delivered -> paid -> verified
planned -> cancelled
delivered -> disputed
paid -> refunded
```

## State machine: proof

```
self_reported -> proof_uploaded -> merchant_confirmed -> program_verified
proof_uploaded -> needs_more_info
proof_uploaded -> rejected
```

## Event taxonomy

- `agent.signup.completed`
- `agent.skill_intake.completed`
- `ai.skill_profile.generated`
- `ai.service_offers.generated`
- `agent.offer.selected`
- `merchant.created`
- `merchant.outreach.generated`
- `merchant.service.delivered`
- `work_episode.created`
- `work_episode.paid_logged`
- `proof.uploaded`
- `proof.verified`
- `payment.stripe.completed`
- `payment.manual_service.logged`
- `evidence.snapshot.generated`
