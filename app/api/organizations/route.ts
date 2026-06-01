import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = await db.organization.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ orgs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, email, phone, address, country } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });

  const org = await db.organization.create({
    data: {
      name: name.trim(),
      type: type || "ngo",
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      country: country?.trim() || "",
    },
  });

  return NextResponse.json({ org }, { status: 201 });
}
