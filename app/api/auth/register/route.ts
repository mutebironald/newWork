import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebase";
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

    const emailKey = email.trim().toLowerCase();
    const existingSnapshot = await db
      .collection("users")
      .where("email", "==", emailKey)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
      email: emailKey,
      displayName: name,
    });
    const userId = firebaseUser.uid;

    // Create user in Firestore
    let orgId: string | undefined;
    if (role === "org_admin" && orgName) {
      const orgRef = db.collection("organizations").doc();
      orgId = orgRef.id;
      await orgRef.set({
        id: orgId,
        name: orgName,
        type: "ngo",
        createdAt: new Date().toISOString(),
      });

      const memberRef = db.collection("org_members").doc();
      await memberRef.set({
        id: memberRef.id,
        orgId,
        userId,
        role: "admin",
        createdAt: new Date().toISOString(),
      });
    }

    await db.collection("users").doc(userId).set({
      id: userId,
      name,
      email: emailKey,
      phone: phone || null,
      passwordHash,
      role: role || "agent",
      organizationId: orgId || null,
      createdAt: new Date().toISOString(),
    });

    if (role === "agent") {
      const agentRef = db.collection("agent_profiles").doc();
      await agentRef.set({
        id: agentRef.id,
        userId,
        district: district?.trim() || null,
        location: location?.trim() || null,
        createdAt: new Date().toISOString(),
      });
    }

    const token = await createSession(userId);
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ ok: true, role: role || "agent" });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
