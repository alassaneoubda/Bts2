import { ParticipationsView } from "@/components/participations/view";
import { getParticipations, getStudents, getSubjects } from "@/lib/queries";

export default async function ParticipationsPage() {
  const [students, subjects, participations] = await Promise.all([getStudents(), getSubjects(), getParticipations()]);
  const sMap = new Map(students.map((s) => [s.id, s]));
  const subMap = new Map(subjects.map((s) => [s.id, s.nom]));

  return (
    <ParticipationsView
      students={students.filter((s) => s.statut === "actif").map(({ id, numero, nom, prenoms }) => ({ id, numero, nom, prenoms }))}
      subjects={subjects.map(({ id, nom, statut }) => ({ id, nom, statut }))}
      rows={participations.map((p) => ({
        id: p.id,
        studentId: p.studentId,
        student: sMap.get(p.studentId) ? `${sMap.get(p.studentId)!.nom} ${sMap.get(p.studentId)!.prenoms.split(" ")[0]}` : "?",
        numero: sMap.get(p.studentId)?.numero ?? 0,
        subjectId: p.subjectId,
        subject: subMap.get(p.subjectId) ?? "",
        type: p.type,
        valeur: p.valeur,
        date: p.date,
        motif: p.motif,
      }))}
    />
  );
}
