import Link from "next/link";
import { AnimatedNumber, HoverCard, Stagger, StaggerItem } from "@/components/ui/motion";
import { Card, PageHeader, btnDark, btnPrimary } from "@/components/ui/bits";
import { getDashboard } from "@/lib/queries";
import { fmtMoney, firstName } from "@/lib/utils";

export default async function DashboardPage() {
  const d = await getDashboard();

  const stats = [
    { label: "Étudiants actifs", value: d.totalEtudiants, sub: `${d.nbEtudiants} total`, color: "bg-white" },
    { label: "Matières", value: d.totalMatieres, sub: `${d.nbMatieres} créées`, color: "bg-white" },
    { label: "Participations", value: d.totalParticipations, sub: `Bonus ${d.totalBonus} • Malus ${d.totalMalus}`, color: "bg-white" },
    { label: "Évaluations", value: d.totalEvals, sub: `${d.totalNotes} notes saisies`, color: "bg-white" },
    { label: "Total Bonus", value: d.totalBonus, prefix: "+", sub: "Points positifs", color: "bg-[#E9F8EF]" },
    { label: "Total Malus", value: d.totalMalus, prefix: "-", sub: "Points négatifs", color: "bg-[#FCECEC]" },
    { label: "Total Encaissé", value: d.totalEncaisse, money: true, sub: "Paiements docs", color: "bg-[#FFF3E6]" },
    { label: "Total Restant", value: d.totalRestant, money: true, sub: "À encaisser", color: "bg-[#F5F5F5]" },
  ];

  const shortcuts = [
    { t: "Nouvelle évaluation", d: "Matière → Type → Nom → Notes", href: "/evaluations?new=1", c: "bg-primary text-white" },
    { t: "Historique évaluations", d: `${d.totalEvals} évals • /10 et /20`, href: "/evaluations", c: "bg-black text-white" },
    { t: "Ajouter participation", d: "Matière → Étudiant → Bonus/Malus", href: "/participations", c: "bg-white border border-black/10" },
    { t: "Gérer matières", d: `${d.totalMatieres} matières actives`, href: "/matieres", c: "bg-white border border-black/10" },
    { t: "Ventes de documents", d: `${d.nbDocuments} docs • ${fmtMoney(d.totalEncaisse)}`, href: "/documents", c: "bg-white border border-black/10" },
    { t: "Exports", d: "Évaluations par matière, individuel, semestre", href: "/exports", c: "bg-white border border-black/10" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle="ESMA 2A BTS Communication Visuelle — Groupe A — 2026-2027"
        actions={
          <>
            <Link href="/participations" className={`${btnPrimary} inline-flex items-center`}>
              + Participation
            </Link>
            <Link href="/evaluations?new=1" className={`${btnDark} inline-flex items-center`}>
              + Évaluation
            </Link>
          </>
        }
      />

      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <HoverCard className={`${s.color} rounded-[20px] p-5 border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] h-full`}>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">{s.label}</div>
              <div className="text-[24px] font-extrabold mt-2 tracking-tight">
                {s.prefix}
                <AnimatedNumber value={s.value} money={s.money} />
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">{s.sub}</div>
            </HoverCard>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[16px]">Raccourcis rapides</h3>
            <span className="text-[11px] text-neutral-400">Parcours 4 clics</span>
          </div>
          <Stagger className="grid sm:grid-cols-2 gap-3">
            {shortcuts.map((s) => (
              <StaggerItem key={s.t}>
                <HoverCard>
                  <Link href={s.href} className={`${s.c} rounded-2xl p-4 text-left block`}>
                    <div className="font-semibold text-[14px]">{s.t}</div>
                    <div className="text-[11px] opacity-70 mt-1">{s.d}</div>
                  </Link>
                </HoverCard>
              </StaggerItem>
            ))}
          </Stagger>
        </Card>

        <Card>
          <h3 className="font-bold text-[16px] mb-4">Top 5 meilleurs étudiants</h3>
          <Stagger className="space-y-3">
            {d.top5.map((s, i) => (
              <StaggerItem key={s.id}>
                <Link href={`/etudiants/${s.id}`} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF6EE] transition text-left">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      i === 0 ? "bg-primary text-white" : i === 1 ? "bg-black text-white" : "bg-[#F2F2F0]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[13px]">
                      {s.nom} {firstName(s.prenoms)}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      N°{s.numero} • {s.statut}
                    </div>
                  </div>
                  <div className={`text-[13px] font-bold ${s.total >= 0 ? "text-green-600" : "text-red-600"}`}>{s.total} pts</div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-bold text-[13px] mb-2">Dernières évaluations</h4>
            <div className="space-y-2">
              {d.recentEvals.map((e) => (
                <Link key={e.id} href={`/evaluations?eval=${e.id}`} className="block text-[11px] bg-panel rounded-xl p-2 border hover:border-primary transition">
                  <div className="font-semibold">
                    {e.nom} • {e.type} /{e.bareme}
                  </div>
                  <div className="text-neutral-500">
                    {e.subjectNom} • {e.date}
                  </div>
                </Link>
              ))}
              {d.recentEvals.length === 0 && <div className="text-[11px] text-neutral-400">Aucune évaluation encore</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
