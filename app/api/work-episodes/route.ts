import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { agentId, merchantId, opportunityId, cohortId, title, serviceType, amount } = body;

    if (!agentId || !merchantId || !title || !serviceType || !amount) {
      return NextResponse.json(
        { error: "agentId, merchantId, title, serviceType, and amount are required" },
        { status: 400 }
      );
    }

    // Role check
    if (session.role === "agent" && session.agentId !== agentId) {
      return NextResponse.json({ error: "Forbidden: Cannot log work for other agents" }, { status: 403 });
    }

    // Verify merchant and fetch its orgId
    const merchantDoc = await db.collection("merchants").doc(merchantId).get();
    if (!merchantDoc.exists) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }
    const merchant = merchantDoc.data();

    // Create the Work Episode
    const episodeRef = db.collection("work_episodes").doc();
    const episode = {
      id: episodeRef.id,
      agentId,
      merchantId,
      opportunityId: opportunityId || null,
      cohortId: cohortId || null,
      orgId: merchant.orgId,
      title: title.trim(),
      serviceType,
      amount: parseInt(amount, 10),
      status: "planned",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await episodeRef.set(episode);

    return NextResponse.json({ ok: true, episode }, { status: 201 });
  } catch (err: any) {
    console.error("Log Work Episode error:", err);
    return NextResponse.json({ error: err.message || "Failed to log work episode" }, { status: 500 });
  }
}
