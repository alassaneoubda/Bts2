"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Fragment, useMemo, useState, useTransition } from "react";
import { addPayment, createDocument, deleteDocument, deletePayment } from "@/actions/data";
import { Card, PageHeader, btnGhost, btnPrimary } from "@/components/ui/bits";
import { Modal } from "@/components/ui/modal";
import { Bar } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import { firstName, fmtMoney, payStatus, today, type PayStatus } from "@/lib/utils";

type Doc = { id: string; subjectId: string; nom: string; prix: number; description: string; date: string };
type Stu = { id: string; numero: number; nom: string; prenoms: string };
type Pay = { id: string; documentId: string; studentId: string; montant: number; date: string; commentaire: string };
type Sub = { id: string; nom: string; statut: string };

const tone: Record<PayStatus, string> = {
  PAYÉ: "bg-green-50 text-green-700",
  AVANCE: "bg-[#FFF3E6] text-[#b45300]",
  "NON PAYÉ": "bg-red-50 text-red-700",
};

export function DocumentsView({ documents, subjects, students, payments }: { documents: Doc[]; subjects: Sub[]; students: Stu[]; payments: Pay[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const active = subjects.filter((s) => s.statut === "actif");
  const [form, setForm] = useState({ subjectId: active[0]?.id ?? "", nom: "", prix: "", description: "", date: today() });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | PayStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<{ studentId: string; documentId: string } | null>(null);
  const [pay, setPay] = useState({ montant: "", date: today(), commentaire: "" });

  const paid = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const p of payments) ((m[p.documentId] ??= {})[p.studentId] = (m[p.documentId][p.studentId] ?? 0) + p.montant);
    return m;
  }, [payments]);

  const totals = (d: Doc) => {
    let encaisse = 0,
      restant = 0,
      ok = 0,
      av = 0,
      non = 0;
    for (const s of students) {
      const p = paid[d.id]?.[s.id] ?? 0;
      encaisse += p;
      restant += Math.max(0, d.prix - p);
      const st = payStatus(p, d.prix);
      if (st === "PAYÉ") ok++;
      else if (st === "AVANCE") av++;
      else non++;
    }
    return { encaisse, restant, ok, av, non, pct: students.length && d.prix ? (encaisse / (d.prix * students.length)) * 100 : 0 };
  };

  const selected = documents.find((d) => d.id === selectedId) ?? null;

  const create = () =>
    start(async () => {
      const r = await createDocument(form);
      if (!r.ok) return toast("error", r.error);
      toast("success", "Document créé");
      setSelectedId(r.id);
      setForm((f) => ({ ...f, nom: "", prix: "", description: "" }));
    });

  const removeDoc = (d: Doc) => {
    if (!confirm(`Supprimer « ${d.nom} » et tous ses paiements ?`)) return;
    start(async () => {
      await deleteDocument(d.id);
      setSelectedId(null);
      toast("success", "Document supprimé");
    });
  };

  const openPay = (studentId: string, d: Doc) => {
    const reste = Math.max(0, d.prix - (paid[d.id]?.[studentId] ?? 0));
    setPay({ montant: reste ? String(reste) : "", date: today(), commentaire: "" });
    setPayModal({ studentId, documentId: d.id });
  };

  const submitPay = () => {
    if (!payModal) return;
    const d = documents.find((x) => x.id === payModal.documentId)!;
    const montant = parseInt(pay.montant, 10);
    const reste = d.prix - (paid[d.id]?.[payModal.studentId] ?? 0);
    if (!isNaN(montant) && montant > reste && !confirm(`Attention : montant ${montant} > reste ${reste} FCFA. Continuer quand même ?`)) return;
    start(async () => {
      const r = await addPayment({ ...payModal, ...pay });
      if (!r.ok) return toast("error", r.error);
      toast("success", "Paiement enregistré");
      setPayModal(null);
    });
  };

  const removePay = (id: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    start(async () => {
      await deletePayment(id);
      toast("success", "Paiement supprimé");
    });
  };

  const payStudent = payModal ? students.find((s) => s.id === payModal.studentId) : null;
  const payDoc = payModal ? documents.find((d) => d.id === payModal.documentId) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Documents & Ventes" />
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Card>
          <h3 className="font-bold mb-4">Créer vente document</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Matière</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="field">
                {active.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nom document</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Support Infographie S1" className="field" />
            </div>
            <div>
              <label className="label">Prix (FCFA)</label>
              <input inputMode="numeric" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value.replace(/\D/g, "") })} placeholder="2000" className="field" />
            </div>
            <div>
              <label className="label">Description (optionnel)</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="field" />
            </div>
            <button onClick={create} disabled={pending} className={`${btnPrimary} w-full !h-11 !rounded-xl !text-[14px]`}>
              Créer & afficher paiements
            </button>
            <div className="text-[11px] text-neutral-500">Après création, la liste des {students.length} étudiants apparaît pour suivi (PAYÉ / AVANCE / NON PAYÉ).</div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="!p-4">
            <h3 className="font-bold mb-3">Ventes existantes ({documents.length}) — Totaux par matière</h3>
            {documents.length === 0 && <div className="text-[12px] text-neutral-400 py-4">Aucun document. Créez-en un à gauche.</div>}
            <div className="grid md:grid-cols-2 gap-3">
              <AnimatePresence initial={false}>
                {documents.map((d) => {
                  const t = totals(d);
                  const on = d.id === selectedId;
                  return (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedId(on ? null : d.id)}
                      className={`rounded-2xl border p-4 cursor-pointer transition-colors ${on ? "border-primary bg-[#FFF6EE]" : "border-black/5 bg-panel"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-semibold text-[13px]">{d.nom}</div>
                          <div className="text-[11px] text-neutral-500">{subjects.find((s) => s.id === d.subjectId)?.nom}</div>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full bg-black text-white whitespace-nowrap">{fmtMoney(d.prix)}</span>
                      </div>
                      <div className="mt-3">
                        <Bar pct={t.pct} className="bg-green-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-2 text-[11px]">
                        <div>
                          Encaissé : <b>{fmtMoney(t.encaisse)}</b>
                        </div>
                        <div>
                          Reste : <b>{fmtMoney(t.restant)}</b>
                        </div>
                        <div className="text-green-700">Payés : {t.ok}</div>
                        <div className="text-[#b45300]">Avances : {t.av}</div>
                        <div className="text-red-700 col-span-2">Non payés : {t.non}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </Card>

          <AnimatePresence>
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                <Card className="!p-4">
                  <div className="flex flex-wrap justify-between gap-3 items-center mb-3">
                    <div>
                      <h3 className="font-bold">
                        {selected.nom} <span className="text-neutral-400 font-normal">• {fmtMoney(selected.prix)}</span>
                      </h3>
                      {selected.description && <div className="text-[12px] text-neutral-500">{selected.description}</div>}
                    </div>
                    <div className="flex gap-2 items-center">
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-full border border-black/10 px-3 text-[13px] bg-panel">
                        <option value="all">Tous statuts</option>
                        <option value="PAYÉ">Payé</option>
                        <option value="AVANCE">Avance</option>
                        <option value="NON PAYÉ">Non payé</option>
                      </select>
                      <button onClick={() => removeDoc(selected)} className="h-9 px-3 rounded-full border text-[12px] hover:border-red-500 hover:text-red-600 transition">
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead className="border-b">
                        <tr>
                          {["N°", "Étudiant", "Payé", "Reste", "Statut", ""].map((h) => (
                            <th key={h} className="th py-2">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const p = paid[selected.id]?.[s.id] ?? 0;
                          const st = payStatus(p, selected.prix);
                          if (statusFilter !== "all" && st !== statusFilter) return null;
                          const list = payments.filter((x) => x.documentId === selected.id && x.studentId === s.id);
                          const open = expanded === s.id;
                          return (
                            <Fragment key={s.id}>
                              <tr className="border-b border-black/5 hover:bg-[#FFF9F3]">
                                <td className="py-2 font-bold text-[12px]">{s.numero}</td>
                                <td className="text-[12px] font-medium">
                                  <Link href={`/etudiants/${s.id}`} className="hover:text-primary">
                                    {s.nom} {firstName(s.prenoms)}
                                  </Link>
                                </td>
                                <td>{fmtMoney(p)}</td>
                                <td>{fmtMoney(Math.max(0, selected.prix - p))}</td>
                                <td>
                                  <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${tone[st]}`}>{st}</span>
                                </td>
                                <td className="text-right whitespace-nowrap">
                                  {list.length > 0 && (
                                    <button onClick={() => setExpanded(open ? null : s.id)} className="text-[11px] px-2 py-1 rounded-full bg-[#F2F2F0] mr-1">
                                      Détails ({list.length})
                                    </button>
                                  )}
                                  {st !== "PAYÉ" && (
                                    <button onClick={() => openPay(s.id, selected)} className="text-[11px] px-2 py-1 rounded-full bg-primary text-white">
                                      + Paiement
                                    </button>
                                  )}
                                </td>
                              </tr>
                              <AnimatePresence>
                                {open && (
                                  <tr>
                                    <td colSpan={6} className="p-0">
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-panel">
                                        <div className="p-3 space-y-1.5">
                                          {list.map((x) => (
                                            <div key={x.id} className="flex justify-between items-center text-[12px]">
                                              <span>
                                                {x.date} • <b>{fmtMoney(x.montant)}</b> {x.commentaire && <span className="text-neutral-500">— {x.commentaire}</span>}
                                              </span>
                                              <button onClick={() => removePay(x.id)} className="text-neutral-300 hover:text-red-600 px-2" aria-label="Supprimer le paiement">
                                                ✕
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    </td>
                                  </tr>
                                )}
                              </AnimatePresence>
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Ajouter paiement">
        {payStudent && payDoc && (
          <div className="space-y-3">
            <div className="text-[13px] bg-panel rounded-xl p-3 border">
              <b>
                {payStudent.nom} {firstName(payStudent.prenoms)}
              </b>{" "}
              — {payDoc.nom}
              <div className="text-[11px] text-neutral-500 mt-1">
                Prix {fmtMoney(payDoc.prix)} • Payé {fmtMoney(paid[payDoc.id]?.[payStudent.id] ?? 0)}
              </div>
            </div>
            <div>
              <label className="label">Montant FCFA</label>
              <input inputMode="numeric" value={pay.montant} onChange={(e) => setPay({ ...pay, montant: e.target.value.replace(/\D/g, "") })} className="field" autoFocus />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} className="field" />
            </div>
            <div>
              <label className="label">Commentaire</label>
              <input value={pay.commentaire} onChange={(e) => setPay({ ...pay, commentaire: e.target.value })} className="field" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={submitPay} disabled={pending} className={`${btnPrimary} flex-1`}>
                Enregistrer
              </button>
              <button onClick={() => setPayModal(null)} className={btnGhost}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
