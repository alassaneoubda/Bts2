export type EvalKind = "INTERROGATION" | "DEVOIR";

export type GradeEntry = {
  type: EvalKind;
  note: number | null;
  statut: "PRESENT" | "ABSENT";
};

export type SubjectAverages = {
  moyInterro: number | null; // /10
  moyInterro20: number | null; // interro ramenée sur 20
  moyDevoir: number | null; // /20
  moyMatiere: number | null; // /20
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * Règle de l'application d'origine :
 * moyenne matière = (moy. interros ×2 + moy. devoirs) / 2 ; si un seul type existe, il compte seul.
 * Les absents et notes vides sont ignorés.
 */
export function subjectAverages(entries: GradeEntry[]): SubjectAverages {
  const valid = entries.filter((e) => e.statut === "PRESENT" && e.note !== null);
  const moyInterro = avg(valid.filter((e) => e.type === "INTERROGATION").map((e) => e.note as number));
  const moyDevoir = avg(valid.filter((e) => e.type === "DEVOIR").map((e) => e.note as number));
  const moyInterro20 = moyInterro !== null ? moyInterro * 2 : null;
  let moyMatiere: number | null = null;
  if (moyInterro20 !== null && moyDevoir !== null) moyMatiere = (moyInterro20 + moyDevoir) / 2;
  else moyMatiere = moyInterro20 ?? moyDevoir;
  return { moyInterro, moyInterro20, moyDevoir, moyMatiere };
}

export const baremeFor = (type: EvalKind) => (type === "INTERROGATION" ? 10 : 20);
