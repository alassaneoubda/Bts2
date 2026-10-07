import Image from "next/image";
import { RetryButton } from "./retry";

export const metadata = { title: "Hors ligne • BTS2 CV-A Gestion", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FFF6EE] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 border border-black/5 text-center">
        <div className="w-[88px] h-[88px] rounded-2xl overflow-hidden mx-auto mb-6 border border-black/5">
          <Image src="/logo-bts2.jpeg" alt="BTS2 CV-A" width={88} height={88} className="w-full h-full object-contain" />
        </div>
        <h1 className="text-[22px] font-extrabold tracking-tight">Vous êtes hors ligne</h1>
        <p className="text-[13px] text-neutral-500 mt-2">Les données sont stockées en ligne : une connexion internet est nécessaire pour les consulter ou les modifier.</p>
        <RetryButton />
      </div>
    </div>
  );
}
