"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useActionState } from "react";
import { login } from "@/actions/auth";
import { InstallButton } from "@/components/pwa/pwa";
import { USERNAME } from "@/lib/constants";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen bg-[#FFF6EE] flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-primary/15 blur-3xl"
        animate={{ scale: [1, 1.15, 1], x: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-48 -left-32 w-[420px] h-[420px] rounded-full bg-black/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="w-full max-w-[440px] relative"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
      >
        <div className="bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 border border-black/5">
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
              className="w-[88px] h-[88px] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-sm"
            >
              <Image src="/logo-bts2.jpeg" alt="BTS2 CV-A" width={88} height={88} className="w-full h-full object-contain" priority />
            </motion.div>
            <motion.div
              initial={{ rotate: 8, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 18 }}
              className="w-[88px] h-[88px] rounded-2xl overflow-hidden bg-primary flex items-center justify-center shadow-sm"
            >
              <Image src="/logo-esma.jpeg" alt="ESMA" width={88} height={88} className="w-full h-full object-contain p-1" priority />
            </motion.div>
          </div>
          <h1 className="text-[22px] font-extrabold text-center tracking-tight leading-tight">BTS2 CV-A Gestion</h1>
          <p className="text-center text-[13px] text-neutral-500 mt-1">ESMA • 2A BTS Communication Visuelle • Groupe A • 2026-2027</p>

          <form action={action} className="mt-8 space-y-4">
            <div>
              <label className="label">Utilisateur</label>
              <div className="w-full h-12 rounded-xl border border-black/10 px-4 text-[15px] bg-[#F2F2F0] flex items-center text-neutral-600 font-medium">
                {USERNAME} <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-black text-white">fixe</span>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">
                Mot de passe
              </label>
              <input id="password" name="password" type="password" required autoFocus placeholder="Saisir mot de passe" className="field !h-12 !text-[15px] !px-4" />
            </div>
            {state?.error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl p-3"
              >
                {state.error}
              </motion.div>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={pending}
              className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-[15px] hover:bg-primary-dark transition shadow-[0_8px_20px_rgba(255,122,0,0.25)] disabled:opacity-60"
            >
              {pending ? "Connexion…" : "Se connecter"}
            </motion.button>
            <div className="text-[11px] text-neutral-400 text-center mt-2">Mot de passe modifiable dans Paramètres</div>
          </form>
          <div className="mt-4 flex justify-center">
            <InstallButton className="h-9 px-4 rounded-full bg-black text-white text-[12px] font-semibold hover:bg-neutral-800 active:scale-95 transition" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
