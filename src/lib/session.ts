import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "bts2_session";
export const SESSION_DURATION = 60 * 60 * 24 * 14; // 14 jours
import { USERNAME } from "./constants";
export { USERNAME };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET manquant");
  return new TextEncoder().encode(s ?? "dev-only-secret-change-me");
}

export async function signSession() {
  return new SignJWT({ sub: USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}
