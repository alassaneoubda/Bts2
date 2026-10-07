export const today = () => new Date().toISOString().slice(0, 10);

export const fmtMoney = (n: number) => `${n.toLocaleString("fr-FR")} F`;

export const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

export const firstName = (prenoms: string) => prenoms.split(" ")[0] ?? prenoms;

export const fmtNum = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined ? "—" : n.toFixed(digits);

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export type PayStatus = "PAYÉ" | "AVANCE" | "NON PAYÉ";
export const payStatus = (paid: number, prix: number): PayStatus =>
  paid >= prix ? "PAYÉ" : paid > 0 ? "AVANCE" : "NON PAYÉ";
