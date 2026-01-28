import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getDbServiceAsync } from "./db/service";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "smartfallCapstone",
);

export async function createSession(
  userId: string,
  accountType: string,
): Promise<string> {
  const token = await new SignJWT({ userId, accountType })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  // Store session in database
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dbService = await getDbServiceAsync();
  await dbService.sessions.create({
    userId,
    sessionToken: token,
    expiresAt,
  });

  return token;
}

export async function getSession(): Promise<any> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret);

    // Check if session exists in database and is not expired
    const dbService = await getDbServiceAsync();
    const session = await dbService.sessions.findByToken(token);

    if (!session || (session.expiresAt && session.expiresAt < new Date())) {
      return null;
    }

    return verified.payload;
  } catch (err) {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    // Delete session from database
    const dbService = await getDbServiceAsync();
    await dbService.sessions.deleteByToken(token);
  }

  cookieStore.delete("session");
}
