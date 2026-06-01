import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding NewWork PostgreSQL database...");

  const pwHash = await bcrypt.hash("demo1234", 12);

  // ─── USERS ────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Platform Admin",
      phone: "+1 555 000 0001",
      passwordHash: pwHash,
      role: "operator",
    },
  });

  const orgUser = await prisma.user.upsert({
    where: { email: "org@demo.com" },
    update: {},
    create: {
      email: "org@demo.com",
      name: "Grace Adams",
      phone: "+1 555 000 0002",
      passwordHash: pwHash,
      role: "org_admin",
    },
  });

  const agentSeeds = [
    { email: "agent@demo.com", name: "Sarah Jenkins", phone: "+1 555 111 0001", district: "Central", skills: ["sales", "photography", "marketing"] },
    { email: "james@demo.com", name: "James Smith", phone: "+1 555 111 0002", district: "Westside", skills: ["data_entry", "survey_collection", "customer_support"] },
    { email: "fatuma@demo.com", name: "Fatima Miller", phone: "+1 555 111 0003", district: "Eastside", skills: ["merchant_onboarding", "photography", "marketing"] },
    { email: "david@demo.com", name: "David Johnson", phone: "+1 555 111 0004", district: "Central", skills: ["delivery", "sales", "customer_support"] },
    { email: "amina@demo.com", name: "Amina Davis", phone: "+1 555 111 0005", district: "Westside", skills: ["survey_collection", "data_entry", "photography"] },
    { email: "peter@demo.com", name: "Peter Brown", phone: "+1 555 111 0006", district: "Northside", skills: ["sales", "marketing", "merchant_onboarding"] },
    { email: "ruth@demo.com", name: "Ruth Taylor", phone: "+1 555 111 0007", district: "Southside", skills: ["photography", "data_entry", "sales"] },
    { email: "moses@demo.com", name: "Moses Wilson", phone: "+1 555 111 0008", district: "Eastside", skills: ["delivery", "customer_support", "survey_collection"] },
  ];

  const agentUserIds: string[] = [];
  for (const seed of agentSeeds) {
    const u = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        name: seed.name,
        phone: seed.phone,
        passwordHash: pwHash,
        role: "agent",
      },
    });
    agentUserIds.push(u.id);
  }

  // ─── ORGANIZATIONS ────────────────────────────────────────────────────────
  const org1 = await prisma.organization.create({
    data: {
      name: "Urban Youth Employment Initiative",
      type: "ngo",
      email: "contact@uyei.org",
      country: "Canada",
    },
  });
  const org2 = await prisma.organization.create({
    data: {
      name: "Women Entrepreneurs Development Fund",
      type: "foundation",
      email: "info@wedf.org",
      country: "United Kingdom",
    },
  });
  await prisma.organization.create({
    data: {
      name: "Digital Skills Academy",
      type: "school",
      email: "hello@dsa.org",
      country: "Germany",
    },
  });

  await prisma.orgMember.create({ data: { orgId: org1.id, userId: orgUser.id, role: "admin" } });
  await prisma.orgMember.create({ data: { orgId: org2.id, userId: orgUser.id, role: "admin" } });

  // Subscriptions (org subscriptions = platform revenue)
  await prisma.orgSubscription.create({
    data: {
      orgId: org1.id,
      tier: "cohort_pack",
      priceUsd: 499,
      status: "active",
      stripeSubscriptionId: "sub_demo_uyei_001",
    },
  });
  await prisma.orgSubscription.create({
    data: {
      orgId: org2.id,
      tier: "partner",
      priceUsd: 999,
      status: "active",
      stripeSubscriptionId: "sub_demo_wedf_001",
    },
  });

  // ─── AGENTS ───────────────────────────────────────────────────────────────
  const agentIds: string[] = [];
  for (let i = 0; i < agentSeeds.length; i++) {
    const seed = agentSeeds[i];
    const a = await prisma.agent.create({
      data: {
        userId: agentUserIds[i],
        district: seed.district,
        skills: seed.skills,
        education: i % 3 === 0 ? "tertiary" : "secondary",
        gender: i % 2 === 0 ? "female" : "male",
        age: 20 + i * 2,
        location: seed.district,
        bio: `Passionate worker from ${seed.district} skilled in ${seed.skills.slice(0, 2).join(" and ")}.`,
        status: "active",
      },
    });
    agentIds.push(a.id);
  }

  // ─── COHORTS ──────────────────────────────────────────────────────────────
  const cohort1 = await prisma.cohort.create({
    data: {
      orgId: org1.id,
      name: "Youth Employment Program 2026",
      description: "Training 50 youth in digital merchant services across multiple districts.",
      goalAgents: 50,
      goalEpisodes: 500,
      goalIncome: 25000000,
      status: "active",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
    },
  });

  const cohort2 = await prisma.cohort.create({
    data: {
      orgId: org2.id,
      name: "Women Entrepreneurship Cohort",
      description: "Empowering 30 women entrepreneurs with digital income skills.",
      goalAgents: 30,
      goalEpisodes: 300,
      goalIncome: 15000000,
      status: "active",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-08-31"),
    },
  });

  for (let i = 0; i < Math.min(6, agentIds.length); i++) {
    await prisma.cohortEnrollment.create({
      data: { cohortId: cohort1.id, agentId: agentIds[i], status: "active" },
    });
  }
  for (let i = 2; i < Math.min(5, agentIds.length); i++) {
    const exists = await prisma.cohortEnrollment.findUnique({
      where: { cohortId_agentId: { cohortId: cohort2.id, agentId: agentIds[i] } },
    });
    if (!exists) {
      await prisma.cohortEnrollment.create({
        data: { cohortId: cohort2.id, agentId: agentIds[i], status: "active" },
      });
    }
  }

  // ─── MERCHANTS ────────────────────────────────────────────────────────────
  const merchantSeeds = [
    { name: "City Central Pharmacy", phone: "+1 555 001 0001", category: "pharmacy" as const, district: "Central", address: "Main Street, Plot 12" },
    { name: "Rose's Kitchen Restaurant", phone: "+1 555 002 0002", category: "restaurant" as const, district: "Westside", address: "Market Road, Westside" },
    { name: "Glamour Beauty Salon", phone: "+1 555 003 0003", category: "salon" as const, district: "Central", address: "Fashion Lane, Central" },
    { name: "Riverside Supermarket", phone: "+1 555 004 0004", category: "shop" as const, district: "Northside", address: "River Road, Northside" },
    { name: "Downtown Market Stall 44", phone: "+1 555 005 0005", category: "market" as const, district: "Central", address: "Central Market" },
    { name: "TechHub Electronics", phone: "+1 555 006 0006", category: "retail" as const, district: "Central", address: "Commerce Street" },
    { name: "Northside General Store", phone: "+1 555 007 0007", category: "shop" as const, district: "Northside", address: "North Town Center" },
    { name: "Eastside Agro Supplies", phone: "+1 555 008 0008", category: "retail" as const, district: "Eastside", address: "East Market Road" },
  ];

  const merchantIds: string[] = [];
  for (const m of merchantSeeds) {
    const merchant = await prisma.merchant.create({
      data: { ...m, orgId: org1.id, status: "active" },
    });
    merchantIds.push(merchant.id);
  }

  // ─── OPPORTUNITIES ────────────────────────────────────────────────────────
  const oppSeeds = [
    {
      title: "WhatsApp Business Catalog Setup",
      description: "Help 10 pharmacies and shops create their WhatsApp Business catalogs with photos, prices, and descriptions.",
      serviceType: "catalog_creation" as const,
      amount: 25000,
      skillsRequired: ["photography", "marketing", "merchant_onboarding"],
      district: "Central",
    },
    {
      title: "Merchant Outreach — 15 Shops",
      description: "Visit 15 shops and collect their business information for the digital directory.",
      serviceType: "merchant_outreach" as const,
      amount: 15000,
      skillsRequired: ["sales", "customer_support"],
      district: "Westside",
    },
    {
      title: "Customer Survey Collection",
      description: "Collect 50 customer satisfaction surveys at the downtown market using the mobile app.",
      serviceType: "survey" as const,
      amount: 8000,
      skillsRequired: ["survey_collection", "data_entry"],
      district: "Central",
    },
    {
      title: "Business Photography Package",
      description: "Take professional product and storefront photos for 5 market vendors.",
      serviceType: "photography" as const,
      amount: 35000,
      skillsRequired: ["photography"],
      district: "Central",
    },
    {
      title: "Google Business Profile Setup",
      description: "Set up and verify Google Business Profiles for 8 local businesses.",
      serviceType: "digital_presence" as const,
      amount: 20000,
      skillsRequired: ["marketing", "data_entry"],
      district: "Westside",
    },
  ];

  const oppIds: string[] = [];
  for (const opp of oppSeeds) {
    const o = await prisma.opportunity.create({
      data: {
        ...opp,
        orgId: org1.id,
        maxAssignments: 3,
        status: "open",
      },
    });
    oppIds.push(o.id);
  }

  // ─── WORK EPISODES ────────────────────────────────────────────────────────
  type EpSeed = {
    agentIdx: number; merchantIdx: number; oppIdx: number;
    title: string; serviceType: "catalog_creation"|"survey"|"photography"|"merchant_outreach"|"digital_presence"|"business_profiling";
    amount: number; status: "verified"|"merchant_confirmed"|"paid"|"proof_uploaded"|"in_progress"|"delivered";
    hasProof: boolean; hasConfirmation: boolean; hasPayment: boolean;
  };

  const episodeSeeds: EpSeed[] = [
    { agentIdx:0, merchantIdx:0, oppIdx:0, title:"WhatsApp Catalog — City Central Pharmacy", serviceType:"catalog_creation", amount:25000, status:"verified", hasProof:true, hasConfirmation:true, hasPayment:true },
    { agentIdx:1, merchantIdx:1, oppIdx:2, title:"Customer Survey — Rose's Kitchen Restaurant", serviceType:"survey", amount:8000, status:"merchant_confirmed", hasProof:true, hasConfirmation:true, hasPayment:true },
    { agentIdx:2, merchantIdx:2, oppIdx:3, title:"Product Photography — Glamour Beauty Salon", serviceType:"photography", amount:35000, status:"paid", hasProof:true, hasConfirmation:false, hasPayment:true },
    { agentIdx:0, merchantIdx:3, oppIdx:1, title:"Merchant Outreach — Riverside Supermarket", serviceType:"merchant_outreach", amount:15000, status:"proof_uploaded", hasProof:true, hasConfirmation:false, hasPayment:false },
    { agentIdx:3, merchantIdx:4, oppIdx:2, title:"Survey Collection — Downtown Market", serviceType:"survey", amount:8000, status:"in_progress", hasProof:false, hasConfirmation:false, hasPayment:false },
    { agentIdx:4, merchantIdx:5, oppIdx:4, title:"Google Business Profile — TechHub Electronics", serviceType:"digital_presence", amount:20000, status:"merchant_confirmed", hasProof:true, hasConfirmation:true, hasPayment:true },
    { agentIdx:1, merchantIdx:6, oppIdx:1, title:"Business Profiling — Northside General Store", serviceType:"business_profiling", amount:12000, status:"verified", hasProof:true, hasConfirmation:true, hasPayment:true },
    { agentIdx:5, merchantIdx:7, oppIdx:0, title:"WhatsApp Catalog — Eastside Agro Supplies", serviceType:"catalog_creation", amount:25000, status:"delivered", hasProof:false, hasConfirmation:false, hasPayment:false },
  ];

  const verifiedStatuses = ["merchant_confirmed", "paid", "verified"];

  for (const ep of episodeSeeds) {
    const now = new Date();
    const episode = await prisma.workEpisode.create({
      data: {
        agentId: agentIds[ep.agentIdx],
        merchantId: merchantIds[ep.merchantIdx],
        opportunityId: oppIds[ep.oppIdx],
        cohortId: cohort1.id,
        orgId: org1.id,
        title: ep.title,
        serviceType: ep.serviceType,
        amount: ep.amount,
        status: ep.status,
        startedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        deliveredAt: verifiedStatuses.includes(ep.status)
          ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null,
        verifiedAt: ep.status === "verified" ? now : null,
      },
    });

    if (ep.hasProof) {
      await prisma.proofItem.create({
        data: {
          workEpisodeId: episode.id,
          fileUrl: `/demo/proof_${episode.id}.jpg`,
          fileType: ep.serviceType === "photography" ? "photo" : ep.serviceType === "survey" ? "pdf" : "screenshot",
          fileName: `proof_${ep.serviceType}.jpg`,
          fileSizeBytes: 250000 + Math.floor(Math.random() * 500000),
          aiStatus: verifiedStatuses.includes(ep.status) ? "accepted" : "pending",
          aiConfidence: verifiedStatuses.includes(ep.status) ? 0.85 + Math.random() * 0.14 : null,
          aiNotes: verifiedStatuses.includes(ep.status)
            ? `Evidence appears genuine. File type matches ${ep.serviceType} service. Size indicates real content.`
            : null,
          aiReviewedAt: verifiedStatuses.includes(ep.status) ? now : null,
        },
      });
    }

    if (ep.hasConfirmation) {
      await prisma.merchantConfirmation.create({
        data: {
          workEpisodeId: episode.id,
          merchantId: merchantIds[ep.merchantIdx],
          confirmed: true,
          rating: 3 + Math.floor(Math.random() * 3),
          feedback: "Agent was professional and completed the task as described.",
          confirmedAt: now,
        },
      });
    }

    if (ep.hasPayment) {
      const paidAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);
      const proofStatus = ep.status === "verified" ? "program_verified" : "merchant_confirmed";
      await prisma.payment.create({
        data: {
          workEpisodeId: episode.id,
          amount: ep.amount,
          method: Math.random() > 0.5 ? "mobile_money" : "cash",
          proofUrl: `/demo/payment_${episode.id}.png`,
          proofStatus: proofStatus as "program_verified" | "merchant_confirmed",
          reference: `PAY${Math.floor(Math.random() * 9000000) + 1000000}`,
          paidAt,
        },
      });

      await prisma.incomeLedger.create({
        data: {
          agentId: agentIds[ep.agentIdx],
          workEpisodeId: episode.id,
          amount: ep.amount,
          verificationLevel: proofStatus as "program_verified" | "merchant_confirmed",
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
      });
    }
  }

  // ─── OPPORTUNITY ASSIGNMENTS (AI matches) ────────────────────────────────
  for (let i = 0; i < Math.min(3, agentIds.length); i++) {
    for (const oppId of oppIds.slice(0, 3)) {
      await prisma.opportunityAssignment.create({
        data: {
          opportunityId: oppId,
          agentId: agentIds[i],
          aiMatchScore: 0.6 + Math.random() * 0.35,
          aiMatchReason: "Strong skill match and local district alignment with opportunity requirements.",
          status: "assigned",
        },
      });
    }
  }

  // ─── AI WORKFLOW LOGS ────────────────────────────────────────────────────
  const aiTypes = [
    "proof_verification", "opportunity_matching", "career_profile",
    "program_monitoring", "fraud_detection", "report_generation",
  ] as const;

  for (let i = 0; i < 24; i++) {
    const wtype = aiTypes[i % aiTypes.length];
    await prisma.aiWorkflowLog.create({
      data: {
        workflowType: wtype,
        entityId: agentIds[i % agentIds.length],
        entityType: "agent",
        success: Math.random() > 0.05,
        inputSummary: `Demo input for ${wtype}`,
        outputSummary: `${wtype} completed — demo data`,
        modelUsed: "gemini-2.5-flash",
        tokensUsed: 200 + Math.floor(Math.random() * 800),
        latencyMs: 800 + Math.floor(Math.random() * 2000),
        autonomousDecision: true,
        createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
      },
    });
  }

  console.log("✅ Seed complete! Demo data labeled as DEMO.");
  console.log("");
  console.log("   Demo logins:");
  console.log("   Agent:     agent@demo.com  / demo1234");
  console.log("   Org Admin: org@demo.com    / demo1234");
  console.log("   Operator:  admin@demo.com  / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
