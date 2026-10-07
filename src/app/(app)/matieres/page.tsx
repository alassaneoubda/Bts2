import { SubjectsView } from "@/components/subjects/view";
import { getEvaluations, getSubjects } from "@/lib/queries";

export default async function SubjectsPage() {
  const [subjects, evals] = await Promise.all([getSubjects(), getEvaluations()]);
  return <SubjectsView rows={subjects.map((s) => ({ id: s.id, nom: s.nom, statut: s.statut, evals: evals.filter((e) => e.subjectId === s.id).length }))} />;
}
