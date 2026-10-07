import { Card, PageHeader } from "@/components/ui/bits";
import { PasswordForm } from "@/components/settings/password-form";
import { getStudents, getSubjects } from "@/lib/queries";
import { USERNAME } from "@/lib/constants";

export default async function SettingsPage() {
  const [students, subjects] = await Promise.all([getStudents(), getSubjects()]);
  return (
    <div className="space-y-6 max-w-[760px]">
      <PageHeader title="Paramètres" subtitle="ESMA — 2A BTS Communication Visuelle — Groupe A — 2026-2027" />
      <Card>
        <div className="text-[13px] text-neutral-600">
          BTS2 CV-A Gestion • {students.length} étudiants • {subjects.length} matières • données stockées dans Neon (Postgres)
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-4 text-[13px]">
          <div>
            <div className="label">Année</div>2026-2027
          </div>
          <div>
            <div className="label">Classe</div>BTS2 CV-A Groupe A
          </div>
          <div>
            <div className="label">École</div>ESMA
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="font-bold mb-4">Utilisateur & mot de passe</h3>
        <div className="mb-4">
          <label className="label">Utilisateur</label>
          <div className="h-11 rounded-xl border border-black/10 px-3 bg-[#F2F2F0] flex items-center text-neutral-600 text-[14px] font-medium">
            {USERNAME} <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-black text-white">fixe</span>
          </div>
        </div>
        <PasswordForm />
      </Card>
    </div>
  );
}
