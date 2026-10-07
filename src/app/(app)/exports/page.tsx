import { Card, PageHeader } from "@/components/ui/bits";
import { HoverCard, Stagger, StaggerItem } from "@/components/ui/motion";
import { getSubjects } from "@/lib/queries";

const GENERAL = [
  { type: "participations", t: "Export Participations", d: "Numéro, étudiant, date, point, motif, total étudiant" },
  { type: "resume-semestre", t: "Export Résumé fin semestre (participations)", d: "Bonus, malus, total par étudiant" },
  { type: "ventes", t: "Export Ventes", d: "Étudiant, document, prix, payé, avance, reste, statut + totaux" },
  { type: "evaluations-semestre", t: "Export Semestriel / Annuel — Toutes notes", d: "Toutes matières, toutes évaluations, par étudiant" },
];

export default async function ExportsPage() {
  const subjects = await getSubjects();
  return (
    <div className="space-y-6">
      <PageHeader title="Exports Excel (CSV)" subtitle="Génération côté serveur en CSV (compatible Excel, séparateur ;). Inclut évaluations, moyennes, conversions /10→/20." />
      <Stagger className="grid md:grid-cols-2 gap-4">
        {GENERAL.map((g) => (
          <StaggerItem key={g.type}>
            <HoverCard>
              <a href={`/api/export/${g.type}`} className="block h-full">
                <Card className="h-full hover:border-primary transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-[14px]">{g.t}</div>
                      <div className="text-[12px] text-neutral-500 mt-1">{g.d}</div>
                    </div>
                    <span className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0">⤓</span>
                  </div>
                </Card>
              </a>
            </HoverCard>
          </StaggerItem>
        ))}
      </Stagger>

      <Card>
        <h3 className="font-bold mb-1">Exports Interrogations & Devoirs par matière</h3>
        <p className="text-[12px] text-neutral-500 mb-4">Croisé élèves × évaluations + moyennes.</p>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <a key={s.id} href={`/api/export/evaluations-matiere?subject=${s.id}`} className="h-9 px-4 rounded-full bg-black text-white text-[12px] font-semibold inline-flex items-center hover:bg-primary transition">
              {s.nom}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
