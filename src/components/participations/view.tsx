"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { addParticipation, deleteParticipation } from "@/actions/data";
import { Card, PageHeader, btnPrimary } from "@/components/ui/bits";
import { StudentPicker, type PickerStudent } from "@/components/ui/student-picker";
import { useToast } from "@/components/ui/toast";
import { today } from "@/lib/utils";

type Row = { id: string; studentId: string; student: string; numero: number; subjectId: string; subject: string; type: "bonus" | "malus"; valeur: number; date: string; motif: string };

export function ParticipationsView({
  students,
  subjects,
  rows,
}: {
  students: PickerStudent[];
  subjects: { id: string; nom: string; statut: string }[];
  rows: Row[];
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const active = subjects.filter((s) => s.statut === "actif");
  const [form, setForm] = useState({ subjectId: active[0]?.id ?? "", studentId: "", type: "bonus" as "bonus" | "malus", valeur: "+5", date: today(), motif: "" });
  const [filter, setFilter] = useState("all");
  const [pickerKey, setPickerKey] = useState(0);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () =>
    start(async () => {
      const r = await addParticipation(form);
      if (!r.ok) return toast("error", r.error);
      toast("success", "Participation enregistrée");
      setForm((f) => ({ ...f, valeur: f.type === "bonus" ? "+5" : "-2", motif: "", studentId: "" }));
      setPickerKey((k) => k + 1);
    });

  const remove = (id: string) => {
    if (!confirm("Supprimer cette participation ?")) return;
    start(async () => {
      const r = await deleteParticipation(id);
      toast(r.ok ? "success" : "error", r.ok ? "Participation supprimée" : r.error);
    });
  };

  const list = rows.filter((r) => filter === "all" || r.subjectId === filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Participations & Points" />
      <Card>
        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <label className="label">Matière</label>
            <select value={form.subjectId} onChange={(e) => set({ subjectId: e.target.value })} className="field">
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-4">
            <StudentPicker key={pickerKey} students={students} value={form.studentId} onChange={(id) => set({ studentId: id })} />
          </div>
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div>
              <label className="label">Type</label>
              <div className="flex rounded-xl border border-black/10 overflow-hidden h-11 relative">
                {(["bonus", "malus"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set({ type: t, valeur: t === "bonus" ? (form.valeur.startsWith("-") ? "+5" : form.valeur) : form.valeur.startsWith("+") ? "-2" : form.valeur })}
                    className="flex-1 text-[13px] font-semibold relative"
                  >
                    {form.type === t && (
                      <motion.span layoutId="ptype" className={`absolute inset-0 ${t === "bonus" ? "bg-green-600" : "bg-red-600"}`} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                    )}
                    <span className={`relative ${form.type === t ? "text-white" : ""}`}>{t === "bonus" ? "Bonus" : "Malus"}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Valeur (+5, -2)</label>
              <input value={form.valeur} onChange={(e) => set({ valeur: e.target.value })} className="field" placeholder="+5" />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className="field !text-[13px]" />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Motif</label>
          <input value={form.motif} onChange={(e) => set({ motif: e.target.value })} placeholder="Ex: Excellente présentation, Participation active, Retard..." className="field" />
        </div>
        <button onClick={submit} disabled={pending} className={`${btnPrimary} mt-4 !h-11 !rounded-xl !px-6 !text-[14px]`}>
          Enregistrer participation
        </button>
      </Card>

      <Card className="!p-4 lg:!p-6">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <h3 className="font-bold">Historique ({rows.length})</h3>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-full border border-black/10 px-3 text-[13px] bg-panel">
            <option value="all">Toutes matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="border-b">
              <tr>
                {["Étudiant", "Matière", "Date", "Valeur", "Motif", "Fiche", ""].map((h) => (
                  <th key={h} className="th py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {list.map((r) => (
                  <motion.tr key={r.id} layout initial={{ opacity: 0, backgroundColor: "#FFF3E6" }} animate={{ opacity: 1, backgroundColor: "#FFFFFF00" }} exit={{ opacity: 0, x: 30 }} className="border-b border-black/5 hover:bg-[#FFF9F3]">
                    <td className="py-3 font-medium">
                      {r.student} <span className="text-neutral-400">N°{r.numero}</span>
                    </td>
                    <td className="text-[12px]">{r.subject.slice(0, 28)}</td>
                    <td>{r.date}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-[12px] font-bold ${r.type === "bonus" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {r.type === "bonus" ? `+${r.valeur}` : `-${r.valeur}`}
                      </span>
                    </td>
                    <td className="text-neutral-600">{r.motif}</td>
                    <td>
                      <Link href={`/etudiants/${r.studentId}`} className="text-[11px] px-2 py-1 rounded-full bg-black text-white">
                        Voir fiche
                      </Link>
                    </td>
                    <td>
                      <button onClick={() => remove(r.id)} aria-label="Supprimer" className="text-neutral-300 hover:text-red-600 transition px-2">
                        ✕
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {list.length === 0 && <div className="text-center text-[12px] text-neutral-400 py-8">Aucune participation</div>}
        </div>
      </Card>
    </div>
  );
}
