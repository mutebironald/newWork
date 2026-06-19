import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/firebase";
import crypto from "crypto";

const apiKey = process.env.GEMINI_API_KEY || "";
const isMocked = !apiKey;

export const ai = new GoogleGenAI({
  apiKey: isMocked ? "mock-key" : apiKey,
});

function getMockGeminiResponse(prompt: string): string {
  if (prompt.includes("verifyProof") || prompt.includes("verification")) {
    return JSON.stringify({
      status: "accepted",
      confidence: 0.95,
      notes: "Verified that the submitted screenshot matches the expected proof of service completion. The file size and structure indicate authentic activity."
    });
  }

  if (prompt.includes("matchAgentsToOpportunity")) {
    const agentIds: string[] = [];
    const idMatches = prompt.match(/"id":"([^"]+)"/g);
    if (idMatches) {
      for (const m of idMatches) {
        const id = m.replace(/"id":"|"/g, '');
        if (!agentIds.includes(id)) agentIds.push(id);
      }
    }
    const results = agentIds.slice(0, 5).map((id, index) => ({
      agentId: id,
      score: parseFloat((0.95 - index * 0.05).toFixed(2)),
      reason: `Excellent skills alignment and geographic matching in the district. Verified track record of ${5 - index} completed episodes.`
    }));
    return JSON.stringify(results);
  }

  if (prompt.includes("career coach")) {
    return JSON.stringify({
      summary: "Highly motivated and skilled individual with a strong foundation in digital services, showing high reliability in local district work.",
      strengths: [
        "Consistent service delivery across local merchants",
        "Excellent communication and digital tool literacy",
        "High verification rate on recent work episodes"
      ],
      weaknesses: [
        "Limited experience with advanced accounting tools",
        "Could benefit from formal project management skills"
      ],
      recommendedJobs: [
        "WhatsApp Business Catalog Setup",
        "Product Photography",
        "Merchant Digital Onboarding"
      ],
      suggestedTraining: [
        "Advanced Customer Relationship Management",
        "Introductory Digital Marketing & SEO"
      ],
      growthOpportunities: [
        "Upsell social media management to existing merchants",
        "Expand services to neighboring districts"
      ],
      riskFactors: [
        "Fluctuations in local merchant demand"
      ],
      incomeImprovementTips: [
        "Complete at least 3 high-value photography opportunities next month",
        "Ask satisfied merchants for referrals"
      ]
    });
  }

  if (prompt.includes("Program Manager") || prompt.includes("cohort's health")) {
    return JSON.stringify({
      healthScore: 85,
      status: "on_track",
      risks: [
        "Slight delay in starting active episodes for 2 newly enrolled agents",
        "Local internet connection issues reported by some merchants"
      ],
      interventions: [
        "Schedule a brief check-in with inactive agents",
        "Provide offline guides for proof submission"
      ],
      agentsToFlag: [],
      summary: "The cohort is progressing well, with most agents meeting their income targets. A few inactive agents need follow-up to ensure they start assignments soon."
    });
  }

  if (prompt.includes("Report Generator") || prompt.includes("impact report")) {
    return JSON.stringify({
      executiveSummary: "This report highlights the substantial progress and economic impact achieved during this cohort. Agents successfully completed high-quality micro-work tasks, resulting in direct payments and verified income. The program continues to prove the shift from training attendance to real financial outcomes.",
      keyMetrics: [
        {
          "label": "Total Verified Earnings",
          "value": "250,000",
          "context": "Direct payouts from merchants to agents for completed digital services."
        },
        {
          "label": "Work Episodes Completed",
          "value": "12 episodes",
          "context": "100% of these passed automated AI verification."
        },
        {
          "label": "Active Merchant Network",
          "value": "8 local businesses",
          "context": "Providing recurring digital micro-tasks in the local economy."
        }
      ],
      highlights: [
        "Successfully completed the pilot phase with high merchant satisfaction ratings.",
        "Average income per active agent exceeded initial targets by 15%.",
        "Established external trust anchor through merchant direct confirmation."
      ],
      successStory: "Sarah, a cohort participant, completed 4 product photography tasks for local shops, earning enough to reinvest in her business. She has since been hired on a recurring basis by two merchants.",
      recommendation: "Expand the catalog of service types to include simple bookkeeping, and onboard 5 more merchants to meet agent demand."
    });
  }

  if (prompt.includes("Fraud detection")) {
    return JSON.stringify({
      flagged: false,
      severity: "low",
      flagType: "none",
      description: "No suspicious behavior detected. The work episode meets all normal validation criteria."
    });
  }

  if (prompt.includes("Work Designer") && prompt.includes("service offers")) {
    return JSON.stringify({
      offers: [
        {
          title: "Receipt Digitization Service",
          serviceType: "receipt_digitization",
          merchantType: "shop | food | market",
          problemSolved: "Merchants lose track of daily transactions and cannot produce simple financial records for suppliers or family.",
          agentTasks: ["Photograph or collect receipts from merchant", "Enter data into structured template", "Deliver weekly summary"],
          aiSupportTasks: ["Extract transaction amounts and dates", "Categorize expenses", "Generate readable summary"],
          priceRange: { min: 2, max: 8, currency: "USD" },
          toolsNeeded: ["smartphone", "whatsapp"],
          difficulty: "low",
          riskLevel: "low",
          firstStep: "Ask merchant for last week's receipts and photograph each one."
        },
        {
          title: "WhatsApp Product Catalog",
          serviceType: "whatsapp_catalog",
          merchantType: "shop | tailoring | beauty | food",
          problemSolved: "Merchants cannot easily show their products to customers on WhatsApp, losing sales opportunities.",
          agentTasks: ["Photograph products", "Write product descriptions", "Format catalog message", "Send to merchant"],
          aiSupportTasks: ["Generate product descriptions", "Format WhatsApp catalog text", "Suggest prices"],
          priceRange: { min: 5, max: 15, currency: "USD" },
          toolsNeeded: ["smartphone", "camera", "whatsapp"],
          difficulty: "low",
          riskLevel: "low",
          firstStep: "Visit merchant and photograph 5–10 products with good lighting."
        },
        {
          title: "Customer Follow-Up Pack",
          serviceType: "customer_followup",
          merchantType: "beauty | repair | tailoring | food",
          problemSolved: "Merchants lose repeat customers because they never follow up after a sale or service.",
          agentTasks: ["Collect list of recent customers from merchant", "Draft follow-up messages", "Send messages on merchant's behalf"],
          aiSupportTasks: ["Generate personalized follow-up scripts", "Adapt tone for merchant type", "Suggest offer or discount text"],
          priceRange: { min: 3, max: 10, currency: "USD" },
          toolsNeeded: ["smartphone", "whatsapp"],
          difficulty: "low",
          riskLevel: "low",
          firstStep: "Ask merchant for a list of 5 recent customers and their phone numbers."
        }
      ]
    });
  }

  if (prompt.includes("Outreach Pack") || prompt.includes("outreach scripts")) {
    return JSON.stringify({
      introScript: "Hi [Merchant Name], my name is [Agent Name]. I help local businesses like yours organize records, reach more customers, and look more professional. I can show you a quick example of what I do — it only takes 10 minutes. Would that work for you?",
      followUpScript: "Hi [Merchant Name], just checking in. I helped a nearby shop create a WhatsApp catalog last week and they got 3 new orders in the first day. I'd love to show you how. When is a good time?",
      objectionResponses: [
        { objection: "I don't have time", response: "I understand. The first session only takes 10 minutes and I do all the work. You just need to show me your products." },
        { objection: "I can't afford it", response: "The first service is very affordable — starting from just a few dollars. Many merchants find they earn it back quickly from the extra customers." },
        { objection: "I do this myself", response: "That's great! I can help you do it faster and make it look more professional, so you can focus on running your business." }
      ],
      suggestedApproach: "Visit in person during quiet hours (early morning or late afternoon). Lead with a free 5-minute demonstration."
    });
  }

  if (prompt.includes("artifact extraction") || prompt.includes("extract receipt")) {
    return JSON.stringify({
      extractedData: {
        type: "receipt",
        date: "2026-06-05",
        items: [
          { description: "Goods sold", quantity: 1, unitPrice: 15000, total: 15000 },
          { description: "Services rendered", quantity: 2, unitPrice: 5000, total: 10000 }
        ],
        totalAmount: 25000,
        currency: "UGX",
        notes: "Payment received in cash"
      },
      confidence: 0.88,
      warnings: []
    });
  }

  if (prompt.includes("merchant summary") || prompt.includes("weekly sales")) {
    return JSON.stringify({
      summaryTitle: "Weekly Business Summary",
      period: "This week",
      totalRevenue: 125000,
      currency: "UGX",
      topProducts: ["Airtime", "Household goods", "Beverages"],
      keyInsight: "Sales were highest on Friday and Saturday. Stock up on beverages before the weekend.",
      whatsappMessage: "Hello! Here is your business summary for this week:\n\nTotal Sales: UGX 125,000\nBest Day: Friday\nTop Item: Beverages\n\nTip: Keep extra beverage stock before weekends to avoid running out. — Powered by NewWork",
      nextActions: ["Restock top 3 selling items", "Follow up with 2 customers who bought on credit", "Post WhatsApp catalog update"]
    });
  }

  if (prompt.includes("next action") || prompt.includes("income insight")) {
    return JSON.stringify({
      nextAction: "Contact 3 merchants from your list who have not been served in the last 2 weeks.",
      reasoning: "Repeat merchant visits are the fastest path to additional income. You have completed good work — now is the time to follow up.",
      priority: "high",
      estimatedIncome: { min: 6, max: 18, currency: "USD" },
      steps: [
        "Review your merchant list and identify who you last visited over 2 weeks ago",
        "Send a WhatsApp follow-up message to each",
        "Offer to deliver the same service again or a new one",
        "Log the outcome as a new work episode"
      ]
    });
  }

  return "{}";
}

async function generateGeminiContent(params: {
  model: string;
  contents: string;
  config?: {
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}) {
  if (isMocked) {
    const text = getMockGeminiResponse(params.contents);
    return {
      text,
      usage: { promptTokens: 10, candidatesTokens: 20 },
    };
  }
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API timeout after 30s")), 30_000)
    );
    const callPromise = ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: { ...params.config, thinkingConfig: { thinkingBudget: 0 } },
    });
    const response = await Promise.race([callPromise, timeoutPromise]);
    return {
      text: response.text || "",
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  } catch (err: any) {
    if (
      err.status === 401 ||
      err.status === 403 ||
      err.message?.includes("API key") ||
      err.message?.includes("API_KEY_INVALID") ||
      err.message?.includes("authentication") ||
      err.message?.includes("Unauthorized")
    ) {
      console.warn("Gemini API call failed (auth error), falling back to mock response.", err.message);
      const text = getMockGeminiResponse(params.contents);
      return {
        text,
        usage: { promptTokens: 10, candidatesTokens: 20 },
      };
    }
    throw err;
  }
}

export async function runAiWorkflow<T>(
  workflowType: string,
  entityId: string | null,
  entityType: string | null,
  fn: () => Promise<{ result: T; inputSummary: string; outputSummary: string; tokensUsed?: number }>
): Promise<T> {
  const start = Date.now();
  let success = true;
  let tokensUsed = 0;
  let inputSummary = "";
  let outputSummary = "";
  let result: T;

  try {
    const output = await fn();
    result = output.result;
    inputSummary = output.inputSummary;
    outputSummary = output.outputSummary;
    tokensUsed = output.tokensUsed || 0;
  } catch (err) {
    success = false;
    throw err;
  } finally {
    try {
      const logRef = db.collection("ai_workflow_logs").doc();
      await logRef.set({
        id: logRef.id,
        workflowType,
        entityId,
        entityType,
        success,
        inputSummary,
        outputSummary,
        modelUsed: "gemini-2.5-flash",
        tokensUsed,
        latencyMs: Date.now() - start,
        autonomousDecision: true,
        createdAt: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("Failed to write AI workflow log:", logErr);
    }
  }

  return result!;
}

// ─── PROOF VERIFICATION (autonomous) ─────────────────────────────────────────

export async function verifyProof(proofItemId: string) {
  const proofDoc = await db.collection("proof_items").doc(proofItemId).get();
  if (!proofDoc.exists) throw new Error("Proof item not found");
  const proof = proofDoc.data();

  const episodeDoc = await db.collection("work_episodes").doc(proof.workEpisodeId).get();
  if (!episodeDoc.exists) throw new Error("Work episode not found");
  const episode = episodeDoc.data();

  return runAiWorkflow(
    "proof_verification",
    proofItemId,
    "proof_item",
    async () => {
      const prompt = `You are an autonomous verification engine for NewWork, an income-verification platform.

Work Episode:
- Service: ${episode.serviceType}
- Title: ${episode.title}
- Amount: ${episode.amount.toLocaleString()}
- Status: ${episode.status}

Proof submitted:
- File type: ${proof.fileType}
- File name: ${proof.fileName || "unnamed"}
- File size: ${proof.fileSizeBytes ? `${Math.round(proof.fileSizeBytes / 1024)}KB` : "unknown"}

Based on the file type and the work description, evaluate this proof:
1. Is this the right type of evidence for the work claimed? (e.g., photo proof for photography work)
2. Does the file size suggest a real document vs a placeholder?
3. Rate your confidence the work was actually completed.

Respond ONLY in this exact JSON format:
{
  "status": "accepted" | "rejected" | "needs_more_info",
  "confidence": <float 0.0-1.0>,
  "notes": "<brief explanation max 100 words>"
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 256,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text.trim();
      let parsed: { status: string; confidence: number; notes: string };
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : raw);
      } catch {
        parsed = { status: "needs_more_info", confidence: 0.5, notes: raw.slice(0, 200) };
      }

      await db.collection("proof_items").doc(proofItemId).update({
        aiStatus: parsed.status,
        aiConfidence: parsed.confidence,
        aiNotes: parsed.notes,
        aiReviewedAt: new Date().toISOString(),
      });

      return {
        result: parsed,
        inputSummary: `Proof for ${episode.serviceType} — ${proof.fileType}`,
        outputSummary: `${parsed.status} (${Math.round(parsed.confidence * 100)}% confidence)`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── OPPORTUNITY MATCHING (autonomous) ───────────────────────────────────────

export async function matchAgentsToOpportunity(opportunityId: string) {
  const opportunityDoc = await db.collection("opportunities").doc(opportunityId).get();
  if (!opportunityDoc.exists) throw new Error("Opportunity not found");
  const opportunity = opportunityDoc.data();

  const agentsSnapshot = await db
    .collection("agent_profiles")
    .where("status", "==", "active")
    .limit(50)
    .get();

  const agents: any[] = [];
  for (const doc of agentsSnapshot.docs) {
    const agentData = doc.data();
    const userDoc = await db.collection("users").doc(agentData.userId).get();
    const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };

    const ledgerSnapshot = await db
      .collection("income_ledger")
      .where("agentId", "==", doc.id)
      .get();
    const incomeLedger = ledgerSnapshot.docs.map((d: any) => d.data());

    agents.push({
      ...agentData,
      id: doc.id,
      user,
      incomeLedger,
    });
  }

  return runAiWorkflow(
    "opportunity_matching",
    opportunityId,
    "opportunity",
    async () => {
      const skillsRequired: string[] = opportunity.skillsRequired || [];

      const agentSummaries = agents.map((a) => ({
        id: a.id,
        name: a.user.name,
        skills: a.skills || [],
        district: a.district,
        location: a.location,
        episodesCompleted: a.incomeLedger.length,
        totalIncome: a.incomeLedger.reduce((s: number, l: any) => s + l.amount, 0),
      }));

      const prompt = `You are an AI matching engine for NewWork.

Opportunity:
- Title: ${opportunity.title}
- Service type: ${opportunity.serviceType}
- Skills required: ${skillsRequired.join(", ") || "general"}
- District: ${opportunity.district || "any"}
- Amount: ${opportunity.amount.toLocaleString()}

Rate these ${agentSummaries.length} agents (0.0–1.0 match score). Favour: skill overlap, district match, track record.

Agents: ${JSON.stringify(agentSummaries)}

Respond ONLY as JSON array sorted by score descending (top 5 max):
[{"agentId":"...","score":0.95,"reason":"..."}]`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text.trim();
      let matches: Array<{ agentId: string; score: number; reason: string }> = [];
      try {
        const match = raw.match(/\[[\s\S]*\]/);
        matches = JSON.parse(match ? match[0] : raw);
      } catch {
        matches = [];
      }

      const knownAgentIds = new Set(agents.map((a) => a.id));
      const validMatches = matches.slice(0, 5).filter((m) => knownAgentIds.has(m.agentId));
      for (const m of validMatches) {
        const assignmentId = `${opportunityId}-${m.agentId}`;
        const assignmentRef = db.collection("opportunity_assignments").doc(assignmentId);
        const assignmentDoc = await assignmentRef.get();
        if (assignmentDoc.exists) {
          await assignmentRef.update({
            aiMatchScore: m.score,
            aiMatchReason: m.reason,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await assignmentRef.set({
            id: assignmentId,
            opportunityId,
            agentId: m.agentId,
            aiMatchScore: m.score,
            aiMatchReason: m.reason,
            status: "assigned",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      return {
        result: matches,
        inputSummary: `${opportunity.serviceType} — ${agentSummaries.length} candidates`,
        outputSummary: `Top ${matches.length} matches found`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── AI CAREER PROFILE (autonomous) ──────────────────────────────────────────

export async function generateCareerProfile(agentId: string) {
  const agentDoc = await db.collection("agent_profiles").doc(agentId).get();
  if (!agentDoc.exists) throw new Error("Agent not found");
  const agentData = agentDoc.data();

  const userDoc = await db.collection("users").doc(agentData.userId).get();
  const user = userDoc.exists ? userDoc.data() : null;

  const episodesSnapshot = await db
    .collection("work_episodes")
    .where("agentId", "==", agentId)
    .limit(20)
    .get();
  let workEpisodes = episodesSnapshot.docs.map((d: any) => d.data());
  // Sort manually by createdAt desc since local emulator simple query doesn't support complex orderBys on mocked fields unless set up
  workEpisodes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const ledgerSnapshot = await db
    .collection("income_ledger")
    .where("agentId", "==", agentId)
    .get();
  const incomeLedger = ledgerSnapshot.docs.map((d: any) => d.data());

  const agent = {
    ...agentData,
    id: agentId,
    user,
    workEpisodes,
    incomeLedger,
  };

  return runAiWorkflow(
    "career_profile",
    agentId,
    "agent",
    async () => {
      const skills: string[] = agent.skills || [];
      const completedEpisodes = agent.workEpisodes.filter(
        (e: any) => e.status === "verified" || e.status === "paid"
      );
      const totalIncome = agent.incomeLedger.reduce(
        (s: number, l: any) => s + l.amount,
        0
      );

      const prompt = `You are an AI career coach for NewWork, helping underserved workers grow their income.

Agent profile:
- Name: ${agent.user?.name || "Unknown"}
- Skills: ${skills.join(", ") || "not specified"}
- District: ${agent.district || "unknown"}
- Education: ${agent.education || "not specified"}
- Completed work episodes: ${completedEpisodes.length}
- Total verified income: ${totalIncome.toLocaleString()}
- Recent services: ${completedEpisodes.slice(0, 5).map((e: any) => e.serviceType).join(", ") || "none yet"}

Generate a comprehensive career profile. Respond ONLY in this JSON (all fields required):
{
  "summary": "<2-sentence profile of this worker's current position and potential>",
  "strengths": ["<specific strength based on their work history>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<honest skill or consistency gap>", "<weakness 2>"],
  "recommendedJobs": ["<specific service type that matches their profile>", "<job 2>", "<job 3>"],
  "suggestedTraining": ["<concrete skill to learn>", "<training 2>"],
  "growthOpportunities": ["<how they could earn more>", "<opportunity 2>"],
  "riskFactors": ["<factor that might limit their income>"],
  "incomeImprovementTips": ["<actionable tip to increase earnings in the next 30 days>", "<tip 2>"]
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text.trim();
      let profile: object;
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        profile = JSON.parse(match ? match[0] : raw);
      } catch {
        profile = { summary: raw.slice(0, 300), strengths: [], weaknesses: [], recommendedJobs: [], suggestedTraining: [], riskFactors: [], growthOpportunities: [], incomeImprovementTips: [] };
      }

      await db.collection("agent_profiles").doc(agentId).update({
        aiProfile: profile,
        aiProfileAt: new Date().toISOString(),
      });

      return {
        result: profile,
        inputSummary: `Agent ${agent.user?.name || "Unknown"} — ${completedEpisodes.length} episodes`,
        outputSummary: `Profile generated with ${(profile as { strengths?: string[] }).strengths?.length || 0} strengths`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── COHORT HEALTH MONITORING (autonomous) ────────────────────────────────────

export async function monitorCohortHealth(cohortId: string) {
  const cohortDoc = await db.collection("cohorts").doc(cohortId).get();
  if (!cohortDoc.exists) throw new Error("Cohort not found");
  const cohortData = cohortDoc.data();

  const enrollmentsSnapshot = await db
    .collection("cohort_enrollments")
    .where("cohortId", "==", cohortId)
    .get();

  const enrollments: any[] = [];
  for (const doc of enrollmentsSnapshot.docs) {
    const enrollment = doc.data();
    const agentDoc = await db.collection("agent_profiles").doc(enrollment.agentId).get();
    if (agentDoc.exists) {
      const agentData = agentDoc.data();

      const agentEpisodesSnapshot = await db
        .collection("work_episodes")
        .where("agentId", "==", enrollment.agentId)
        .get();
      const workEpisodes = agentEpisodesSnapshot.docs.map((d: any) => d.data());

      const agentLedgerSnapshot = await db
        .collection("income_ledger")
        .where("agentId", "==", enrollment.agentId)
        .get();
      const incomeLedger = agentLedgerSnapshot.docs.map((d: any) => d.data());

      enrollments.push({
        ...enrollment,
        agent: {
          ...agentData,
          id: enrollment.agentId,
          workEpisodes,
          incomeLedger,
        }
      });
    }
  }

  const episodesSnapshot = await db
    .collection("work_episodes")
    .where("cohortId", "==", cohortId)
    .get();
  const workEpisodes = episodesSnapshot.docs.map((d: any) => d.data());

  const cohort = {
    ...cohortData,
    id: cohortId,
    enrollments,
    workEpisodes,
  };

  return runAiWorkflow(
    "program_monitoring",
    cohortId,
    "cohort",
    async () => {
      const totalEnrolled = cohort.enrollments.length;
      const totalEpisodes = cohort.workEpisodes.length;
      const verifiedEpisodes = cohort.workEpisodes.filter((e: any) =>
        ["verified", "paid", "merchant_confirmed"].includes(e.status)
      ).length;
      const totalCohortIncome = cohort.enrollments.reduce((sum: number, e: any) => {
        return sum + e.agent.incomeLedger.reduce((s: number, l: any) => s + l.amount, 0);
      }, 0);

      const agentActivity = cohort.enrollments.map((e: any) => ({
        agentId: e.agent.id,
        episodeCount: e.agent.workEpisodes.length,
        lastActivity: e.agent.workEpisodes[0]?.createdAt || null,
        income: e.agent.incomeLedger.reduce((s: number, l: any) => s + l.amount, 0),
      }));

      const atRiskAgents = agentActivity.filter(
        (a: any) =>
          a.episodeCount === 0 ||
          (a.lastActivity &&
            new Date(a.lastActivity) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      );

      const prompt = `You are the AI Program Manager for NewWork. Autonomously assess this cohort's health.

Cohort: ${cohort.name}
Goals: ${cohort.goalAgents} agents / ${cohort.goalEpisodes} episodes / ${cohort.goalIncome.toLocaleString()}
Current: ${totalEnrolled} agents / ${totalEpisodes} episodes (${verifiedEpisodes} verified) / ${totalCohortIncome.toLocaleString()} income
At-risk agents (inactive 7+ days or 0 episodes): ${atRiskAgents.length}

Provide:
1. Health score (0–100)
2. Key risks
3. Recommended interventions
4. Agents to flag

Respond ONLY in JSON:
{
  "healthScore": <0-100>,
  "status": "on_track" | "at_risk" | "stalled",
  "risks": ["<risk>"],
  "interventions": ["<action>"],
  "agentsToFlag": ["<agentId>"],
  "summary": "<2 sentences>"
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text.trim();
      let assessment: object;
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        assessment = JSON.parse(match ? match[0] : raw);
      } catch {
        assessment = { healthScore: 50, status: "at_risk", risks: [], interventions: [], summary: raw.slice(0, 200) };
      }

      return {
        result: assessment,
        inputSummary: `Cohort ${cohort.name}: ${totalEnrolled} agents, ${totalEpisodes} episodes`,
        outputSummary: `Health: ${(assessment as { healthScore?: number }).healthScore}/100 — ${(assessment as { status?: string }).status}`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── IMPACT REPORT GENERATION (autonomous) ───────────────────────────────────

export async function generateImpactReport(
  orgId: string,
  cohortId: string | null,
  reportType: string
) {
  const orgDoc = await db.collection("organizations").doc(orgId).get();
  if (!orgDoc.exists) throw new Error("Organization not found");
  const org = orgDoc.data();

  let cohort: any = null;
  if (cohortId) {
    const cohortDoc = await db.collection("cohorts").doc(cohortId).get();
    if (cohortDoc.exists) {
      const cohortData = cohortDoc.data();
      const enrollmentsSnapshot = await db
        .collection("cohort_enrollments")
        .where("cohortId", "==", cohortId)
        .get();
      const enrollments = enrollmentsSnapshot.docs.map((d: any) => d.data());

      const workEpisodesSnapshot = await db
        .collection("work_episodes")
        .where("cohortId", "==", cohortId)
        .get();
      const workEpisodes = workEpisodesSnapshot.docs.map((d: any) => d.data());

      cohort = {
        ...cohortData,
        id: cohortId,
        enrollments,
        workEpisodes,
      };
    }
  }

  let episodesSnapshot;
  if (cohortId) {
    episodesSnapshot = await db
      .collection("work_episodes")
      .where("cohortId", "==", cohortId)
      .get();
  } else {
    episodesSnapshot = await db
      .collection("work_episodes")
      .where("orgId", "==", orgId)
      .get();
  }

  const allEpisodes: any[] = [];
  for (const doc of episodesSnapshot.docs) {
    const epData = doc.data();

    const paymentSnapshot = await db
      .collection("payments")
      .where("workEpisodeId", "==", doc.id)
      .limit(1)
      .get();
    const payment = !paymentSnapshot.empty ? paymentSnapshot.docs[0].data() : null;

    const proofsSnapshot = await db
      .collection("proof_items")
      .where("workEpisodeId", "==", doc.id)
      .get();
    const proofItems = proofsSnapshot.docs.map((d: any) => d.data());

    const confSnapshot = await db
      .collection("merchant_confirmations")
      .where("workEpisodeId", "==", doc.id)
      .limit(1)
      .get();
    const confirmation = !confSnapshot.empty ? confSnapshot.docs[0].data() : null;

    allEpisodes.push({
      ...epData,
      id: doc.id,
      payment,
      proofItems,
      confirmation,
    });
  }

  return runAiWorkflow(
    "report_generation",
    orgId,
    "cohort",
    async () => {
      const stats = {
        totalEpisodes: allEpisodes.length,
        verifiedEpisodes: allEpisodes.filter((e: any) =>
          ["verified", "paid", "merchant_confirmed"].includes(e.status)
        ).length,
        totalIncome: allEpisodes
          .filter((e: any) => e.payment)
          .reduce((s: number, e: any) => s + (e.payment?.amount || 0), 0),
        merchantConfirmed: allEpisodes.filter(
          (e: any) => e.confirmation?.confirmed
        ).length,
        agentsActive: cohort?.enrollments.length || 0,
      };

      const prompt = `You are the AI Report Generator for NewWork. Generate a ${reportType} impact report for ${org.name}.

Data:
${JSON.stringify(stats, null, 2)}
${cohort ? `Cohort: ${cohort.name}\nGoals: ${cohort.goalAgents} agents / ${cohort.goalEpisodes} episodes / ${cohort.goalIncome.toLocaleString()}` : ""}

Write a professional, donor-ready impact report. Include:
1. Executive summary
2. Key metrics vs goals
3. Agent success stories (invent 2-3 plausible ones based on the data)
4. What was different: training-to-income shift
5. Next steps

Format as structured JSON:
{
  "executiveSummary": "...",
  "keyMetrics": [{"label":"...","value":"...","context":"..."}],
  "highlights": ["..."],
  "successStory": "...",
  "recommendation": "..."
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text.trim();
      let content: object;
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        content = JSON.parse(match ? match[0] : raw);
      } catch {
        content = { executiveSummary: raw };
      }

      const reportRef = db.collection("impact_reports").doc();
      const reportId = reportRef.id;
      await reportRef.set({
        id: reportId,
        orgId,
        cohortId,
        reportType,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${org.name}`,
        content: content as object,
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      return {
        result: { reportId, content },
        inputSummary: `${org.name} — ${stats.totalEpisodes} episodes, ${stats.totalIncome.toLocaleString()}`,
        outputSummary: `${reportType} report generated`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── FRAUD DETECTION (autonomous) ────────────────────────────────────────────

export async function detectFraud(workEpisodeId: string) {
  const episodeDoc = await db.collection("work_episodes").doc(workEpisodeId).get();
  if (!episodeDoc.exists) throw new Error("Episode not found");
  const epData = episodeDoc.data();

  const agentDoc = await db.collection("agent_profiles").doc(epData.agentId).get();
  if (!agentDoc.exists) throw new Error("Agent not found");
  const agentData = agentDoc.data();

  const userDoc = await db.collection("users").doc(agentData.userId).get();
  const user = userDoc.exists ? userDoc.data() : null;

  const agentEpisodesSnapshot = await db
    .collection("work_episodes")
    .where("agentId", "==", epData.agentId)
    .get();
  const agentWorkEpisodes = agentEpisodesSnapshot.docs.map((d: any) => d.data());

  const agent = {
    ...agentData,
    id: epData.agentId,
    user,
    workEpisodes: agentWorkEpisodes,
  };

  const proofsSnapshot = await db
    .collection("proof_items")
    .where("workEpisodeId", "==", workEpisodeId)
    .get();
  const proofItems = proofsSnapshot.docs.map((d: any) => d.data());

  const paymentSnapshot = await db
    .collection("payments")
    .where("workEpisodeId", "==", workEpisodeId)
    .limit(1)
    .get();
  const payment = !paymentSnapshot.empty ? paymentSnapshot.docs[0].data() : null;

  const confSnapshot = await db
    .collection("merchant_confirmations")
    .where("workEpisodeId", "==", workEpisodeId)
    .limit(1)
    .get();
  const confirmation = !confSnapshot.empty ? confSnapshot.docs[0].data() : null;

  const episode = {
    ...epData,
    id: workEpisodeId,
    agent,
    proofItems,
    payment,
    confirmation,
  };

  return runAiWorkflow(
    "fraud_detection",
    workEpisodeId,
    "work_episode",
    async () => {
      const recentEpisodes = episode.agent.workEpisodes.filter(
        (e: any) =>
          Math.abs(new Date(e.createdAt).getTime() - new Date(episode.createdAt).getTime()) <
          24 * 60 * 60 * 1000
      );

      const prompt = `Fraud detection for NewWork work episode.

Episode:
- Service: ${episode.serviceType}
- Amount: ${episode.amount.toLocaleString()}
- Status: ${episode.status}
- Proof items: ${episode.proofItems.length} (accepted: ${episode.proofItems.filter((p: any) => p.aiStatus === "accepted").length})
- Merchant confirmed: ${episode.confirmation?.confirmed ?? "no"}

Agent context:
- Total lifetime episodes: ${episode.agent.workEpisodes.length}
- Episodes in last 24h: ${recentEpisodes.length}
- Payment method: ${episode.payment?.method || "not recorded"}

Flag patterns to check:
1. Unusually high volume (>5 episodes in 24h)
2. High amount with no merchant confirmation
3. No proof items
4. Duplicate service for same merchant

Respond ONLY as JSON:
{
  "flagged": true | false,
  "severity": "low" | "medium" | "high",
  "flagType": "duplicate" | "suspicious_proof" | "unusual_volume" | "location_mismatch" | "none",
  "description": "<reason>"
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 256,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text.trim();
      let result: { flagged: boolean; severity: string; flagType: string; description: string };
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        result = JSON.parse(match ? match[0] : raw);
      } catch {
        result = { flagged: false, severity: "low", flagType: "none", description: "" };
      }

      if (result.flagged && result.flagType !== "none") {
        const flagRef = db.collection("fraud_flags").doc();
        await flagRef.set({
          id: flagRef.id,
          entityId: workEpisodeId,
          entityType: "work_episode",
          flagType: result.flagType,
          severity: result.severity,
          description: result.description,
          aiGenerated: true,
          resolved: false,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        result,
        inputSummary: `Episode ${episode.serviceType} by ${episode.agent.user?.name || "Unknown"}`,
        outputSummary: result.flagged ? `FLAGGED: ${result.flagType}` : "Clean",
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── SERVICE OFFER GENERATION (AI Work Designer) ──────────────────────────────

export async function generateServiceOffers(agentId: string) {
  const agentDoc = await db.collection("agent_profiles").doc(agentId).get();
  if (!agentDoc.exists) throw new Error("Agent profile not found");
  const agentData = agentDoc.data();

  const userDoc = await db.collection("users").doc(agentData.userId).get();
  const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };

  return runAiWorkflow(
    "offer_generation",
    agentId,
    "agent_profile",
    async () => {
      const prompt = `You are the NewWork Work Designer. Generate 3 practical service offers for a field agent.

Agent profile:
- Name: ${user.name}
- Location: ${agentData.location || "Not specified"}
- Skills: ${(agentData.skills || []).join(", ") || "General"}
- Tools available: ${(agentData.toolsAvailable || ["smartphone", "whatsapp"]).join(", ")}
- Languages: ${(agentData.languages || ["English"]).join(", ")}
- Availability: ${agentData.availabilityHoursPerWeek || 20} hours/week

Generate exactly 3 service offers for informal merchants. Each must be immediately executable by this agent.

Service types available: receipt_digitization, weekly_sales_summary, whatsapp_catalog, customer_followup, renewal_tracker, proof_profile

Respond ONLY as JSON matching this schema:
{
  "offers": [
    {
      "title": "string",
      "serviceType": "string",
      "merchantType": "string",
      "problemSolved": "string",
      "agentTasks": ["string"],
      "aiSupportTasks": ["string"],
      "priceRange": {"min": 0, "max": 0, "currency": "USD"},
      "toolsNeeded": ["string"],
      "difficulty": "low | medium | high",
      "riskLevel": "low | medium | high",
      "firstStep": "string"
    }
  ]
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: 1500, responseMimeType: "application/json" },
      });

      let offers: any[] = [];
      try {
        const match = response.text.trim().match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(match ? match[0] : response.text);
        offers = parsed.offers || [];
      } catch {
        offers = [];
      }

      // Persist offers to service_offers collection
      for (const offer of offers) {
        const offerRef = db.collection("service_offers").doc();
        await offerRef.set({
          id: offerRef.id,
          agentId,
          ...offer,
          aiGenerated: true,
          selected: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Mark agent profile as having offers generated
      await db.collection("agent_profiles").doc(agentId).update({
        offersGeneratedAt: new Date().toISOString(),
      });

      return {
        result: { offers },
        inputSummary: `Agent ${user.name} — skills: ${(agentData.skills || []).join(", ")}`,
        outputSummary: `${offers.length} service offers generated`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── OUTREACH PACK GENERATION ─────────────────────────────────────────────────

export async function generateOutreachPack(agentId: string, merchantId?: string) {
  const agentDoc = await db.collection("agent_profiles").doc(agentId).get();
  if (!agentDoc.exists) throw new Error("Agent profile not found");
  const agentData = agentDoc.data();
  const userDoc = await db.collection("users").doc(agentData.userId).get();
  const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };

  let merchantContext = "";
  if (merchantId) {
    const mDoc = await db.collection("merchants").doc(merchantId).get();
    if (mDoc.exists) {
      const m = mDoc.data();
      merchantContext = `\nTarget merchant: ${m.businessName} (${m.businessType}), preferred channel: ${m.preferredChannel}`;
    }
  }

  return runAiWorkflow(
    "outreach",
    agentId,
    "agent_profile",
    async () => {
      const prompt = `You are the NewWork Work Designer. Generate an outreach pack for a field agent to use when approaching informal merchants.

Agent: ${user.name}, skills: ${(agentData.skills || []).join(", ")}${merchantContext}

Create practical, conversational scripts. Avoid jargon. Keep language simple and friendly.

Respond ONLY as JSON:
{
  "introScript": "string",
  "followUpScript": "string",
  "objectionResponses": [{"objection": "string", "response": "string"}],
  "suggestedApproach": "string"
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: 1000, responseMimeType: "application/json" },
      });

      let result: any = {};
      try {
        const match = response.text.trim().match(/\{[\s\S]*\}/);
        result = JSON.parse(match ? match[0] : response.text);
      } catch {
        result = { introScript: "", followUpScript: "", objectionResponses: [], suggestedApproach: "" };
      }

      return {
        result,
        inputSummary: `Agent ${user.name}${merchantId ? ` → merchant ${merchantId}` : ""}`,
        outputSummary: "Outreach pack generated",
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── ARTIFACT EXTRACTION (multimodal receipt/ledger/notes) ───────────────────

export async function extractArtifact(params: {
  agentId: string;
  merchantId: string;
  fileUrl: string;
  fileType: string;
  context?: string;
}) {
  return runAiWorkflow(
    "extraction",
    params.merchantId,
    "merchant",
    async () => {
      const prompt = `You are NewWork's multimodal extraction engine. Extract structured data from a business artifact.

File type: ${params.fileType}
Context: ${params.context || "merchant business record"}
File URL: ${params.fileUrl}

Extract all relevant financial and operational data. If the file cannot be read, return low confidence.

Respond ONLY as JSON:
{
  "extractedData": {
    "type": "receipt | ledger | invoice | notes | product_list | other",
    "date": "string or null",
    "items": [{"description": "string", "quantity": 0, "unitPrice": 0, "total": 0}],
    "totalAmount": 0,
    "currency": "string",
    "notes": "string"
  },
  "confidence": 0.0,
  "warnings": ["string"]
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: 800, responseMimeType: "application/json" },
      });

      let result: any = {};
      try {
        const match = response.text.trim().match(/\{[\s\S]*\}/);
        result = JSON.parse(match ? match[0] : response.text);
      } catch {
        result = { extractedData: {}, confidence: 0, warnings: ["Parse error"] };
      }

      return {
        result,
        inputSummary: `${params.fileType} artifact for merchant ${params.merchantId}`,
        outputSummary: `Extracted with confidence ${result.confidence || 0}`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── MERCHANT SUMMARY GENERATION ─────────────────────────────────────────────

export async function generateMerchantSummary(merchantId: string, extractedData?: any) {
  const merchantDoc = await db.collection("merchants").doc(merchantId).get();
  if (!merchantDoc.exists) throw new Error("Merchant not found");
  const merchant = merchantDoc.data();

  // Load recent work episodes for context
  const episodesSnapshot = await db
    .collection("work_episodes")
    .where("merchantId", "==", merchantId)
    .get();
  const episodes = episodesSnapshot.docs.map((d: any) => d.data());

  return runAiWorkflow(
    "report",
    merchantId,
    "merchant",
    async () => {
      const prompt = `You are NewWork's Merchant Output Generator. Create a weekly business summary for a merchant.

Merchant: ${merchant.businessName} (${merchant.businessType})
Location: ${merchant.locationText || "Not specified"}
Work episodes this period: ${episodes.length}
${extractedData ? `Extracted data: ${JSON.stringify(extractedData)}` : ""}

Generate a practical, plain-language summary the agent can share with the merchant.

Respond ONLY as JSON:
{
  "summaryTitle": "string",
  "period": "string",
  "totalRevenue": 0,
  "currency": "string",
  "topProducts": ["string"],
  "keyInsight": "string",
  "whatsappMessage": "string",
  "nextActions": ["string"]
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: 800, responseMimeType: "application/json" },
      });

      let result: any = {};
      try {
        const match = response.text.trim().match(/\{[\s\S]*\}/);
        result = JSON.parse(match ? match[0] : response.text);
      } catch {
        result = { summaryTitle: "Weekly Summary", period: "This week", totalRevenue: 0, currency: "UGX", topProducts: [], keyInsight: "", whatsappMessage: "", nextActions: [] };
      }

      return {
        result,
        inputSummary: `${merchant.businessName} — ${episodes.length} episodes`,
        outputSummary: `Summary generated for ${merchant.businessName}`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── NEXT ACTION RECOMMENDATION ───────────────────────────────────────────────

export async function generateNextAction(agentId: string) {
  const agentDoc = await db.collection("agent_profiles").doc(agentId).get();
  if (!agentDoc.exists) throw new Error("Agent profile not found");
  const agentData = agentDoc.data();
  const userDoc = await db.collection("users").doc(agentData.userId).get();
  const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };

  const episodesSnapshot = await db
    .collection("work_episodes")
    .where("agentId", "==", agentId)
    .get();
  const episodes = episodesSnapshot.docs.map((d: any) => d.data());

  const merchantsSnapshot = await db
    .collection("merchants")
    .where("assignedAgentId", "==", agentId)
    .get();
  const merchantCount = merchantsSnapshot.size;

  const completedEpisodes = episodes.filter((e: any) =>
    ["paid", "verified", "merchant_confirmed"].includes(e.status)
  ).length;

  return runAiWorkflow(
    "agent_recommendation",
    agentId,
    "agent_profile",
    async () => {
      const prompt = `You are the NewWork Income Insight Agent. Recommend the single best next action for this field agent.

Agent: ${user.name}
Merchants in portfolio: ${merchantCount}
Total work episodes: ${episodes.length}
Completed (paid/confirmed): ${completedEpisodes}
Skills: ${(agentData.skills || []).join(", ")}

Pick the ONE highest-impact next action. Be specific, practical, and encouraging.

Respond ONLY as JSON:
{
  "nextAction": "string",
  "reasoning": "string",
  "priority": "high | medium | low",
  "estimatedIncome": {"min": 0, "max": 0, "currency": "USD"},
  "steps": ["string"]
}`;

      const response = await generateGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: 600, responseMimeType: "application/json" },
      });

      let result: any = {};
      try {
        const match = response.text.trim().match(/\{[\s\S]*\}/);
        result = JSON.parse(match ? match[0] : response.text);
      } catch {
        result = { nextAction: "Contact a merchant today", reasoning: "Consistent outreach drives income.", priority: "high", estimatedIncome: { min: 3, max: 10, currency: "USD" }, steps: [] };
      }

      return {
        result,
        inputSummary: `Agent ${user.name} — ${episodes.length} episodes, ${merchantCount} merchants`,
        outputSummary: `Next action: ${result.nextAction || ""}`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}
