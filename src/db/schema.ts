import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["actif", "inactif"]);
export const participationType = pgEnum("participation_type", ["bonus", "malus"]);
export const evalType = pgEnum("eval_type", ["INTERROGATION", "DEVOIR"]);
export const gradeStatus = pgEnum("grade_status", ["PRESENT", "ABSENT"]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  numero: integer("numero").notNull().unique(),
  nom: text("nom").notNull(),
  prenoms: text("prenoms").notNull(),
  statut: statusEnum("statut").notNull().default("actif"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom").notNull(),
  position: integer("position").notNull().default(0),
  statut: statusEnum("statut").notNull().default("actif"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const participations = pgTable(
  "participations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
    type: participationType("type").notNull(),
    valeur: integer("valeur").notNull(), // toujours positif, le signe vient de `type`
    date: date("date").notNull(),
    motif: text("motif").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("participations_student_idx").on(t.studentId)],
);

export const evaluations = pgTable("evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  type: evalType("type").notNull(),
  bareme: integer("bareme").notNull(), // 10 pour INTERROGATION, 20 pour DEVOIR
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const grades = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evaluationId: uuid("evaluation_id").notNull().references(() => evaluations.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    note: real("note"),
    statut: gradeStatus("statut").notNull().default("PRESENT"),
  },
  (t) => [unique("grades_eval_student_uq").on(t.evaluationId, t.studentId), index("grades_student_idx").on(t.studentId)],
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  prix: integer("prix").notNull(),
  description: text("description").notNull().default(""),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    montant: integer("montant").notNull(),
    date: date("date").notNull(),
    commentaire: text("commentaire").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("payments_doc_idx").on(t.documentId)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Student = typeof students.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Participation = typeof participations.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Payment = typeof payments.$inferSelect;
