import { db, auth } from "./firebase";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  agentId?: string;
  orgId?: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  // Generates session cookie using Firebase Auth token simulation/implementation
  // For standard Admin SDK, we create a session cookie from an ID token.
  // In fallback mode, the userId is directly returned and set as cookie
  return auth.createSessionCookie(userId, { expiresIn: 7 * 24 * 60 * 60 * 1000 });
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    // Verify session token / cookie using Firebase Auth
    const decodedClaims = await auth.verifySessionCookie(token);
    if (!decodedClaims) return null;

    const uid = decodedClaims.uid;

    // Fetch user from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return null;

    const user = userDoc.data();
    let agentId: string | undefined;

    // If user is an agent, look up their agent profile
    if (user.role === "agent") {
      const agentSnapshot = await db
        .collection("agent_profiles")
        .where("userId", "==", uid)
        .limit(1)
        .get();

      if (!agentSnapshot.empty) {
        agentId = agentSnapshot.docs[0].id;
      }
    }

    return {
      id: uid,
      email: user.email,
      name: user.displayName || user.name || "",
      role: user.role,
      agentId,
      orgId: user.organizationId,
    };
  } catch (err) {
    console.error("Auth session retrieval failed:", err);
    return null;
  }
});

export async function deleteSession(token: string): Promise<void> {
  // In a real Firebase setup, we would revoke session tokens if needed.
  // In this session architecture, clearing the cookie is enough.
}
