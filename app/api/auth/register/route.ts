import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, role, orgName, district, location } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { name, email, phone: phone || null, passwordHash, role: role || "agent" },
      });

      if (role === "agent") {
        await tx.agent.create({
          data: {
            userId: u.id,
            district: district?.trim() || null,
            location: location?.trim() || null,
          },
        });
      }

      if (role === "org_admin" && orgName) {
        const org = await tx.organization.create({
          data: { name: orgName, type: "ngo" },
        });
        await tx.orgMember.create({ data: { orgId: org.id, userId: u.id, role: "admin" } });
      }

      return u;
    });

    const token = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
