"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { saveGrade } from "@/actions/data";
import { Card, btnGhost } from "@/components/ui/bits";
import { useToast } from "@/components/ui/toast";
import { firstName } from "@/lib/utils";
import type { Ev, GradeRow, Stu } from "./view";

type Cell = { text: string; saved: number | null; statut: "PRESENT" | "ABSENT"; state: "idle" | "saving" | "saved" };

export function GradeSheet({
  evaluation: ev,
  subjectName,
  students,
  initial,
  onEdit,
  onDelete,
  exportHref,
}: {
  evaluation: Ev;
  subjectName: string;
  students: Stu[];
  initial: GradeRow[];
  onEdit: () => void;
  onDelete: () => void;
  exportHref: string;
}) {
  const toast = useToast();
  const [filter, setFilter] = useState("");
  const [cells, setCells] = useState<Record<string, Cell>>(() => {
    const m: Record<string, Cell> = {};
    for (const g of initial) m[g.studentId] = { text: g.note === null ? "" : String(g.note), saved: g.note, statut: g.statut, state: "idle" };
    return m;
  });
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const cell = (id: string): Cell => cells[id] ?? { text: "", saved: null, statut: "PRESENT", state: "idle" };
  const patch = (id: string, p: Partial<Cell>) => setCells((c) => ({ ...c, [id]: { ...cell(id), ...c[id], ...p } }));

  const rows = students.filter((s) => !filter.trim() || `${s.nom} ${s.prenoms} ${s.numero}`.toLowerCase().includes(filter.toLowerCase()));

  const stats = useMemo(() => {
    const notes = Object.values(cells)
      .filter((c) => c.statut === "PRESENT" && c.saved !== null)
      .map((c) => c.saved as number);
    return {
      n: notes.length,
      absents: Object.values(cells).filter((c) => c.statut === "ABSENT").length,
      avg: notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null,
      min: notes.length ? Math.min(...notes) : null,
      max: notes.length ? Math.max(...notes) : null,
    };
  }, [cells]);

  async function commit(studentId: string, raw: string) {
    const c = cell(studentId);
    const trimmed = raw.trim().replace(",", ".");
    const value = trimmed === "" ? null : parseFloat(trimmed);
    if (value !== null && isNaN(value)) return patch(studentId, { text: c.saved === null ? "" : String(c.saved) });
    if (value === c.saved) return patch(studentId, { text: value === null ? "" : String(value) });
    if (value !== null && (value < 0 || value > ev.bareme)) {
      toast("error", `Note impossible : entre 0 et ${ev.bareme}`);
      return patch(studentId, { text: c.saved === null ? "" : String(c.saved) });
    }
    if (value !== null && c.saved !== null && Math.abs(value - c.saved) > 2 && !confirm(`Modification importante : ${c.saved}/${ev.bareme} → ${value}/${ev.bareme}. Confirmer ?`)) {
      return patch(studentId, { text: String(c.saved) });
    }
    patch(studentId, { state: "saving" });
    const r = await saveGrade({ evaluationId: ev.id, studentId, note: value, statut: "PRESENT" });
    if (!r.ok) {
      toast("error", r.error);
      return patch(studentId, { state: "idle", text: c.saved === null ? "" : String(c.saved) });
    }
    patch(studentId, { saved: value, statut: "PRESENT", state: "saved" });
    setTimeout(() => patch(studentId, { state: "idle" }), 1200);
  }

  async function toggleAbsent(studentId: string, absent: boolean) {
    const prev = cell(studentId);
    patch(studentId, { statut: absent ? "ABSENT" : "PRESENT", saved: absent ? null : prev.saved, text: absent ? "" : prev.text, state: "saving" });
    const r = await saveGrade({ evaluationId: ev.id, studentId, note: absent ? null : prev.saved, statut: absent ? "ABSENT" : "PRESENT" });
    if (!r.ok) {
      toast("error", r.error);
      return patch(studentId, prev);
    }
    patch(studentId, { state: "idle" });
  }

  function focusNext(studentId: string) {
    const i = rows.findIndex((s) => s.id === studentId);
    for (let j = i + 1; j < rows.length; j++) {
      const el = inputs.current[rows[j].id];
      if (el && !el.disabled) return el.focus();
    }
  }

  return (
    <Card className="!p-4 lg:!p-6">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h3 className="font-extrabold text-[18px] flex items-center gap-2 flex-wrap">
            {subjectName}
            <span className={`text-[11px] px-2 py-1 rounded-full text-white ${ev.type === "INTERROGATION" ? "bg-black" : "bg-primary"}`}>
              {ev.type} /{ev.bareme}
            </span>
          </h3>
          <div className="text-[12px] text-neutral-500 mt-1">
            {ev.nom} • {ev.date} • {stats.n} notes • {stats.absents} absents
          </div>
          {stats.avg !== null && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex gap-2 text-[11px] flex-wrap">
              <span className="px-2 py-1 rounded-full bg-[#E9F8EF]">
                Moy: {stats.avg.toFixed(2)}/{ev.bareme}
              </span>
              <span className="px-2 py-1 rounded-full bg-[#F2F2F0]">Min {stats.min}/{ev.bareme}</span>
              <span className="px-2 py-1 rounded-full bg-[#F2F2F0]">Max {stats.max}/{ev.bareme}</span>
            </motion.div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="h-8 px-3 rounded-full bg-[#F2F2F0] text-[11px] font-semibold">
            Modifier
          </button>
          <button onClick={onDelete} className="h-8 px-3 rounded-full bg-white border text-[11px] hover:border-red-500 hover:text-red-600 transition">
            Supprimer
          </button>
          <a href={exportHref} className="h-8 px-3 rounded-full bg-black text-white text-[11px] inline-flex items-center">
            Export matière
          </a>
        </div>
      </div>

      <div className="mt-4 flex gap-2 items-center">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer étudiant N°, nom..." className="h-9 rounded-full border border-black/10 px-3 text-[13px] bg-panel flex-1 outline-none focus:border-primary" />
        <div className="text-[11px] text-neutral-500 hidden sm:block px-2">Saisie rapide • Entrée = suivant • sauvegarde automatique</div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b">
            <tr>
              <th className="th py-2">N°</th>
              <th className="th">Étudiant</th>
              <th className="th">Note /{ev.bareme}</th>
              <th className="th">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const c = cell(s.id);
              const absent = c.statut === "ABSENT";
              const n = parseFloat(c.text.replace(",", "."));
              const invalid = !isNaN(n) && (n < 0 || n > ev.bareme);
              return (
                <tr key={s.id} className={`border-b border-black/5 transition-colors ${absent ? "bg-[#FCECEC]/60 opacity-70" : "hover:bg-[#FFF9F3]"}`}>
                  <td className="py-2 font-bold text-[12px]">{s.numero}</td>
                  <td className="font-medium text-[12px]">
                    {s.nom} <span className="font-normal">{firstName(s.prenoms)}</span>
                  </td>
                  <td className="py-1">
                    <div className="flex items-center gap-2">
                      <input
                        ref={(el) => {
                          inputs.current[s.id] = el;
                        }}
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        max={ev.bareme}
                        disabled={absent}
                        value={c.text}
                        onChange={(e) => patch(s.id, { text: e.target.value })}
                        onBlur={(e) => commit(s.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commit(s.id, e.currentTarget.value);
                            focusNext(s.id);
                          }
                        }}
                        placeholder={`/${ev.bareme}`}
                        className={`w-[90px] h-8 rounded-lg border px-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/20 ${invalid ? "border-red-500 bg-red-50" : "border-black/10 bg-panel"}`}
                      />
                      <span className="text-[11px] text-neutral-500">/{ev.bareme}</span>
                      {invalid && <span className="text-[10px] text-red-600">max {ev.bareme}</span>}
                      <span className="w-4 text-[11px]">
                        {c.state === "saving" && <span className="text-neutral-400 animate-pulse">…</span>}
                        {c.state === "saved" && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-600">
                            ✓
                          </motion.span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td>
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input type="checkbox" checked={absent} onChange={(e) => toggleAbsent(s.id, e.target.checked)} className="w-4 h-4 rounded accent-red-600" />
                      <span className={`px-2 py-0.5 rounded-full font-bold ${absent ? "bg-red-600 text-white" : "bg-green-50 text-green-700"}`}>{absent ? "ABSENT" : "PRESENT"}</span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[11px] text-neutral-500 bg-panel rounded-xl p-3 border">
        Barème automatique : INTERROGATION /10, DEVOIR /20. Les notes supérieures au barème sont refusées. ABSENT efface la note et grise la ligne. Sauvegarde en base à chaque validation (Entrée ou sortie du champ). Une modification de plus de 2 points demande confirmation.
      </div>
      <div className="mt-3">
        <Link href="/evaluations" scroll={false} className={`${btnGhost} inline-flex items-center`}>
          Fermer
        </Link>
      </div>
    </Card>
  );
}
