"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEvaluation, saveEvaluation } from "@/actions/data";
import { Card, PageHeader, btnGhost, btnPrimary } from "@/components/ui/bits";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { today } from "@/lib/utils";
import { GradeSheet } from "./grade-sheet";

export type Ev = { id: string; subjectId: string; nom: string; type: "INTERROGATION" | "DEVOIR"; bareme: number; date: string };
export type Sub = { id: string; nom: string; statut: string };
export type Stu = { id: string; numero: number; nom: string; prenoms: string };
export type GradeRow = { studentId: string; note: number | null; statut: "PRESENT" | "ABSENT" };

export function EvaluationsView({
  evaluations,
  subjects,
  counts,
  students,
  selectedId,
  grades,
  openNew,
}: {
  evaluations: Ev[];
  subjects: Sub[];
  counts: Record<string, number>;
  students: Stu[];
  selectedId: string | null;
  grades: GradeRow[];
  openNew: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState(openNew);
  const blank = { id: null as string | null, subjectId: subjects.find((s) => s.statut === "actif")?.id ?? subjects[0]?.id ?? "", nom: "", type: "INTERROGATION" as Ev["type"], date: today() };
  const [form, setForm] = useState(blank);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.nom ?? "";
  const visible = evaluations.filter((e) => {
    if (subjectFilter !== "all" && e.subjectId !== subjectFilter) return false;
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    const n = q.trim().toLowerCase();
    return !n || e.nom.toLowerCase().includes(n) || subjectName(e.subjectId).toLowerCase().includes(n) || e.date.includes(n) || e.type.toLowerCase().includes(n);
  });
  const selected = evaluations.find((e) => e.id === selectedId) ?? null;

  const openCreate = () => {
    setForm(blank);
    setModal(true);
  };
  const openEdit = (e: Ev) => {
    setForm({ id: e.id, subjectId: e.subjectId, nom: e.nom, type: e.type, date: e.date });
    setModal(true);
  };

  const submit = () =>
    start(async () => {
      const r = await saveEvaluation(form);
      if (!r.ok) return toast("error", r.error);
      toast("success", form.id ? "Évaluation modifiée" : "Évaluation créée");
      setModal(false);
      router.push(`/evaluations?eval=${r.id}`);
    });

  const remove = (e: Ev) => {
    if (!confirm("Supprimer cette évaluation et toutes ses notes ?")) return;
    start(async () => {
      await deleteEvaluation(e.id);
      toast("success", "Évaluation supprimée");
      router.push("/evaluations");
    });
  };

  const exportHref = (subjectId: string) => `/api/export/evaluations-matiere?subject=${subjectId}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interrogations & Devoirs"
        subtitle={`2026–2027 • ${evaluations.length} évaluations • Barème auto /10 INTERRO, /20 DEVOIR`}
        actions={
          <button onClick={openCreate} className={`${btnPrimary} !h-11 !px-6`}>
            + NOUVELLE ÉVALUATION
          </button>
        }
      />

      <Card className="!p-4 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher matière, nom, date..." className="h-10 rounded-full border border-black/10 px-4 text-[13px] bg-panel flex-1 min-w-[220px] outline-none focus:border-primary" />
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-10 rounded-full border border-black/10 px-3 text-[13px] bg-panel">
          <option value="all">Toutes matières</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-full border border-black/10 px-3 text-[13px] bg-panel">
          <option value="all">Tous types</option>
          <option value="INTERROGATION">INTERROGATION /10</option>
          <option value="DEVOIR">DEVOIR /20</option>
        </select>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-4">
          {subjects
            .filter((s) => subjectFilter === "all" || s.id === subjectFilter)
            .map((s) => {
              const list = visible.filter((e) => e.subjectId === s.id);
              if (list.length === 0 && q) return null;
              return (
                <Card key={s.id} className="!p-5">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-[14px] leading-tight">{s.nom}</div>
                    <span className="text-[10px] bg-[#F2F2F0] px-2 py-1 rounded-full">{list.length} évals</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(["INTERROGATION", "DEVOIR"] as const).map((type) => {
                      const items = list.filter((e) => e.type === type);
                      return (
                        <div key={type}>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-2">{type === "INTERROGATION" ? "Interrogations /10" : "Devoirs /20"}</div>
                          {items.length === 0 ? (
                            <div className="text-[11px] text-neutral-400">Aucun{type === "INTERROGATION" ? "e" : ""}</div>
                          ) : (
                            items.map((e) => {
                              const active = e.id === selectedId;
                              return (
                                <Link
                                  key={e.id}
                                  href={`/evaluations?eval=${e.id}`}
                                  scroll={false}
                                  className={`relative block w-full text-left p-3 rounded-xl border text-[12px] mb-2 transition ${active ? "bg-[#FFF6EE] border-primary" : "bg-panel border-black/5 hover:bg-white hover:-translate-y-0.5"}`}
                                >
                                  <div className="font-semibold flex justify-between">
                                    <span>{e.nom}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${type === "INTERROGATION" ? "bg-black" : "bg-primary"}`}>/{e.bareme}</span>
                                  </div>
                                  <div className="text-neutral-500 mt-1">
                                    {e.date} • {counts[e.id] ?? 0}/{students.length} saisies
                                  </div>
                                </Link>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3">
                    <a href={exportHref(s.id)} className="h-8 px-3 rounded-full bg-black text-white text-[11px] font-semibold inline-flex items-center">
                      Exporter {s.nom.slice(0, 12)}
                    </a>
                  </div>
                </Card>
              );
            })}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="!p-10 text-center">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-16 h-16 rounded-2xl bg-soft mx-auto flex items-center justify-center text-[24px]">
                    ✎
                  </motion.div>
                  <div className="font-bold mt-4">Sélectionnez une évaluation</div>
                  <div className="text-[12px] text-neutral-500 mt-1 max-w-[320px] mx-auto">
                    Créez une nouvelle évaluation via + NOUVELLE ÉVALUATION, puis saisissez les notes. Ex : Infographie — Interrogation N°1 — /10 — 15/10/2026
                  </div>
                  <button onClick={openCreate} className={`${btnPrimary} mt-4`}>
                    Créer évaluation
                  </button>
                </Card>
              </motion.div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <GradeSheet
                  evaluation={selected}
                  subjectName={subjectName(selected.subjectId)}
                  students={students}
                  initial={grades}
                  onEdit={() => openEdit(selected)}
                  onDelete={() => remove(selected)}
                  exportHref={exportHref(selected.subjectId)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? "Modifier évaluation" : "Nouvelle évaluation"}>
        <div className="space-y-3">
          <div>
            <label className="label">Matière</label>
            <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="field">
              {subjects
                .filter((s) => s.statut === "actif" || s.id === form.subjectId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex rounded-xl border border-black/10 overflow-hidden h-11">
              {(["INTERROGATION", "DEVOIR"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} className="flex-1 text-[13px] font-semibold relative">
                  {form.type === t && <motion.span layoutId="evtype" className="absolute inset-0 bg-black" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
                  <span className={`relative ${form.type === t ? "text-white" : ""}`}>{t === "INTERROGATION" ? "Interrogation /10" : "Devoir /20"}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Nom</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Interrogation N°1" className="field" autoFocus />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={submit} disabled={pending} className={`${btnPrimary} flex-1`}>
              Enregistrer
            </button>
            <button onClick={() => setModal(false)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
