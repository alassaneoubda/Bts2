import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("bg-white rounded-[20px] border border-black/5 shadow-sm p-5 lg:p-6", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-[26px] lg:text-[28px] font-extrabold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[13px] text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "red" | "orange" | "black" }) {
  const tones = {
    neutral: "bg-[#F2F2F0] text-neutral-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    orange: "bg-[#FFF3E6] text-[#b45300]",
    black: "bg-black text-white",
  };
  return <span className={cn("inline-block px-2 py-1 rounded-full text-[11px] font-bold", tones[tone])}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-neutral-400 py-4">{children}</div>;
}

export const btnPrimary =
  "h-10 px-5 rounded-full bg-primary text-white font-semibold text-[13px] shadow-[0_8px_20px_rgba(255,122,0,0.25)] hover:bg-primary-dark active:scale-95 transition disabled:opacity-50";
export const btnDark = "h-10 px-5 rounded-full bg-black text-white font-semibold text-[13px] hover:bg-neutral-800 active:scale-95 transition";
export const btnGhost = "h-10 px-5 rounded-full bg-[#F2F2F0] text-[13px] font-semibold hover:bg-[#e8e8e5] active:scale-95 transition";
