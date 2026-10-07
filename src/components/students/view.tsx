"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { saveStudent } from "@/actions/data";
import { Card, PageHeader, btnGhost, btnPrimary } from "@/components/ui/bits";
import { Modal } from "@/components/ui/modal";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";

type Row = { id: string; numero: number; nom: string; prenoms: string; statut: "actif" | "inactif"; points: number; notes: number };
const blank = { id: null as string | null, numero: "", nom: "", prenoms: "", statut: "actif" as "actif" | "inactif" };

export function StudentsView({ rows }: { rows: Row[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [q, setQ] = useState("");

  const list = rows.filter((r) => !q.trim() || `${r.nom} ${r.prenoms} ${r.numero}`.toLowerCase().includes(q.toLowerCase()));

  const submit = () =>
    start(async () => {
      const r = await saveStudent(form);
      if (!r.ok) return toast("error", r.error);
      toast("success", form.id ? "Étudiant modifié" : "Étudiant ajouté");
      setOpen(false);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Étudiants"
        subtitle={`${rows.filter((r) => r.statut === "actif").length} actifs • ${rows.length} au total`}
        actions={
          <button
            onClick={() => {
              setForm(blank);
              setOpen(true);
            }}
            className={btnPrimary}
          >
            + Ajouter
          </button>
        }
      />
      <Card className="!p-4 lg:!p-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par nom, prénom ou numéro..." className="h-10 rounded-full border border-black/10 px-4 text-[13px] bg-panel w-full max-w-[360px] outline-none focus:border-primary mb-4" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="border-b">
              <tr>
                {["N°", "Nom", "Prénoms", "Points", "Notes", "Statut", "Actions"].map((h) => (
                  <th key={h} className="th py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.012 } } }}>
              {list.map((r) => (
                <motion.tr key={r.id} variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }} className={`border-b border-black/5 hover:bg-[#FFF9F3] ${r.statut === "inactif" ? "opacity-50" : ""}`}>
                  <td className="py-2.5 font-bold text-[12px]">{r.numero}</td>
                  <td className="font-semibold">{r.nom}</td>
                  <td className="text-[12px]">{r.prenoms}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${r.points >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{r.points} pts</span>
                  </td>
                  <td className="text-[12px]">{r.notes}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-[11px] ${r.statut === "actif" ? "bg-[#F2F2F0]" : "bg-red-50 text-red-700"}`}>{r.statut}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <Link href={`/etudiants/${r.id}`} className="text-[11px] px-2 py-1 rounded-full bg-black text-white mr-1">
                      Fiche
                    </Link>
                    <button
                      onClick={() => {
                        setForm({ id: r.id, numero: String(r.numero), nom: r.nom, prenoms: r.prenoms, statut: r.statut });
                        setOpen(true);
                      }}
                      className="text-[11px] px-2 py-1 rounded-full bg-[#F2F2F0]"
                    >
                      Modifier
                    </button>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Modifier étudiant" : "Ajouter étudiant"}>
        <div className="space-y-3">
          <div>
            <label className="label">Numéro</label>
            <input type="number" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Auto" className="field" />
          </div>
          <div>
            <label className="label">Nom</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="field" autoFocus />
          </div>
          <div>
            <label className="label">Prénoms</label>
            <input value={form.prenoms} onChange={(e) => setForm({ ...form, prenoms: e.target.value })} className="field" />
          </div>
          <div>
            <label className="label">Statut</label>
            <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as "actif" | "inactif" })} className="field">
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={submit} disabled={pending} className={`${btnPrimary} flex-1`}>
              Enregistrer
            </button>
            <button onClick={() => setOpen(false)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
