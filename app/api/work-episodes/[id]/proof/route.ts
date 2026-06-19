import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { verifyProof } from "@/lib/ai";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workEpisodeId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const episodeDoc = await db.collection("work_episodes").doc(workEpisodeId).get();
    if (!episodeDoc.exists) {
      return NextResponse.json({ error: "Work episode not found" }, { status: 404 });
    }
    const episode = episodeDoc.data();

    // Role check
    if (session.role === "agent" && session.agentId !== episode.agentId) {
      return NextResponse.json({ error: "Forbidden: Cannot upload proof for other agents" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueName = `${crypto.randomUUID()}_${file.name}`;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    // Determine FileType based on extension
    const ext = path.extname(file.name).toLowerCase();
    let fileType = "screenshot";
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      fileType = "photo";
    } else if (ext === ".pdf") {
      fileType = "pdf";
    } else if ([".mp3", ".wav", ".m4a"].includes(ext)) {
      fileType = "audio";
    } else if ([".mp4", ".mov", ".avi"].includes(ext)) {
      fileType = "video";
    }

    // 1. Create ProofItem
    const proofRef = db.collection("proof_items").doc();
    const proofItem = {
      id: proofRef.id,
      workEpisodeId,
      fileUrl,
      fileType,
      fileName: file.name,
      fileSizeBytes: file.size,
      aiStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    await proofRef.set(proofItem);

    // 2. Advance episode status to "proof_uploaded" if not already there or past it
    const statusFlow = [
      "planned", "assigned", "accepted", "in_progress", "delivered",
      "proof_uploaded", "merchant_confirmed", "paid", "verified"
    ];
    const currentIdx = statusFlow.indexOf(episode.status);
    const targetIdx = statusFlow.indexOf("proof_uploaded");

    if (currentIdx !== -1 && currentIdx < targetIdx) {
      await db.collection("work_episodes").doc(workEpisodeId).update({
        status: "proof_uploaded",
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Trigger Gemini verification asynchronously (in background)
    verifyProof(proofItem.id).catch((err) => {
      console.error(`Background proof verification failed for ${proofItem.id}:`, err);
    });

    return NextResponse.json({
      ok: true,
      proofItem,
      message: "Proof uploaded and Gemini verification scheduled.",
    });
  } catch (err: any) {
    console.error("Proof upload error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload proof" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
