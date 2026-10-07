"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/actions/auth";
import { USERNAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./search";

type Counts = { participations: number; evaluations: number; students: number };

const NAV = [
  { href: "/", label: "Tableau de bord", icon: "◧" },
  { href: "/participations", label: "Participations & Points", icon: "✦", badge: "participations" as const },
  { href: "/evaluations", label: "Interrogations & Devoirs", icon: "✎", badge: "evaluations" as const },
  { href: "/documents", label: "Documents & Ventes", icon: "◫" },
  { href: "/etudiants", label: "Étudiants", icon: "◐", badge: "students" as const },
  { href: "/matieres", label: "Matières", icon: "⬙" },
  { href: "/exports", label: "Exports", icon: "⤓" },
  { href: "/parametres", label: "Paramètres", icon: "⚙" },
];

function NavList({ counts, onNavigate }: { counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="space-y-1.5">
      {NAV.map((n) => {
        const active = isActive(n.href);
        const badge = n.badge ? counts[n.badge] : 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={cn(
              "relative w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors",
              active ? "text-white" : "text-white/70 hover:text-white hover:bg-white/10",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-xl bg-primary shadow-[0_6px_16px_rgba(255,122,0,0.3)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-3">
              <span className="text-[18px]">{n.icon}</span> {n.label}
            </span>
            {badge > 0 && <span className="relative text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Logos({ size }: { size: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl bg-white overflow-hidden flex items-center justify-center" style={{ width: size, height: size }}>
        <Image src="/logo-bts2.jpeg" alt="BTS" width={size} height={size} className="w-full h-full object-contain" />
      </div>
      <div className="rounded-xl bg-primary overflow-hidden flex items-center justify-center" style={{ width: size, height: size }}>
        <Image src="/logo-esma.jpeg" alt="ESMA" width={size} height={size} className="w-full h-full object-contain" />
      </div>
    </div>
  );
}

export function Shell({ counts, children }: { counts: Counts; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      <aside className="hidden lg:flex w-[290px] bg-[#0F0F0F] text-white flex-col fixed h-screen top-0 left-0 z-20">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Logos size={40} />
          <div>
            <div className="font-bold text-[14px] leading-tight">BTS2 CV-A</div>
            <div className="text-[11px] text-white/60">2026-2027 • Gr.A</div>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <NavList counts={counts} />
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-[12px] text-white/60">Connecté en tant que</div>
            <div className="text-[13px] font-semibold">{USERNAME}</div>
            <form action={logout}>
              <button className="mt-2 text-[12px] bg-white text-black px-3 py-1.5 rounded-lg font-semibold hover:bg-primary hover:text-white transition">Déconnexion</button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[290px] min-h-screen flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-black/5 px-4 lg:px-8 h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} aria-label="Menu" className="lg:hidden w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              ☰
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black overflow-hidden">
                <Image src="/logo-bts2.jpeg" alt="BTS" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <div className="font-bold text-[15px]">BTS2 CV-A Gestion</div>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-soft border">2026-27</span>
            </div>
            <div className="lg:hidden font-bold text-[14px]">BTS2 CV-A</div>
          </div>
          <GlobalSearch />
          <div className="hidden md:flex items-center gap-2 text-[12px] text-neutral-500 whitespace-nowrap">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Neon • {counts.students} élèves • {counts.evaluations} évals
          </div>
        </header>

        <AnimatePresence>
          {open && (
            <motion.div className="lg:hidden fixed inset-0 z-30 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
              <motion.div
                className="w-[300px] h-full bg-[#0F0F0F] p-4 flex flex-col text-white"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <Logos size={36} />
                  <button onClick={() => setOpen(false)} className="text-white/70" aria-label="Fermer">
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <NavList counts={counts} onNavigate={() => setOpen(false)} />
                </div>
                <form action={logout}>
                  <button className="w-full text-[13px] bg-white text-black px-3 py-2 rounded-lg font-semibold">Déconnexion</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="p-4 lg:p-8 pb-[90px] lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
