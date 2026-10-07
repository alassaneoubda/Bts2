"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { searchAction } from "@/actions/data";

type Result = Awaited<ReturnType<typeof searchAction>>;

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Result>({ students: [], evals: [] });
  const [, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setRes({ students: [], evals: [] });
      return;
    }
    const t = setTimeout(() => start(async () => setRes(await searchAction(q))), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setQ("");
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => {
    setQ("");
    router.push(href);
  };
  const show = q.trim() && (res.students.length > 0 || res.evals.length > 0);

  return (
    <div ref={box} className="flex-1 max-w-[520px] relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher étudiant, évaluation, matière, date..."
        className="w-full h-10 rounded-full bg-[#F2F2F0] border border-black/5 px-4 pr-10 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <span className="absolute right-3 top-2.5 text-neutral-400">⌕</span>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-black/5 overflow-hidden z-20 max-h-[360px] overflow-y-auto"
          >
            {res.students.map((s) => (
              <button key={s.id} onClick={() => go(`/etudiants/${s.id}`)} className="w-full text-left px-4 py-3 hover:bg-[#FFF6EE] flex items-center justify-between border-b border-black/5">
                <div>
                  <div className="font-semibold text-[13px]">
                    {s.nom} {s.prenoms}
                  </div>
                  <div className="text-[11px] text-neutral-500">Étudiant N°{s.numero}</div>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full ${s.total >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{s.total} pts</span>
              </button>
            ))}
            {res.evals.map((e) => (
              <button key={e.id} onClick={() => go(`/evaluations?eval=${e.id}`)} className="w-full text-left px-4 py-3 hover:bg-[#FFF6EE] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[13px]">
                    {e.nom} <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white ml-1">{e.type}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {e.subjectNom} • {e.date} • /{e.bareme}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
