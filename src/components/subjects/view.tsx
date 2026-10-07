"use client";

import { useState, useTransition } from "react";
import { saveSubject } from "@/actions/data";
import { Card, PageHeader, btnGhost, btnPrimary } from "@/components/ui/bits";
import { HoverCard, Stagger, StaggerItem } from "@/components/ui/motion";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type Row = { id: string; nom: string; statut: string; evals: number };

export function SubjectsView({ rows }: { rows: Row[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ id: string | null; nom: string } | null>(null);

  const submit = () =>
    start(async () => {
      if (!form) return;
      const r = await saveSubject(form);
      if (!r.ok) return toast("error", r.error);
      toast("success", form.id ? "Matière modifiée" : "Matière ajoutée");
      setForm(null);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matières"
        subtitle={`${rows.length} matières`}
        actions={
          <button onClick={() => setForm({ id: null, nom: "" })} className={btnPrimary}>
            + Ajouter
          </button>
        }
      />
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r, i) => (
          <StaggerItem key={r.id}>
            <HoverCard>
              <Card className="!p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-soft text-primary font-extrabold flex items-center justify-center text-[13px] shrink-0">{i + 1}</div>
                  <button onClick={() => setForm({ id: r.id, nom: r.nom })} className="text-[11px] px-2 py-1 rounded-full bg-[#F2F2F0] hover:bg-black hover:text-white transition">
                    Modifier
                  </button>
                </div>
                <div className="font-bold text-[14px] leading-snug mt-3">{r.nom}</div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  {r.evals} évaluation{r.evals > 1 ? "s" : ""} • {r.statut}
                </div>
              </Card>
            </HoverCard>
          </StaggerItem>
        ))}
      </Stagger>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Modifier matière" : "Ajouter matière"}>
        {form && (
          <div className="space-y-3">
            <div>
              <label className="label">Nom matière</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} className="field" autoFocus />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={submit} disabled={pending} className={`${btnPrimary} flex-1`}>
                Enregistrer
              </button>
              <button onClick={() => setForm(null)} className={btnGhost}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
