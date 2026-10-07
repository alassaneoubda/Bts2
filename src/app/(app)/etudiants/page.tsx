import { eq, sql } from "drizzle-orm";
import { db, grades } from "@/db";
import { StudentsView } from "@/components/students/view";
import { getPointsByStudent, getStudents } from "@/lib/queries";

export default async function StudentsPage() {
  const [students, points, noteRows] = await Promise.all([
    getStudents(),
    getPointsByStudent(),
    db
      .select({ studentId: grades.studentId, n: sql<number>`count(*) filter (where ${grades.note} is not null)::int` })
      .from(grades)
      .where(eq(grades.statut, "PRESENT"))
      .groupBy(grades.studentId),
  ]);
  const notes = Object.fromEntries(noteRows.map((r) => [r.studentId, r.n]));

  return (
    <StudentsView
      rows={students.map((s) => ({ id: s.id, numero: s.numero, nom: s.nom, prenoms: s.prenoms, statut: s.statut, points: points[s.id]?.total ?? 0, notes: notes[s.id] ?? 0 }))}
    />
  );
}
