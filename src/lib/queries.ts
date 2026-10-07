import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, documents, evaluations, grades, participations, payments, students, subjects } from "@/db";
import { subjectAverages, type EvalKind } from "./grades";

export const getStudents = () => db.select().from(students).orderBy(asc(students.numero));
export const getSubjects = () => db.select().from(subjects).orderBy(asc(subjects.position), asc(subjects.createdAt));

export async function getStudent(id: string) {
  const [s] = await db.select().from(students).where(eq(students.id, id));
  return s ?? null;
}

export const getParticipations = () =>
  db.select().from(participations).orderBy(desc(participations.date), desc(participations.createdAt));

export const getEvaluations = () => db.select().from(evaluations).orderBy(desc(evaluations.date), desc(evaluations.createdAt));
export const getDocuments = () => db.select().from(documents).orderBy(desc(documents.createdAt));
export const getPayments = () => db.select().from(payments).orderBy(desc(payments.date), desc(payments.createdAt));

export type Points = { bonus: number; malus: number; total: number };

export async function getPointsByStudent(): Promise<Record<string, Points>> {
  const rows = await db
    .select({
      studentId: participations.studentId,
      type: participations.type,
      sum: sql<number>`coalesce(sum(${participations.valeur}), 0)::int`,
    })
    .from(participations)
    .groupBy(participations.studentId, participations.type);
  const out: Record<string, Points> = {};
  for (const r of rows) {
    const p = (out[r.studentId] ??= { bonus: 0, malus: 0, total: 0 });
    if (r.type === "bonus") p.bonus += r.sum;
    else p.malus += r.sum;
    p.total = p.bonus - p.malus;
  }
  return out;
}

/** documentId -> studentId -> total payé */
export async function getPaidMap(): Promise<Record<string, Record<string, number>>> {
  const rows = await db
    .select({
      documentId: payments.documentId,
      studentId: payments.studentId,
      sum: sql<number>`coalesce(sum(${payments.montant}), 0)::int`,
    })
    .from(payments)
    .groupBy(payments.documentId, payments.studentId);
  const out: Record<string, Record<string, number>> = {};
  for (const r of rows) (out[r.documentId] ??= {})[r.studentId] = r.sum;
  return out;
}

/** evaluationId -> nombre de notes saisies (note renseignée ou absent) */
export async function getEntryCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      evaluationId: grades.evaluationId,
      n: sql<number>`count(*) filter (where ${grades.note} is not null or ${grades.statut} = 'ABSENT')::int`,
    })
    .from(grades)
    .groupBy(grades.evaluationId);
  return Object.fromEntries(rows.map((r) => [r.evaluationId, r.n]));
}

export const getGradesForEvaluation = (evaluationId: string) =>
  db.select().from(grades).where(eq(grades.evaluationId, evaluationId));

export async function getDashboard() {
  const [studs, subs, parts, evals, docs, pays, [noteCount]] = await Promise.all([
    getStudents(),
    getSubjects(),
    db.select({ type: participations.type, valeur: participations.valeur }).from(participations),
    getEvaluations(),
    getDocuments(),
    db.select({ montant: payments.montant }).from(payments),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(grades)
      .where(and(eq(grades.statut, "PRESENT"), sql`${grades.note} is not null`)),
  ]);
  const [points, paid] = await Promise.all([getPointsByStudent(), getPaidMap()]);

  const active = studs.filter((s) => s.statut === "actif");
  const totalBonus = parts.filter((p) => p.type === "bonus").reduce((a, p) => a + p.valeur, 0);
  const totalMalus = parts.filter((p) => p.type === "malus").reduce((a, p) => a + p.valeur, 0);
  const totalEncaisse = pays.reduce((a, p) => a + p.montant, 0);
  let totalRestant = 0;
  for (const d of docs) for (const s of active) totalRestant += Math.max(0, d.prix - (paid[d.id]?.[s.id] ?? 0));

  const top5 = [...studs].sort((a, b) => (points[b.id]?.total ?? 0) - (points[a.id]?.total ?? 0)).slice(0, 5);

  return {
    totalEtudiants: active.length,
    nbEtudiants: studs.length,
    totalMatieres: subs.filter((s) => s.statut === "actif").length,
    nbMatieres: subs.length,
    totalParticipations: parts.length,
    totalBonus,
    totalMalus,
    totalEvals: evals.length,
    totalNotes: noteCount?.n ?? 0,
    totalEncaisse,
    totalRestant,
    nbDocuments: docs.length,
    top5: top5.map((s) => ({ ...s, total: points[s.id]?.total ?? 0 })),
    recentEvals: evals.slice(0, 3).map((e) => ({ ...e, subjectNom: subs.find((s) => s.id === e.subjectId)?.nom ?? "" })),
  };
}

/** Fiche étudiant : points, notes par matière avec moyennes, achats de documents. */
export async function getStudentProfile(id: string) {
  const student = await getStudent(id);
  if (!student) return null;

  const [subs, parts, gradeRows, docs, paid, allPayments] = await Promise.all([
    getSubjects(),
    db.select().from(participations).where(eq(participations.studentId, id)).orderBy(desc(participations.date)),
    db
      .select({ grade: grades, evaluation: evaluations })
      .from(grades)
      .innerJoin(evaluations, eq(grades.evaluationId, evaluations.id))
      .where(eq(grades.studentId, id))
      .orderBy(asc(evaluations.date)),
    getDocuments(),
    getPaidMap(),
    db.select().from(payments).where(eq(payments.studentId, id)).orderBy(desc(payments.date)),
  ]);

  const pointsBySubject: Record<string, number> = {};
  for (const p of parts) pointsBySubject[p.subjectId] = (pointsBySubject[p.subjectId] ?? 0) + (p.type === "bonus" ? p.valeur : -p.valeur);
  const bonus = parts.filter((p) => p.type === "bonus").reduce((a, p) => a + p.valeur, 0);
  const malus = parts.filter((p) => p.type === "malus").reduce((a, p) => a + p.valeur, 0);

  const bySubject = subs
    .map((sub) => {
      const rows = gradeRows.filter((r) => r.evaluation.subjectId === sub.id && (r.grade.note !== null || r.grade.statut === "ABSENT"));
      return {
        subject: sub,
        rows,
        averages: subjectAverages(rows.map((r) => ({ type: r.evaluation.type as EvalKind, note: r.grade.note, statut: r.grade.statut }))),
      };
    })
    .filter((b) => b.rows.length > 0);

  const purchases = docs.map((d) => ({
    doc: d,
    subjectNom: subs.find((s) => s.id === d.subjectId)?.nom ?? "",
    paid: paid[d.id]?.[id] ?? 0,
    payments: allPayments.filter((p) => p.documentId === d.id),
  }));

  return { student, subjects: subs, participations: parts, pointsBySubject, bonus, malus, total: bonus - malus, bySubject, purchases };
}

export async function search(q: string) {
  const needle = `%${q.trim().toLowerCase()}%`;
  if (q.trim().length < 1) return { students: [], evals: [] };
  const [studs, evals] = await Promise.all([
    db
      .select()
      .from(students)
      .where(sql`lower(${students.nom} || ' ' || ${students.prenoms}) like ${needle}`)
      .orderBy(asc(students.numero))
      .limit(5),
    db
      .select({ e: evaluations, subjectNom: subjects.nom })
      .from(evaluations)
      .innerJoin(subjects, eq(evaluations.subjectId, subjects.id))
      .where(
        sql`lower(${evaluations.nom}) like ${needle} or lower(${subjects.nom}) like ${needle} or ${evaluations.date}::text like ${needle} or lower(${evaluations.type}::text) like ${needle}`,
      )
      .orderBy(desc(evaluations.date))
      .limit(5),
  ]);
  const points = await getPointsByStudent();
  return {
    students: studs.map((s) => ({ id: s.id, numero: s.numero, nom: s.nom, prenoms: s.prenoms, total: points[s.id]?.total ?? 0 })),
    evals: evals.map((r) => ({ id: r.e.id, nom: r.e.nom, type: r.e.type, date: r.e.date, bareme: r.e.bareme, subjectNom: r.subjectNom })),
  };
}
