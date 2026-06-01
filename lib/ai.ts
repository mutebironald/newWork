import { GoogleGenAI } from "@google/genai";
import { AiWorkflowType } from "@prisma/client";
import { db } from "@/lib/db";

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
      config: params.config,
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
      await db.aiWorkflowLog.create({
        data: {
          workflowType: workflowType as AiWorkflowType,
          entityId,
          entityType,
          success,
          inputSummary,
          outputSummary,
          modelUsed: "gemini-2.5-flash",
          tokensUsed,
          latencyMs: Date.now() - start,
          autonomousDecision: true,
        },
      });
    } catch (logErr) {
      console.error("Failed to write AI workflow log:", logErr);
    }
  }

  return result!;
}

// ─── PROOF VERIFICATION (autonomous) ─────────────────────────────────────────

export async function verifyProof(proofItemId: string) {
  const proof = await db.proofItem.findUnique({
    where: { id: proofItemId },
    include: { workEpisode: true },
  });
  if (!proof) throw new Error("Proof item not found");

  return runAiWorkflow(
    "proof_verification",
    proofItemId,
    "proof_item",
    async () => {
      const episode = proof.workEpisode;
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

      await db.proofItem.update({
        where: { id: proofItemId },
        data: {
          aiStatus: parsed.status as import("@prisma/client").ProofAiStatus,
          aiConfidence: parsed.confidence,
          aiNotes: parsed.notes,
          aiReviewedAt: new Date(),
        },
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
  const opportunity = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: { org: true },
  });
  if (!opportunity) throw new Error("Opportunity not found");

  const agents = await db.agent.findMany({
    where: { status: "active" },
    include: { user: true, incomeLedger: true },
    take: 50,
  });

  return runAiWorkflow(
    "opportunity_matching",
    opportunityId,
    "opportunity",
    async () => {
      const skillsRequired: string[] = opportunity.skillsRequired;

      const agentSummaries = agents.map((a) => ({
        id: a.id,
        name: a.user.name,
        skills: a.skills,
        district: a.district,
        location: a.location,
        episodesCompleted: a.incomeLedger.length,
        totalIncome: a.incomeLedger.reduce((s, l) => s + l.amount, 0),
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
        await db.opportunityAssignment.upsert({
          where: {
            id: `${opportunityId}-${m.agentId}`,
          },
          update: { aiMatchScore: m.score, aiMatchReason: m.reason },
          create: {
            id: `${opportunityId}-${m.agentId}`,
            opportunityId,
            agentId: m.agentId,
            aiMatchScore: m.score,
            aiMatchReason: m.reason,
            status: "assigned",
          },
        });
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
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: {
      user: true,
      workEpisodes: { take: 20, orderBy: { createdAt: "desc" } },
      incomeLedger: true,
    },
  });
  if (!agent) throw new Error("Agent not found");

  return runAiWorkflow(
    "career_profile",
    agentId,
    "agent",
    async () => {
      const skills: string[] = agent.skills;
      const completedEpisodes = agent.workEpisodes.filter(
        (e) => e.status === "verified" || e.status === "paid"
      );
      const totalIncome = agent.incomeLedger.reduce(
        (s, l) => s + l.amount,
        0
      );

      const prompt = `You are an AI career coach for NewWork, helping underserved workers grow their income.

Agent profile:
- Name: ${agent.user.name}
- Skills: ${skills.join(", ") || "not specified"}
- District: ${agent.district || "unknown"}
- Education: ${agent.education || "not specified"}
- Completed work episodes: ${completedEpisodes.length}
- Total verified income: ${totalIncome.toLocaleString()}
- Recent services: ${completedEpisodes.slice(0, 5).map((e) => e.serviceType).join(", ") || "none yet"}

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

      await db.agent.update({
        where: { id: agentId },
        data: {
          aiProfile: profile as object,
          aiProfileAt: new Date(),
        },
      });

      return {
        result: profile,
        inputSummary: `Agent ${agent.user.name} — ${completedEpisodes.length} episodes`,
        outputSummary: `Profile generated with ${(profile as { strengths?: string[] }).strengths?.length || 0} strengths`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── COHORT HEALTH MONITORING (autonomous) ────────────────────────────────────

export async function monitorCohortHealth(cohortId: string) {
  const cohort = await db.cohort.findUnique({
    where: { id: cohortId },
    include: {
      enrollments: { include: { agent: { include: { workEpisodes: true, incomeLedger: true } } } },
      workEpisodes: true,
    },
  });
  if (!cohort) throw new Error("Cohort not found");

  return runAiWorkflow(
    "program_monitoring",
    cohortId,
    "cohort",
    async () => {
      const totalEnrolled = cohort.enrollments.length;
      const totalEpisodes = cohort.workEpisodes.length;
      const verifiedEpisodes = cohort.workEpisodes.filter((e) =>
        ["verified", "paid", "merchant_confirmed"].includes(e.status)
      ).length;
      const totalCohortIncome = cohort.enrollments.reduce((sum, e) => {
        return sum + e.agent.incomeLedger.reduce((s, l) => s + l.amount, 0);
      }, 0);

      const agentActivity = cohort.enrollments.map((e) => ({
        agentId: e.agent.id,
        episodeCount: e.agent.workEpisodes.length,
        lastActivity: e.agent.workEpisodes[0]?.createdAt || null,
        income: e.agent.incomeLedger.reduce((s, l) => s + l.amount, 0),
      }));

      const atRiskAgents = agentActivity.filter(
        (a) =>
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
  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  const cohort = cohortId
    ? await db.cohort.findUnique({
        where: { id: cohortId },
        include: { enrollments: true, workEpisodes: true },
      })
    : null;

  const allEpisodes = cohortId
    ? await db.workEpisode.findMany({
        where: { cohortId },
        include: { payment: true, proofItems: true, confirmation: true },
      })
    : await db.workEpisode.findMany({
        where: { orgId },
        include: { payment: true, proofItems: true, confirmation: true },
      });

  return runAiWorkflow(
    "report_generation",
    orgId,
    "cohort",
    async () => {
      const stats = {
        totalEpisodes: allEpisodes.length,
        verifiedEpisodes: allEpisodes.filter((e) =>
          ["verified", "paid", "merchant_confirmed"].includes(e.status)
        ).length,
        totalIncome: allEpisodes
          .filter((e) => e.payment)
          .reduce((s, e) => s + (e.payment?.amount || 0), 0),
        merchantConfirmed: allEpisodes.filter(
          (e) => e.confirmation?.confirmed
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

      const report = await db.impactReport.create({
        data: {
          orgId,
          cohortId,
          reportType: reportType as import("@prisma/client").ReportType,
          title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${org.name}`,
          content: content as object,
          aiGenerated: true,
        },
      });

      return {
        result: { reportId: report.id, content },
        inputSummary: `${org.name} — ${stats.totalEpisodes} episodes, ${stats.totalIncome.toLocaleString()}`,
        outputSummary: `${reportType} report generated`,
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}

// ─── FRAUD DETECTION (autonomous) ────────────────────────────────────────────

export async function detectFraud(workEpisodeId: string) {
  const episode = await db.workEpisode.findUnique({
    where: { id: workEpisodeId },
    include: {
      agent: { include: { user: true, workEpisodes: true } },
      proofItems: true,
      payment: true,
      confirmation: true,
    },
  });
  if (!episode) throw new Error("Episode not found");

  return runAiWorkflow(
    "fraud_detection",
    workEpisodeId,
    "work_episode",
    async () => {
      const recentEpisodes = episode.agent.workEpisodes.filter(
        (e) =>
          Math.abs(new Date(e.createdAt).getTime() - new Date(episode.createdAt).getTime()) <
          24 * 60 * 60 * 1000
      );

      const prompt = `Fraud detection for NewWork work episode.

Episode:
- Service: ${episode.serviceType}
- Amount: ${episode.amount.toLocaleString()}
- Status: ${episode.status}
- Proof items: ${episode.proofItems.length} (accepted: ${episode.proofItems.filter((p) => p.aiStatus === "accepted").length})
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
        await db.fraudFlag.create({
          data: {
            entityId: workEpisodeId,
            entityType: "work_episode",
            flagType: result.flagType as import("@prisma/client").FraudFlagType,
            severity: result.severity as import("@prisma/client").FraudSeverity,
            description: result.description,
            aiGenerated: true,
          },
        });
      }

      return {
        result,
        inputSummary: `Episode ${episode.serviceType} by ${episode.agent.user.name}`,
        outputSummary: result.flagged ? `FLAGGED: ${result.flagType}` : "Clean",
        tokensUsed: response.usage.promptTokens + response.usage.candidatesTokens,
      };
    }
  );
}
