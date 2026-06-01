import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ServiceType } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const opportunities = await db.opportunity.findMany({
    include: { org: true, assignments: true, _count: { select: { workEpisodes: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ opportunities });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, title, description, serviceType, amount, skillsRequired, district, location, maxAssignments } = await req.json();

  if (!orgId || !title || !serviceType || !amount) {
    return NextResponse.json({ error: "orgId, title, serviceType, and amount are required" }, { status: 400 });
  }

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const opportunity = await db.opportunity.create({
    data: {
      orgId,
      title,
      description: description || "",
      serviceType: serviceType as ServiceType,
      amount,
      skillsRequired: skillsRequired || [],
      district: district || null,
      location: location || null,
      maxAssignments: maxAssignments || 1,
      status: "open",
    },
  });

  return NextResponse.json({ ok: true, opportunity });
}
