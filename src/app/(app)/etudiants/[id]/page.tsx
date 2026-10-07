import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Empty, btnDark } from "@/components/ui/bits";
import { AnimatedNumber, Stagger, StaggerItem } from "@/components/ui/motion";
import { getStudentProfile } from "@/lib/queries";
import { fmtDate, fmtMoney, fmtNum, payStatus } from "@/lib/utils";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await getStudentProfile(id);
  if (!p) notFound();
  const { student: s } = p;
  const subName = (sid: string) => p.subjects.find((x) => x.id === sid)?.nom ?? "";
  const tone = { PAYÉ: "green", AVANCE: "orange", "NON PAYÉ": "red" } as const;

  return (
    <div className="space-y-6">
      <Link href="/etudiants" className="text-[12px] text-neutral-500 hover:text-primary">
        ← Étudiants
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white font-extrabold flex items-center justify-center text-[18px]">{s.numero}</div>
            <div>
              <h2 className="text-[24px] font-extrabold tracking-tight leading-tight">
                {s.nom} {s.prenoms}
              </h2>
              <div className="text-[12px] text-neutral-500 mt-0.5">
                Étudiant N°{s.numero} • <Badge tone={s.statut === "actif" ? "neutral" : "red"}>{s.statut}</Badge>
              </div>
            </div>
          </div>
        </div>
        <a href={`/api/export/evaluations-individuel?student=${s.id}`} className={`${btnDark} inline-flex items-center`}>
          Export notes
        </a>
      </div>

      <Stagger className="grid grid-cols-3 gap-4">
        {[
          { l: "Bonus", v: p.bonus, pre: "+", c: "bg-[#E9F8EF]" },
          { l: "Malus", v: p.malus, pre: "-", c: "bg-[#FCECEC]" },
          { l: "Total points", v: p.total, pre: "", c: "bg-white" },
        ].map((x) => (
          <StaggerItem key={x.l}>
            <div className={`${x.c} rounded-[20px] p-5 border border-black/5`}>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">{x.l}</div>
              <div className="text-[26px] font-extrabold mt-2">
                {x.pre}
                <AnimatedNumber value={x.v} />
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-3">Points par matière</h3>
          {Object.keys(p.pointsBySubject).length === 0 ? (
            <Empty>Aucune participation</Empty>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="border-b">
                <tr>
                  <th className="th py-2">Matière</th>
                  <th className="th">Points</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(p.pointsBySubject).map(([sid, pts]) => (
                  <tr key={sid} className="border-b border-black/5">
                    <td className="py-2">{subName(sid)}</td>
                    <td>
                      <Badge tone={pts >= 0 ? "green" : "red"}>{pts > 0 ? `+${pts}` : pts}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <h3 className="font-bold mb-3">Historique participations</h3>
          {p.participations.length === 0 ? (
            <Empty>Aucun historique</Empty>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-auto">
              {p.participations.map((x) => (
                <div key={x.id} className="flex items-center justify-between text-[12px] bg-panel rounded-xl p-2.5 border">
                  <div>
                    <div className="font-medium">{x.motif}</div>
                    <div className="text-neutral-500">
                      {subName(x.subjectId)} • {fmtDate(x.date)}
                    </div>
                  </div>
                  <Badge tone={x.type === "bonus" ? "green" : "red"}>{x.type === "bonus" ? `+${x.valeur}` : `-${x.valeur}`}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-3">Interrogations & Devoirs — Résultats par matière</h3>
        {p.bySubject.length === 0 ? (
          <Empty>Aucune note enregistrée</Empty>
        ) : (
          <div className="space-y-5">
            {p.bySubject.map(({ subject, rows, averages: a }) => (
              <div key={subject.id}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="font-semibold text-[14px]">{subject.nom}</div>
                  <div className="flex gap-1.5 text-[11px] flex-wrap">
                    <Badge>Interro /10 : {fmtNum(a.moyInterro)}</Badge>
                    <Badge>Devoir /20 : {fmtNum(a.moyDevoir)}</Badge>
                    <Badge tone="orange">Moyenne /20 : {fmtNum(a.moyMatiere)}</Badge>
                  </div>
                </div>
                <table className="w-full text-[13px]">
                  <thead className="border-b">
                    <tr>
                      {["Évaluation", "Type", "Date", "Note", "Statut"].map((h) => (
                        <th key={h} className="th py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ evaluation: e, grade: g }) => (
                      <tr key={g.id} className="border-b border-black/5">
                        <td className="py-2">{e.nom}</td>
                        <td className="text-[11px]">{e.type}</td>
                        <td>{fmtDate(e.date)}</td>
                        <td className="font-semibold">{g.note !== null ? `${g.note}/${e.bareme}` : "—"}</td>
                        <td>
                          <Badge tone={g.statut === "ABSENT" ? "red" : "green"}>{g.statut}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Achats documents & paiements</h3>
        {p.purchases.length === 0 ? (
          <Empty>Aucun document en vente</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b">
                <tr>
                  {["Document", "Prix", "Payé", "Reste", "Statut", "Détails"].map((h) => (
                    <th key={h} className="th py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.purchases.map((x) => {
                  const st = payStatus(x.paid, x.doc.prix);
                  return (
                    <tr key={x.doc.id} className="border-b border-black/5 align-top">
                      <td className="py-2">
                        <div className="font-medium">{x.doc.nom}</div>
                        <div className="text-[11px] text-neutral-500">{x.subjectNom}</div>
                      </td>
                      <td>{fmtMoney(x.doc.prix)}</td>
                      <td>{fmtMoney(x.paid)}</td>
                      <td>{fmtMoney(Math.max(0, x.doc.prix - x.paid))}</td>
                      <td>
                        <Badge tone={tone[st]}>{st}</Badge>
                      </td>
                      <td className="text-[11px] text-neutral-500">
                        {x.payments.length === 0 ? "—" : x.payments.map((pm) => <div key={pm.id}>{fmtDate(pm.date)} • {fmtMoney(pm.montant)}</div>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
