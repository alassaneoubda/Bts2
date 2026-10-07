import { sql } from "drizzle-orm";
import { db, evaluations, participations, students } from "@/db";
import { Shell } from "@/components/shell/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [[p], [e], [s]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(participations),
    db.select({ n: sql<number>`count(*)::int` }).from(evaluations),
    db.select({ n: sql<number>`count(*)::int` }).from(students),
  ]);
  return <Shell counts={{ participations: p.n, evaluations: e.n, students: s.n }}>{children}</Shell>;
}
