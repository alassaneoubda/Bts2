import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_DURATION, signSession, verifySession } from "./session";

export async function isAuthenticated() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** À appeler au début de chaque Server Action (le proxy ne protège pas les actions de manière fiable). */
export async function requireAuth() {
  if (!(await isAuthenticated())) throw new Error("Non autorisé");
}

export async function createSession() {
  (await cookies()).set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
