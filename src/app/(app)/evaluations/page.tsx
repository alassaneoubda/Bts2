import { EvaluationsView } from "@/components/evaluations/view";
import { getEntryCounts, getEvaluations, getGradesForEvaluation, getStudents, getSubjects } from "@/lib/queries";

export default async function EvaluationsPage({ searchParams }: { searchParams: Promise<{ eval?: string; new?: string }> }) {
  const sp = await searchParams;
  const [evals, subjects, counts, students] = await Promise.all([getEvaluations(), getSubjects(), getEntryCounts(), getStudents()]);
  const selected = sp.eval && evals.some((e) => e.id === sp.eval) ? sp.eval : null;
  const grades = selected ? await getGradesForEvaluation(selected) : [];

  return (
    <EvaluationsView
      evaluations={evals.map(({ id, subjectId, nom, type, bareme, date }) => ({ id, subjectId, nom, type, bareme, date }))}
      subjects={subjects.map(({ id, nom, statut }) => ({ id, nom, statut }))}
      counts={counts}
      students={students.filter((s) => s.statut === "actif").map(({ id, numero, nom, prenoms }) => ({ id, numero, nom, prenoms }))}
      selectedId={selected}
      grades={grades.map(({ studentId, note, statut }) => ({ studentId, note, statut }))}
      openNew={sp.new === "1"}
    />
  );
}
