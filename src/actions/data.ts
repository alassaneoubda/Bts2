"use server";

import { and, eq, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, documents, evaluations, grades, participations, payments, students, subjects } from "@/db";
import { requireAuth } from "@/lib/auth";
import { baremeFor } from "@/lib/grades";
import { search } from "@/lib/queries";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const refresh = () => revalidatePath("/", "layout");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide");

// ───────── Participations ─────────
const participationSchema = z.object({
  subjectId: z.uuid("Sélectionnez une matière"),
  studentId: z.uuid("Sélectionnez un étudiant"),
  type: z.enum(["bonus", "malus"]),
  valeur: z.string(),
  date: isoDate,
  motif: z.string().trim(),
});

export async function addParticipation(input: z.input<typeof participationSchema>): Promise<Result> {
  await requireAuth();
  const p = participationSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const n = parseInt(p.data.valeur.trim().replace("+", ""), 10);
  if (isNaN(n)) return fail("Valeur invalide. Ex : +5 ou -2");
  if (n === 0) return fail("La valeur ne peut pas être 0");
  await db.insert(participations).values({
    studentId: p.data.studentId,
    subjectId: p.data.subjectId,
    type: p.data.type,
    valeur: Math.abs(n),
    date: p.data.date,
    motif: p.data.motif || (p.data.type === "bonus" ? "Participation active" : "Retard / bavardage"),
  });
  refresh();
  return { ok: true };
}

export async function deleteParticipation(id: string): Promise<Result> {
  await requireAuth();
  await db.delete(participations).where(eq(participations.id, id));
  refresh();
  return { ok: true };
}

// ───────── Étudiants ─────────
const studentSchema = z.object({
  id: z.uuid().nullable(),
  numero: z.string(),
  nom: z.string().trim().min(1, "Nom et prénoms requis"),
  prenoms: z.string().trim().min(1, "Nom et prénoms requis"),
  statut: z.enum(["actif", "inactif"]),
});

export async function saveStudent(input: z.input<typeof studentSchema>): Promise<Result> {
  await requireAuth();
  const p = studentSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const d = p.data;
  const requested = parseInt(d.numero, 10);
  try {
    if (d.id) {
      await db
        .update(students)
        .set({
          nom: d.nom.toUpperCase(),
          prenoms: d.prenoms.toUpperCase(),
          statut: d.statut,
          ...(isNaN(requested) ? {} : { numero: requested }),
        })
        .where(eq(students.id, d.id));
    } else {
      const [m] = await db.select({ m: max(students.numero) }).from(students);
      await db.insert(students).values({
        numero: isNaN(requested) ? (m?.m ?? 0) + 1 : requested,
        nom: d.nom.toUpperCase(),
        prenoms: d.prenoms.toUpperCase(),
        statut: d.statut,
      });
    }
  } catch {
    return fail("Ce numéro est déjà attribué à un autre étudiant.");
  }
  refresh();
  return { ok: true };
}

// ───────── Matières ─────────
export async function saveSubject(input: { id: string | null; nom: string }): Promise<Result> {
  await requireAuth();
  const nom = input.nom.trim();
  if (!nom) return fail("Nom de matière requis");
  if (input.id) await db.update(subjects).set({ nom }).where(eq(subjects.id, input.id));
  else {
    const [m] = await db.select({ m: max(subjects.position) }).from(subjects);
    await db.insert(subjects).values({ nom, position: (m?.m ?? -1) + 1 });
  }
  refresh();
  return { ok: true };
}

// ───────── Évaluations & notes ─────────
const evalSchema = z.object({
  id: z.uuid().nullable(),
  subjectId: z.uuid("Matière requise"),
  nom: z.string().trim().min(1, "Nom requis"),
  type: z.enum(["INTERROGATION", "DEVOIR"]),
  date: isoDate,
});

export async function saveEvaluation(input: z.input<typeof evalSchema>): Promise<Result<{ id: string }>> {
  await requireAuth();
  const p = evalSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const d = p.data;
  const bareme = baremeFor(d.type);
  let id = d.id;
  if (id) {
    await db.update(evaluations).set({ subjectId: d.subjectId, nom: d.nom, type: d.type, date: d.date, bareme }).where(eq(evaluations.id, id));
    // un changement de type modifie le barème : on retire les notes devenues hors barème
    await db.update(grades).set({ note: null }).where(and(eq(grades.evaluationId, id), sql`${grades.note} > ${bareme}`));
  } else {
    const [row] = await db
      .insert(evaluations)
      .values({ subjectId: d.subjectId, nom: d.nom, type: d.type, date: d.date, bareme })
      .returning({ id: evaluations.id });
    id = row.id;
  }
  refresh();
  return { ok: true, id };
}

export async function deleteEvaluation(id: string): Promise<Result> {
  await requireAuth();
  await db.delete(evaluations).where(eq(evaluations.id, id));
  refresh();
  return { ok: true };
}

/** `note: null` efface la note ; `statut` ABSENT efface aussi la note. */
export async function saveGrade(input: {
  evaluationId: string;
  studentId: string;
  note: number | null;
  statut: "PRESENT" | "ABSENT";
}): Promise<Result> {
  await requireAuth();
  const [ev] = await db.select().from(evaluations).where(eq(evaluations.id, input.evaluationId));
  if (!ev) return fail("Évaluation introuvable");
  if (input.note !== null && (isNaN(input.note) || input.note < 0 || input.note > ev.bareme))
    return fail(`Note impossible : entre 0 et ${ev.bareme}`);
  const note = input.statut === "ABSENT" ? null : input.note;
  await db
    .insert(grades)
    .values({ evaluationId: input.evaluationId, studentId: input.studentId, note, statut: input.statut })
    .onConflictDoUpdate({ target: [grades.evaluationId, grades.studentId], set: { note, statut: input.statut } });
  refresh();
  return { ok: true };
}

// ───────── Documents & paiements ─────────
const documentSchema = z.object({
  subjectId: z.uuid("Matière requise"),
  nom: z.string().trim().min(1, "Nom et prix requis"),
  prix: z.string(),
  description: z.string().trim(),
  date: isoDate,
});

export async function createDocument(input: z.input<typeof documentSchema>): Promise<Result<{ id: string }>> {
  await requireAuth();
  const p = documentSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const prix = parseInt(p.data.prix, 10);
  if (isNaN(prix) || prix <= 0) return fail("Prix invalide");
  const [row] = await db
    .insert(documents)
    .values({ subjectId: p.data.subjectId, nom: p.data.nom, prix, description: p.data.description, date: p.data.date })
    .returning({ id: documents.id });
  refresh();
  return { ok: true, id: row.id };
}

export async function deleteDocument(id: string): Promise<Result> {
  await requireAuth();
  await db.delete(documents).where(eq(documents.id, id));
  refresh();
  return { ok: true };
}

const paymentSchema = z.object({
  documentId: z.uuid("Document introuvable"),
  studentId: z.uuid("Étudiant requis"),
  montant: z.string(),
  date: isoDate,
  commentaire: z.string().trim(),
});

export async function addPayment(input: z.input<typeof paymentSchema>): Promise<Result> {
  await requireAuth();
  const p = paymentSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0].message);
  const montant = parseInt(p.data.montant, 10);
  if (isNaN(montant) || montant <= 0) return fail("Montant invalide");
  await db.insert(payments).values({ ...p.data, montant });
  refresh();
  return { ok: true };
}

export async function deletePayment(id: string): Promise<Result> {
  await requireAuth();
  await db.delete(payments).where(eq(payments.id, id));
  refresh();
  return { ok: true };
}

// ───────── Recherche globale ─────────
export async function searchAction(q: string) {
  await requireAuth();
  return search(q);
}
