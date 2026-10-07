"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

/** Compteur qui s'anime jusqu'à la valeur. */
export function AnimatedNumber({ value, money }: { value: number; money?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => (money ? `${Math.round(v).toLocaleString("fr-FR")} F` : String(Math.round(v))));

  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [inView, value, mv]);

  return <motion.span ref={ref}>{text}</motion.span>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** Animation d'entrée de page (utilisée par template.tsx). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/** Carte avec léger effet de survol. */
export function HoverCard({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className={className} onClick={onClick}>
      {children}
    </motion.div>
  );
}

/** Barre de progression animée. */
export function Bar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${className ?? "bg-primary"}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
