import { db } from "./db";
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
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          agent: true,
          orgMemberships: { include: { org: true } },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  const user = session.user;
  const orgMembership = user.orgMemberships[0];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    agentId: user.agent?.id,
    orgId: orgMembership?.orgId,
  };
});

export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } });
}
