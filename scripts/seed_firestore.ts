import { db } from "../lib/firebase";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding Firestore / Local Mock database...");

  const pwHash = await bcrypt.hash("demo1234", 12);

  // Helper to safely set collection documents
  const setDoc = async (col: string, id: string, data: any) => {
    // Format Date objects as ISO strings for clean JSON serialization
    const serializedData = JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      })
    );
    await db.collection(col).doc(id).set(serializedData);
  };

  // 1. Users
  const userSeeds = [
    {
      id: "admin_user",
      email: "admin@demo.com",
      name: "Platform Admin",
      phone: "+1 555 000 0001",
      passwordHash: pwHash,
      role: "operator",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "org_user",
      email: "org@demo.com",
      name: "Grace Adams",
      phone: "+1 555 000 0002",
      passwordHash: pwHash,
      role: "org_admin",
      organizationId: "org_uyei",
      createdAt: new Date(),
    },
    {
      id: "agent_sarah",
      email: "agent@demo.com",
      name: "Sarah Jenkins",
      phone: "+1 555 111 0001",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "agent_james",
      email: "james@demo.com",
      name: "James Smith",
      phone: "+1 555 111 0002",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "agent_fatima",
      email: "fatuma@demo.com",
      name: "Fatima Miller",
      phone: "+1 555 111 0003",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "agent_david",
      email: "david@demo.com",
      name: "David Johnson",
      phone: "+1 555 111 0004",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "agent_amina",
      email: "amina@demo.com",
      name: "Amina Davis",
      phone: "+1 555 111 0005",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "agent_peter",
      email: "peter@demo.com",
      name: "Peter Brown",
      phone: "+1 555 111 0006",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "agent_ruth",
      email: "ruth@demo.com",
      name: "Ruth Taylor",
      phone: "+1 555 111 0007",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
    {
      id: "agent_moses",
      email: "moses@demo.com",
      name: "Moses Wilson",
      phone: "+1 555 111 0008",
      passwordHash: pwHash,
      role: "agent",
      organizationId: null,
      createdAt: new Date(),
    },
  ];

  for (const u of userSeeds) {
    await setDoc("users", u.id, u);
  }

  // 2. Organizations
  const orgSeeds = [
    {
      id: "org_uyei",
      name: "Urban Youth Employment Initiative",
      type: "ngo",
      email: "contact@uyei.org",
      country: "Canada",
      subscriptionTier: "cohort_pack",
      stripeCustomerId: "cus_demo_uyei",
      createdAt: new Date(),
    },
    {
      id: "org_wedf",
      name: "Women Entrepreneurs Development Fund",
      type: "foundation",
      email: "info@wedf.org",
      country: "United Kingdom",
      subscriptionTier: "partner",
      stripeCustomerId: "cus_demo_wedf",
      createdAt: new Date(),
    },
    {
      id: "org_dsa",
      name: "Digital Skills Academy",
      type: "school",
      email: "hello@dsa.org",
      country: "Germany",
      subscriptionTier: "free",
      stripeCustomerId: null,
      createdAt: new Date(),
    },
  ];

  for (const o of orgSeeds) {
    await setDoc("organizations", o.id, o);
  }

  // 3. Org Members
  const memberSeeds = [
    {
      id: "member_grace_uyei",
      orgId: "org_uyei",
      userId: "org_user",
      role: "admin",
      createdAt: new Date(),
    },
    {
      id: "member_grace_wedf",
      orgId: "org_wedf",
      userId: "org_user",
      role: "admin",
      createdAt: new Date(),
    },
  ];

  for (const m of memberSeeds) {
    await setDoc("org_members", m.id, m);
  }

  // 4. Org Subscriptions (Stripe-provable revenue)
  const subscriptionSeeds = [
    {
      id: "sub_demo_uyei_001",
      orgId: "org_uyei",
      tier: "cohort_pack",
      priceUsd: 499,
      status: "active",
      stripeSubscriptionId: "sub_demo_uyei_001",
      startedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "sub_demo_wedf_001",
      orgId: "org_wedf",
      tier: "partner",
      priceUsd: 999,
      status: "active",
      stripeSubscriptionId: "sub_demo_wedf_001",
      startedAt: new Date(),
      createdAt: new Date(),
    },
  ];

  for (const sub of subscriptionSeeds) {
    await setDoc("org_subscriptions", sub.id, sub);
  }

  // 5. Agent Profiles
  const agentSeeds = [
    {
      id: "agent_sarah_profile",
      userId: "agent_sarah",
      district: "Central",
      location: "Central",
      skills: ["sales", "photography", "marketing"],
      education: "tertiary",
      gender: "female",
      age: 20,
      bio: "Passionate worker from Central district skilled in sales.",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "agent_james_profile",
      userId: "agent_james",
      district: "Westside",
      location: "Westside",
      skills: ["data_entry", "survey_collection", "customer_support"],
      education: "secondary",
      gender: "male",
      age: 22,
      bio: "Detail-oriented analyst.",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "agent_fatima_profile",
      userId: "agent_fatima",
      district: "Eastside",
      location: "Eastside",
      skills: ["merchant_onboarding", "photography", "marketing"],
      education: "secondary",
      gender: "female",
      age: 24,
      bio: "Skilled in merchant onboarding and photo content creation.",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "agent_david_profile",
      userId: "agent_david",
      district: "Central",
      location: "Central",
      skills: ["delivery", "sales", "customer_support"],
      education: "tertiary",
      gender: "male",
      age: 26,
      bio: "Friendly and highly active driver and sales representative.",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "agent_amina_profile",
      userId: "agent_amina",
      district: "Westside",
      location: "Westside",
      skills: ["survey_collection", "data_entry", "photography"],
      education: "secondary",
      gender: "female",
      age: 28,
      bio: "Dedicated research assistant.",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "agent_peter_profile",
      userId: "agent_peter",
      district: "Northside",
      location: "Northside",
      skills: ["sales", "marketing", "merchant_onboarding"],
      education: "secondary",
      gender: "male",
      age: 30,
      bio: "Local marketer helping shops activate digital profiles.",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "agent_ruth_profile",
      userId: "agent_ruth",
      district: "Southside",
      location: "Southside",
      skills: ["photography", "data_entry", "sales"],
      education: "tertiary",
      gender: "female",
      age: 32,
      bio: "Freelance creator and surveyor.",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "agent_moses_profile",
      userId: "agent_moses",
      district: "Eastside",
      location: "Eastside",
      skills: ["delivery", "customer_support", "survey_collection"],
      education: "secondary",
      gender: "male",
      age: 34,
      bio: "Logistics specialist.",
      status: "active",
      createdAt: new Date(),
    },
  ];

  for (const a of agentSeeds) {
    await setDoc("agent_profiles", a.id, a);
  }

  // 6. Cohorts
  const cohortSeeds = [
    {
      id: "cohort_uyei_2026",
      orgId: "org_uyei",
      name: "Youth Employment Program 2026",
      description: "Training 50 youth in digital merchant services across multiple districts.",
      goalAgents: 50,
      goalEpisodes: 500,
      goalIncome: 25000000,
      status: "active",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      createdAt: new Date(),
    },
    {
      id: "cohort_wedf_2026",
      orgId: "org_wedf",
      name: "Women Entrepreneurship Cohort",
      description: "Empowering 30 women entrepreneurs with digital income skills.",
      goalAgents: 30,
      goalEpisodes: 300,
      goalIncome: 15000000,
      status: "active",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-08-31"),
      createdAt: new Date(),
    },
  ];

  for (const c of cohortSeeds) {
    await setDoc("cohorts", c.id, c);
  }

  // 7. Cohort Enrollments
  const enrollmentSeeds = [
    { id: "enroll_sarah_uyei", cohortId: "cohort_uyei_2026", agentId: "agent_sarah_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_james_uyei", cohortId: "cohort_uyei_2026", agentId: "agent_james_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_fatima_uyei", cohortId: "cohort_uyei_2026", agentId: "agent_fatima_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_david_uyei", cohortId: "cohort_uyei_2026", agentId: "agent_david_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_amina_uyei", cohortId: "cohort_uyei_2026", agentId: "agent_amina_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_peter_uyei", cohortId: "cohort_uyei_2026", agentId: "agent_peter_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_fatima_wedf", cohortId: "cohort_wedf_2026", agentId: "agent_fatima_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_david_wedf", cohortId: "cohort_wedf_2026", agentId: "agent_david_profile", status: "active", enrolledAt: new Date() },
    { id: "enroll_amina_wedf", cohortId: "cohort_wedf_2026", agentId: "agent_amina_profile", status: "active", enrolledAt: new Date() },
  ];

  for (const e of enrollmentSeeds) {
    await setDoc("cohort_enrollments", e.id, e);
  }

  // 8. Merchants
  const merchantSeeds = [
    {
      id: "merchant_pharmacy",
      orgId: "org_uyei",
      name: "City Central Pharmacy",
      phone: "+1 555 001 0001",
      category: "pharmacy",
      district: "Central",
      address: "Main Street, Plot 12",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "merchant_restaurant",
      orgId: "org_uyei",
      name: "Rose's Kitchen Restaurant",
      phone: "+1 555 002 0002",
      category: "restaurant",
      district: "Westside",
      address: "Market Road, Westside",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "merchant_salon",
      orgId: "org_uyei",
      name: "Glamour Beauty Salon",
      phone: "+1 555 003 0003",
      category: "salon",
      district: "Central",
      address: "Fashion Lane, Central",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "merchant_supermarket",
      orgId: "org_uyei",
      name: "Riverside Supermarket",
      phone: "+1 555 004 0004",
      category: "shop",
      district: "Northside",
      address: "River Road, Northside",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "merchant_stall",
      orgId: "org_uyei",
      name: "Downtown Market Stall 44",
      phone: "+1 555 005 0005",
      category: "market",
      district: "Central",
      address: "Central Market",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "merchant_electronics",
      orgId: "org_uyei",
      name: "TechHub Electronics",
      phone: "+1 555 006 0006",
      category: "retail",
      district: "Central",
      address: "Commerce Street",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "merchant_general_store",
      orgId: "org_uyei",
      name: "Northside General Store",
      phone: "+1 555 007 0007",
      category: "shop",
      district: "Northside",
      address: "North Town Center",
      status: "active",
      createdAt: new Date(),
    },
    {
      id: "merchant_agro_supplies",
      orgId: "org_uyei",
      name: "Eastside Agro Supplies",
      phone: "+1 555 008 0008",
      category: "retail",
      district: "Eastside",
      address: "East Market Road",
      status: "active",
      createdAt: new Date(),
    },
  ];

  for (const m of merchantSeeds) {
    await setDoc("merchants", m.id, m);
  }

  // 9. Opportunities
  const oppSeeds = [
    {
      id: "opp_catalog",
      orgId: "org_uyei",
      title: "WhatsApp Business Catalog Setup",
      description: "Help 10 pharmacies and shops create their WhatsApp Business catalogs with photos, prices, and descriptions.",
      serviceType: "catalog_creation",
      amount: 25000,
      skillsRequired: ["photography", "marketing", "merchant_onboarding"],
      district: "Central",
      maxAssignments: 3,
      status: "open",
      createdAt: new Date(),
    },
    {
      id: "opp_outreach",
      orgId: "org_uyei",
      title: "Merchant Outreach — 15 Shops",
      description: "Visit 15 shops and collect their business information for the digital directory.",
      serviceType: "merchant_outreach",
      amount: 15000,
      skillsRequired: ["sales", "customer_support"],
      district: "Westside",
      maxAssignments: 3,
      status: "open",
      createdAt: new Date(),
    },
    {
      id: "opp_survey",
      orgId: "org_uyei",
      title: "Customer Survey Collection",
      description: "Collect 50 customer satisfaction surveys at the downtown market using the mobile app.",
      serviceType: "survey",
      amount: 8000,
      skillsRequired: ["survey_collection", "data_entry"],
      district: "Central",
      maxAssignments: 3,
      status: "open",
      createdAt: new Date(),
    },
    {
      id: "opp_photography",
      orgId: "org_uyei",
      title: "Business Photography Package",
      description: "Take professional product and storefront photos for 5 market vendors.",
      serviceType: "photography",
      amount: 35000,
      skillsRequired: ["photography"],
      district: "Central",
      maxAssignments: 3,
      status: "open",
      createdAt: new Date(),
    },
    {
      id: "opp_presence",
      orgId: "org_uyei",
      title: "Google Business Profile Setup",
      description: "Set up and verify Google Business Profiles for 8 local businesses.",
      serviceType: "digital_presence",
      amount: 20000,
      skillsRequired: ["marketing", "data_entry"],
      district: "Westside",
      maxAssignments: 3,
      status: "open",
      createdAt: new Date(),
    },
  ];

  for (const o of oppSeeds) {
    await setDoc("opportunities", o.id, o);
  }

  // 10. Opportunity Assignments
  const assignmentSeeds = [
    { id: "assign_sarah_catalog", opportunityId: "opp_catalog", agentId: "agent_sarah_profile", aiMatchScore: 0.94, aiMatchReason: "Sarah matches the photography and marketing requirements.", status: "assigned", assignedAt: new Date() },
    { id: "assign_james_survey", opportunityId: "opp_survey", agentId: "agent_james_profile", aiMatchScore: 0.89, aiMatchReason: "James matches the survey and data entry requirements.", status: "assigned", assignedAt: new Date() },
    { id: "assign_fatima_catalog", opportunityId: "opp_catalog", agentId: "agent_fatima_profile", aiMatchScore: 0.91, aiMatchReason: "Fatima matches the photography and marketing requirements.", status: "assigned", assignedAt: new Date() },
    { id: "assign_david_outreach", opportunityId: "opp_outreach", agentId: "agent_david_profile", aiMatchScore: 0.85, aiMatchReason: "David has strong sales experience.", status: "assigned", assignedAt: new Date() },
  ];

  for (const assign of assignmentSeeds) {
    await setDoc("opportunity_assignments", assign.id, assign);
  }

  // 11. Work Episodes
  const episodeSeeds = [
    {
      id: "ep_1",
      agentId: "agent_sarah_profile",
      merchantId: "merchant_pharmacy",
      opportunityId: "opp_catalog",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "WhatsApp Catalog — City Central Pharmacy",
      serviceType: "catalog_creation",
      amount: 25000,
      status: "verified",
      startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ep_2",
      agentId: "agent_james_profile",
      merchantId: "merchant_restaurant",
      opportunityId: "opp_survey",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "Customer Survey — Rose's Kitchen Restaurant",
      serviceType: "survey",
      amount: 8000,
      status: "merchant_confirmed",
      startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      verifiedAt: null,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ep_3",
      agentId: "agent_fatima_profile",
      merchantId: "merchant_salon",
      opportunityId: "opp_photography",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "Product Photography — Glamour Beauty Salon",
      serviceType: "photography",
      amount: 35000,
      status: "paid",
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      verifiedAt: null,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ep_4",
      agentId: "agent_sarah_profile",
      merchantId: "merchant_supermarket",
      opportunityId: "opp_outreach",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "Merchant Outreach — Riverside Supermarket",
      serviceType: "merchant_outreach",
      amount: 15000,
      status: "proof_uploaded",
      startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      verifiedAt: null,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ep_5",
      agentId: "agent_david_profile",
      merchantId: "merchant_stall",
      opportunityId: "opp_survey",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "Survey Collection — Downtown Market",
      serviceType: "survey",
      amount: 8000,
      status: "in_progress",
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deliveredAt: null,
      verifiedAt: null,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ep_6",
      agentId: "agent_amina_profile",
      merchantId: "merchant_electronics",
      opportunityId: "opp_presence",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "Google Business Profile — TechHub Electronics",
      serviceType: "digital_presence",
      amount: 20000,
      status: "merchant_confirmed",
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      verifiedAt: null,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ep_7",
      agentId: "agent_james_profile",
      merchantId: "merchant_general_store",
      opportunityId: "opp_outreach",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "Business Profiling — Northside General Store",
      serviceType: "business_profiling",
      amount: 12000,
      status: "verified",
      startedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(),
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ep_8",
      agentId: "agent_peter_profile",
      merchantId: "merchant_agro_supplies",
      opportunityId: "opp_catalog",
      cohortId: "cohort_uyei_2026",
      orgId: "org_uyei",
      title: "WhatsApp Catalog — Eastside Agro Supplies",
      serviceType: "catalog_creation",
      amount: 25000,
      status: "delivered",
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      verifiedAt: null,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const ep of episodeSeeds) {
    await setDoc("work_episodes", ep.id, {
      ...ep,
      updatedAt: ep.createdAt,
    });
  }

  // 12. Proof Items
  const proofSeeds = [
    {
      id: "proof_1",
      workEpisodeId: "ep_1",
      fileUrl: "/demo/proof_ep_1.jpg",
      fileType: "screenshot",
      fileName: "proof_catalog.jpg",
      fileSizeBytes: 350000,
      aiStatus: "accepted",
      aiConfidence: 0.94,
      aiNotes: "Evidence appears genuine. File type matches catalog_creation service.",
      aiReviewedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "proof_2",
      workEpisodeId: "ep_2",
      fileUrl: "/demo/proof_ep_2.jpg",
      fileType: "pdf",
      fileName: "survey_responses.pdf",
      fileSizeBytes: 420000,
      aiStatus: "accepted",
      aiConfidence: 0.88,
      aiNotes: "Responses complete and detailed.",
      aiReviewedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "proof_3",
      workEpisodeId: "ep_3",
      fileUrl: "/demo/proof_ep_3.jpg",
      fileType: "photo",
      fileName: "storefront.jpg",
      fileSizeBytes: 650000,
      aiStatus: "accepted",
      aiConfidence: 0.92,
      aiNotes: "Photo matches category storefront requirements.",
      aiReviewedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "proof_4",
      workEpisodeId: "ep_4",
      fileUrl: "/demo/proof_ep_4.jpg",
      fileType: "screenshot",
      fileName: "proof_outreach.jpg",
      fileSizeBytes: 280000,
      aiStatus: "pending",
      aiConfidence: null,
      aiNotes: null,
      aiReviewedAt: null,
      createdAt: new Date(),
    },
    {
      id: "proof_6",
      workEpisodeId: "ep_6",
      fileUrl: "/demo/proof_ep_6.jpg",
      fileType: "screenshot",
      fileName: "google_profile.jpg",
      fileSizeBytes: 310000,
      aiStatus: "accepted",
      aiConfidence: 0.95,
      aiNotes: "Verified profile matches listing specifications.",
      aiReviewedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "proof_7",
      workEpisodeId: "ep_7",
      fileUrl: "/demo/proof_ep_7.jpg",
      fileType: "screenshot",
      fileName: "profiling_info.jpg",
      fileSizeBytes: 270000,
      aiStatus: "accepted",
      aiConfidence: 0.91,
      aiNotes: "Profiling info is complete.",
      aiReviewedAt: new Date(),
      createdAt: new Date(),
    },
  ];

  for (const p of proofSeeds) {
    await setDoc("proof_items", p.id, p);
  }

  // 13. Merchant Confirmations
  const confirmationSeeds = [
    {
      id: "conf_1",
      workEpisodeId: "ep_1",
      merchantId: "merchant_pharmacy",
      confirmed: true,
      rating: 5,
      feedback: "Sarah did an amazing job setting up our WhatsApp catalog!",
      confirmedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "conf_2",
      workEpisodeId: "ep_2",
      merchantId: "merchant_restaurant",
      confirmed: true,
      rating: 4,
      feedback: "Great survey work and polite behavior.",
      confirmedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "conf_6",
      workEpisodeId: "ep_6",
      merchantId: "merchant_electronics",
      confirmed: true,
      rating: 5,
      feedback: "Google profile is live now, thank you Amina.",
      confirmedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "conf_7",
      workEpisodeId: "ep_7",
      merchantId: "merchant_general_store",
      confirmed: true,
      rating: 4,
      feedback: "Polite and did it quickly.",
      confirmedAt: new Date(),
      createdAt: new Date(),
    },
  ];

  for (const c of confirmationSeeds) {
    await setDoc("merchant_confirmations", c.id, c);
  }

  // 14. Payments
  const paymentSeeds = [
    {
      id: "pay_1",
      workEpisodeId: "ep_1",
      amount: 25000,
      method: "mobile_money",
      proofUrl: "/demo/pay_ep_1.png",
      proofStatus: "program_verified",
      reference: "PAY100001",
      paidAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "pay_2",
      workEpisodeId: "ep_2",
      amount: 8000,
      method: "cash",
      proofUrl: "/demo/pay_ep_2.png",
      proofStatus: "merchant_confirmed",
      reference: "PAY100002",
      paidAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "pay_3",
      workEpisodeId: "ep_3",
      amount: 35000,
      method: "mobile_money",
      proofUrl: "/demo/pay_ep_3.png",
      proofStatus: "merchant_confirmed",
      reference: "PAY100003",
      paidAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "pay_6",
      workEpisodeId: "ep_6",
      amount: 20000,
      method: "cash",
      proofUrl: "/demo/pay_ep_6.png",
      proofStatus: "merchant_confirmed",
      reference: "PAY100006",
      paidAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: "pay_7",
      workEpisodeId: "ep_7",
      amount: 12000,
      method: "mobile_money",
      proofUrl: "/demo/pay_ep_7.png",
      proofStatus: "program_verified",
      reference: "PAY100007",
      paidAt: new Date(),
      createdAt: new Date(),
    },
  ];

  for (const pay of paymentSeeds) {
    await setDoc("payments", pay.id, pay);
  }

  // 15. Income Ledger
  const ledgerSeeds = [
    {
      id: "ledger_1",
      agentId: "agent_sarah_profile",
      workEpisodeId: "ep_1",
      amount: 25000,
      verificationLevel: "program_verified",
      periodMonth: 6,
      periodYear: 2026,
      createdAt: new Date(),
    },
    {
      id: "ledger_2",
      agentId: "agent_james_profile",
      workEpisodeId: "ep_2",
      amount: 8000,
      verificationLevel: "merchant_confirmed",
      periodMonth: 6,
      periodYear: 2026,
      createdAt: new Date(),
    },
    {
      id: "ledger_3",
      agentId: "agent_fatima_profile",
      workEpisodeId: "ep_3",
      amount: 35000,
      verificationLevel: "merchant_confirmed",
      periodMonth: 6,
      periodYear: 2026,
      createdAt: new Date(),
    },
    {
      id: "ledger_6",
      agentId: "agent_amina_profile",
      workEpisodeId: "ep_6",
      amount: 20000,
      verificationLevel: "merchant_confirmed",
      periodMonth: 6,
      periodYear: 2026,
      createdAt: new Date(),
    },
    {
      id: "ledger_7",
      agentId: "agent_james_profile",
      workEpisodeId: "ep_7",
      amount: 12000,
      verificationLevel: "program_verified",
      periodMonth: 6,
      periodYear: 2026,
      createdAt: new Date(),
    },
  ];

  for (const ledger of ledgerSeeds) {
    await setDoc("income_ledger", ledger.id, ledger);
  }

  // 16. AI Workflow Logs
  const logTypes = [
    "proof_verification",
    "opportunity_matching",
    "career_profile",
    "program_monitoring",
    "fraud_detection",
    "report_generation",
  ];
  for (let i = 0; i < 24; i++) {
    const logId = `log_${i}`;
    const type = logTypes[i % logTypes.length];
    await setDoc("ai_workflow_logs", logId, {
      id: logId,
      workflowType: type,
      entityId: "agent_sarah_profile",
      entityType: "agent",
      success: Math.random() > 0.05,
      inputSummary: `Demo input for ${type}`,
      outputSummary: `${type} completed successfully in simulation.`,
      modelUsed: "gemini-2.5-flash",
      tokensUsed: 200 + Math.floor(Math.random() * 800),
      latencyMs: 800 + Math.floor(Math.random() * 2000),
      autonomousDecision: true,
      createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000),
    });
  }

  // 17. Fraud Flags
  const flagSeeds = [
    {
      id: "flag_1",
      entityId: "ep_3",
      entityType: "work_episode",
      flagType: "suspicious_proof",
      severity: "high",
      description: "Highly duplicate image file detected across multiple uploads.",
      aiGenerated: true,
      resolved: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "flag_2",
      entityId: "agent_moses_profile",
      entityType: "agent",
      flagType: "location_mismatch",
      severity: "medium",
      description: "Agent uploaded proof from location different from assignment region.",
      aiGenerated: true,
      resolved: true,
      resolvedAt: new Date(),
      resolution: "Agent verified they had to travel to client office.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const f of flagSeeds) {
    await setDoc("fraud_flags", f.id, f);
  }

  // 18. Impact Reports
  const reportSeeds = [
    {
      id: "report_1",
      orgId: "org_uyei",
      cohortId: "cohort_uyei_2026",
      reportType: "cohort",
      title: "Youth Employment Program Mid-term Impact",
      content: { summary: "Successfully trained 35 agents with an average income increase of 25%." },
      aiGenerated: true,
      generatedAt: new Date(),
      createdAt: new Date(),
    },
  ];

  for (const rep of reportSeeds) {
    await setDoc("impact_reports", rep.id, rep);
  }

  console.log("✅ Seed complete! Mock data written to Firestore.");
}

main().catch(console.error);
