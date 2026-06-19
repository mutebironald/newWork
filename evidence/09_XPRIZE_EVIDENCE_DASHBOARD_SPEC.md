# 09 XPRIZE Evidence Dashboard Specification

## Purpose
The evidence dashboard must make judging criteria visible inside the product. It should prove NewWork is a real business, AI-native operation, and category-impact product.

## Dashboard tabs

### Tab 1: Business Viability
Metrics:
- Total users
- Active agents
- Paid users
- Paid organizations
- Stripe revenue
- Merchant service gross payments
- NewWork platform revenue
- Agent payouts
- Free-to-paid conversion
- Cohort pilots
- Repeat merchants

### Tab 2: AI-Native Operations
Metrics:
- AI workflows executed
- Skill profiles generated
- Service offers generated
- Outreach packs generated
- Merchant outputs generated
- Extraction jobs completed
- AI next actions generated
- Safety flags
- Average AI latency
- AI workflow success rate

### Tab 3: Category Impact
Metrics:
- Work offers launched
- Merchants onboarded
- Customer outreach actions
- Leads generated
- Paid work episodes
- Verified paid work episodes
- Proof uploads
- Merchant-confirmed work
- Program-verified work
- Income logged by agents
- Repeat work paths

### Tab 4: Cohort Performance
Metrics by cohort:
- Participants invited
- Participants active
- Skill scans completed
- Offers selected
- Merchants contacted
- Work episodes logged
- Revenue generated
- Proof uploaded
- Verification rate

### Tab 5: Proof Review
Queues:
- Pending proof
- Needs more information
- Accepted proof
- Rejected proof
- Merchant confirmation requested
- Program verification completed

## Evidence snapshot export
The export should produce a JSON and human-readable report.

### JSON export
```json
{
  "snapshotDate": "timestamp",
  "businessViability": {
    "users": 0,
    "paidUsers": 0,
    "platformRevenue": 0,
    "paidOrganizations": 0
  },
  "aiNativeOperations": {
    "aiWorkflowsExecuted": 0,
    "serviceOffersGenerated": 0,
    "merchantOutputsGenerated": 0
  },
  "categoryImpact": {
    "paidWorkEpisodes": 0,
    "verifiedPaidWorkEpisodes": 0,
    "agentIncomeLogged": 0,
    "proofUploads": 0
  }
}
```

## Judge-facing demo path

1. Show Business Viability tab.
2. Show live revenue ledger.
3. Show AI-Native Operations tab.
4. Open an AI workflow log.
5. Show Category Impact tab.
6. Open a verified paid work episode.
7. Show proof item and status.
8. Export XPRIZE snapshot.

## Evidence principles

- Do not inflate metrics.
- Distinguish self-reported, proof-uploaded, merchant-confirmed, and program-verified work.
- Separate gross merchant payments from platform revenue.
- Show actual payments where available.
- Label demo data if used.
- Keep production and demo data clearly separate.

## Strongest judging narrative
NewWork launched as a real work-creation business. It acquired users, processed payments, helped agents deliver merchant services, logged paid work episodes, captured proof, and produced partner-ready evidence. AI did not merely generate content. AI ran the core operating loop from skill discovery to service execution and impact reporting.
