import { DocumentsView } from "@/components/documents/view";
import { getDocuments, getPayments, getStudents, getSubjects } from "@/lib/queries";

export default async function DocumentsPage() {
  const [docs, subjects, students, payments] = await Promise.all([getDocuments(), getSubjects(), getStudents(), getPayments()]);

  return (
    <DocumentsView
      documents={docs.map(({ id, subjectId, nom, prix, description, date }) => ({ id, subjectId, nom, prix, description, date }))}
      subjects={subjects.map(({ id, nom, statut }) => ({ id, nom, statut }))}
      students={students.filter((s) => s.statut === "actif").map(({ id, numero, nom, prenoms }) => ({ id, numero, nom, prenoms }))}
      payments={payments.map(({ id, documentId, studentId, montant, date, commentaire }) => ({ id, documentId, studentId, montant, date, commentaire }))}
    />
  );
}
