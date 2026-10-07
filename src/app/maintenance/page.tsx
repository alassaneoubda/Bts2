import Image from "next/image";

export const metadata = { title: "Service indisponible • BTS2 CV-A Gestion", robots: { index: false } };

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#FFF6EE] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 border border-black/5 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-black">
            <Image src="/logo-bts2.jpeg" alt="BTS2 CV-A" width={72} height={72} className="w-full h-full object-contain" />
          </div>
          <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-primary">
            <Image src="/logo-esma.jpeg" alt="ESMA" width={72} height={72} className="w-full h-full object-contain p-1" />
          </div>
        </div>
        <h1 className="text-[22px] font-extrabold tracking-tight">Service indisponible</h1>
        <p className="text-[13px] text-neutral-500 mt-2">BTS2 CV-A Gestion est temporairement désactivé. Revenez plus tard.</p>
      </div>
    </div>
  );
}
