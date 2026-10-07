"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** Enregistre le service worker (production uniquement). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

/**
 * Bouton « Installer l'application ».
 * - Chrome/Edge/Android/Samsung : invite d'installation native (beforeinstallprompt).
 * - iOS Safari et autres navigateurs sans invite : mode d'emploi.
 * Masqué quand l'app est déjà installée (mode standalone).
 */
export function InstallButton({ className }: { className?: string }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true); // masqué tant qu'on n'a pas détecté
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const click = async () => {
    if (evt) {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setEvt(null);
    } else setHelp(true);
  };

  return (
    <>
      <button onClick={click} className={className ?? "h-9 px-4 rounded-full bg-primary text-white text-[12px] font-semibold hover:bg-primary-dark active:scale-95 transition whitespace-nowrap"}>
        ⤓ Installer
      </button>
      <Modal open={help} onClose={() => setHelp(false)} title="Installer l'application">
        {ios ? (
          <ol className="text-[14px] space-y-3 list-decimal pl-5">
            <li>
              Ouvrez ce site dans <b>Safari</b>.
            </li>
            <li>
              Touchez le bouton <b>Partager</b> (carré avec une flèche vers le haut).
            </li>
            <li>
              Choisissez <b>« Sur l&apos;écran d&apos;accueil »</b>, puis <b>Ajouter</b>.
            </li>
          </ol>
        ) : (
          <ol className="text-[14px] space-y-3 list-decimal pl-5">
            <li>
              Ouvrez le menu de votre navigateur (<b>⋮</b> ou <b>⋯</b>).
            </li>
            <li>
              Choisissez <b>« Installer l&apos;application »</b> ou <b>« Ajouter à l&apos;écran d&apos;accueil »</b>.
            </li>
            <li>
              Sur <b>Firefox</b> ordinateur, l&apos;installation n&apos;est pas proposée : utilisez Chrome ou Edge.
            </li>
          </ol>
        )}
      </Modal>
    </>
  );
}
