import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";

async function main() {
  const { db, students, subjects, settings } = await import("../src/db");
  const { STUDENTS, SUBJECTS } = await import("../src/db/seed-data");

  const existing = await db.select({ id: students.id }).from(students).limit(1);
  if (existing.length === 0) {
    await db.insert(students).values(STUDENTS);
    console.log(`✓ ${STUDENTS.length} étudiants insérés`);
  } else console.log("• étudiants déjà présents, ignorés");

  const existingSubjects = await db.select({ id: subjects.id }).from(subjects).limit(1);
  if (existingSubjects.length === 0) {
    await db.insert(subjects).values(SUBJECTS.map((nom, position) => ({ nom, position })));
    console.log(`✓ ${SUBJECTS.length} matières insérées`);
  } else console.log("• matières déjà présentes, ignorées");

  const pw = await db.select().from(settings);
  if (!pw.find((s) => s.key === "password_hash")) {
    const password = process.env.ADMIN_PASSWORD ?? "BTSCV2027";
    await db.insert(settings).values({ key: "password_hash", value: await bcrypt.hash(password, 10) });
    console.log("✓ mot de passe initial défini (modifiable dans Paramètres)");
  } else console.log("• mot de passe déjà défini, ignoré");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
