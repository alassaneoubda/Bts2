import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db, evaluations, grades } from "@/db";
import { isAuthenticated } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { subjectAverages, type EvalKind } from "@/lib/grades";
import { getDocuments, getPaidMap, getParticipations, getPointsByStudent, getStudentProfile, getStudents, getSubjects } from "@/lib/queries";
import { payStatus, today } from "@/lib/utils";

const f2 = (n: number | null) => (n === null ? "" : n.toFixed(2));

export async function GET(req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  if (!(await isAuthenticated())) return Response.json({ error: "Non autorisé" }, { status: 401 });
  const { type } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const d = today();

  const [students, subjects] = await Promise.all([getStudents(), getSubjects()]);
  const stu = (id: string) => students.find((s) => s.id === id);
  const sub = (id: string) => subjects.find((s) => s.id === id);

  switch (type) {
    case "participations": {
      const [parts, points] = await Promise.all([getParticipations(), getPointsByStudent()]);
      return csvResponse(
        `participations_${d}.csv`,
        toCsv(
          ["Numero", "Etudiant", "Matiere", "Date", "Valeur", "Type", "Motif", "Total_Etudiant"],
          parts.map((p) => [stu(p.studentId)?.numero, `${stu(p.studentId)?.nom ?? ""} ${stu(p.studentId)?.prenoms ?? ""}`, sub(p.subjectId)?.nom, p.date, p.type === "bonus" ? `+${p.valeur}` : `-${p.valeur}`, p.type, p.motif, points[p.studentId]?.total ?? 0]),
        ),
      );
    }

    case "resume-semestre": {
      const points = await getPointsByStudent();
      return csvResponse(
        `resume_semestre_${d}.csv`,
        toCsv(
          ["Numero", "Nom", "Prenoms", "Bonus", "Malus", "Total", "Statut"],
          students.map((s) => [s.numero, s.nom, s.prenoms, points[s.id]?.bonus ?? 0, points[s.id]?.malus ?? 0, points[s.id]?.total ?? 0, s.statut]),
        ),
      );
    }

    case "ventes": {
      const [docs, paid] = await Promise.all([getDocuments(), getPaidMap()]);
      let encaisse = 0, restant = 0, ok = 0, av = 0, non = 0;
      const rows: (string | number)[][] = [];
      for (const doc of docs)
        for (const s of students.filter((x) => x.statut === "actif")) {
          const p = paid[doc.id]?.[s.id] ?? 0;
          const st = payStatus(p, doc.prix);
          encaisse += p;
          restant += Math.max(0, doc.prix - p);
          if (st === "PAYÉ") ok++;
          else if (st === "AVANCE") av++;
          else non++;
          rows.push([doc.nom, sub(doc.subjectId)?.nom ?? "", `${s.nom} ${s.prenoms}`, s.numero, doc.prix, p, doc.prix - p, st, p > 0 && p < doc.prix ? p : 0]);
        }
      rows.push(["TOTAUX", "", "", "", "", encaisse, restant, `PAYES:${ok} AVANCES:${av} NON_PAYES:${non}`, ""]);
      return csvResponse(`ventes_${d}.csv`, toCsv(["Document", "Matiere", "Etudiant", "Numero", "Prix", "Total_Paye", "Reste", "Statut_Paiement", "Avance"], rows));
    }

    case "evaluations-matiere": {
      const subject = sub(sp.get("subject") ?? "");
      if (!subject) return Response.json({ error: "Matière introuvable" }, { status: 404 });
      const evals = (await db.select().from(evaluations).where(eq(evaluations.subjectId, subject.id)).orderBy(asc(evaluations.date))).filter(Boolean);
      const all = evals.length ? await db.select().from(grades) : [];
      const rows = students
        .filter((s) => s.statut === "actif")
        .map((s) => {
          const cells = evals.map((e) => {
            const g = all.find((x) => x.evaluationId === e.id && x.studentId === s.id);
            if (g?.statut === "ABSENT") return "ABS";
            return g?.note === null || g?.note === undefined ? "" : `${g.note}/${e.bareme}`;
          });
          const a = subjectAverages(
            evals.map((e) => {
              const g = all.find((x) => x.evaluationId === e.id && x.studentId === s.id);
              return { type: e.type as EvalKind, note: g?.note ?? null, statut: g?.statut ?? "PRESENT" };
            }),
          );
          return [s.numero, s.nom, s.prenoms, ...cells, f2(a.moyInterro), f2(a.moyInterro20), f2(a.moyDevoir), f2(a.moyMatiere)];
        });
      const head = ["Numero", "Nom", "Prenoms", ...evals.map((e) => `${e.nom} (${e.type[0]} ${e.date}) /${e.bareme}`), "Moy_Interro_/10", "Moy_Interro_/20", "Moy_Devoir_/20", "Moy_Matiere_/20"];
      return csvResponse(`eval_${subject.nom.replace(/[^a-z0-9]/gi, "_")}_${d}.csv`, toCsv(head, rows));
    }

    case "evaluations-individuel": {
      const profile = await getStudentProfile(sp.get("student") ?? "");
      if (!profile) return Response.json({ error: "Étudiant introuvable" }, { status: 404 });
      const rows: (string | number)[][] = [];
      for (const b of profile.bySubject) {
        for (const { evaluation: e, grade: g } of b.rows) rows.push([b.subject.nom, e.nom, e.type, e.date, e.bareme, g.note ?? "", g.statut, "", "", ""]);
        rows.push([b.subject.nom, "MOYENNES", "", "", "", "", "", f2(b.averages.moyInterro), f2(b.averages.moyDevoir), f2(b.averages.moyMatiere)], []);
      }
      const { nom, prenoms } = profile.student;
      return csvResponse(
        `eval_individuel_${nom}_${prenoms}_${d}.csv`.replace(/[^\w.-]+/g, "_"),
        toCsv(["Matiere", "Evaluation", "Type", "Date", "Bareme", "Note", "Statut", "Moy_Interro_/10", "Moy_Devoir_/20", "Moy_Matiere"], rows),
      );
    }

    case "evaluations-semestre": {
      const [evals, all] = await Promise.all([db.select().from(evaluations), db.select().from(grades)]);
      const rows: (string | number)[][] = [];
      for (const g of all) {
        const e = evals.find((x) => x.id === g.evaluationId);
        const s = stu(g.studentId);
        const m = e && sub(e.subjectId);
        if (!e || !s || !m) continue;
        rows.push([s.numero, s.nom, s.prenoms, m.nom, e.type, e.nom, e.date, g.note ?? "", e.bareme, g.statut]);
      }
      return csvResponse(`eval_semestre_${d}.csv`, toCsv(["Numero", "Nom", "Prenoms", "Matiere", "Type_Eval", "Nom_Eval", "Date", "Note", "Bareme", "Statut"], rows));
    }

    default:
      return Response.json({ error: "Export inconnu" }, { status: 404 });
  }
}
