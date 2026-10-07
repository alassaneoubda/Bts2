"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, settings } from "@/db";
import { isSiteEnabled } from "@/lib/site";
import { createSession, destroySession, requireAuth } from "@/lib/auth";

export type FormState = { error?: string; success?: string } | undefined;

async function getHash() {
  const [row] = await db.select().from(settings).where(eq(settings.key, "password_hash"));
  return row?.value ?? null;
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSiteEnabled()) return { error: "Site désactivé." };
  const password = String(formData.get("password") ?? "");
  const hash = await getHash();
  if (!hash) return { error: "Base non initialisée : lancez `npm run db:seed`." };
  if (!(await bcrypt.compare(password, hash))) return { error: "Mot de passe incorrect." };
  await createSession();
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  await requireAuth();
  const old = String(formData.get("old") ?? "");
  const new1 = String(formData.get("new1") ?? "");
  const new2 = String(formData.get("new2") ?? "");
  const hash = await getHash();
  if (!hash || !(await bcrypt.compare(old, hash))) return { error: "Ancien mot de passe incorrect." };
  if (new1.length < 6) return { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." };
  if (new1 !== new2) return { error: "La confirmation ne correspond pas." };
  await db
    .insert(settings)
    .values({ key: "password_hash", value: await bcrypt.hash(new1, 10) })
    .onConflictDoUpdate({ target: settings.key, set: { value: await bcrypt.hash(new1, 10) } });
  return { success: "Mot de passe modifié." };
}
