"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

export type PickerStudent = { id: string; numero: number; nom: string; prenoms: string };

/** Recherche d'étudiant par nom / prénoms / numéro avec liste déroulante. */
export function StudentPicker({
  students,
  value,
  onChange,
  label = "Étudiant (recherche nom/prénom)",
}: {
  students: PickerStudent[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const selected = students.find((s) => s.id === value);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return [];
    return students.filter((s) => `${s.nom} ${s.prenoms} ${s.numero}`.toLowerCase().includes(q)).slice(0, 8);
  }, [text, students]);

  return (
    <div className="relative">
      <label className="label">{label}</label>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Ex: ACHI, MARIE..."
        className="field"
      />
      <AnimatePresence>
        {open && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-black/10 shadow-lg max-h-[220px] overflow-auto"
          >
            {matches.map((s) => (
              <button
                type="button"
                key={s.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s.id);
                  setText(`${s.nom} ${s.prenoms} (N°${s.numero})`);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#FFF6EE] text-[13px]"
              >
                <span className="font-semibold">{s.nom}</span> {s.prenoms} <span className="text-neutral-500">— N°{s.numero}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {selected && (
        <div className="text-[11px] text-green-700 mt-1">
          ✓ {selected.nom} {selected.prenoms}
        </div>
      )}
    </div>
  );
}
