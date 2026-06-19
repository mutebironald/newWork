import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await db.collection("organizations").get();
  const orgs = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      type: data.type,
    };
  });
  orgs.sort((a: any, b: any) => a.name.localeCompare(b.name));
  return NextResponse.json({ orgs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, email, phone, address, country } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });

  const orgRef = db.collection("organizations").doc();
  const org = {
    id: orgRef.id,
    name: name.trim(),
    type: type || "ngo",
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    country: country?.trim() || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await orgRef.set(org);

  return NextResponse.json({ org }, { status: 201 });
}
