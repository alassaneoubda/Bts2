"use client";

export function RetryButton() {
  return (
    <button onClick={() => location.reload()} className="mt-6 h-11 px-6 rounded-xl bg-primary text-white font-semibold text-[14px] hover:bg-primary-dark active:scale-95 transition">
      Réessayer
    </button>
  );
}
