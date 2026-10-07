"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/actions/auth";
import { btnPrimary } from "@/components/ui/bits";
import { useToast } from "@/components/ui/toast";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const toast = useToast();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast("success", state.success);
      form.current?.reset();
    } else if (state?.error) toast("error", state.error);
  }, [state, toast]);

  return (
    <form ref={form} action={action} className="space-y-3">
      {[
        ["old", "Ancien mot de passe"],
        ["new1", "Nouveau mot de passe"],
        ["new2", "Confirmer nouveau"],
      ].map(([name, label]) => (
        <div key={name}>
          <label className="label">{label}</label>
          <input name={name} type="password" required className="field" autoComplete={name === "old" ? "current-password" : "new-password"} />
        </div>
      ))}
      <button disabled={pending} className={`${btnPrimary} !h-11 !rounded-xl`}>
        Sauvegarder nouveau mot de passe
      </button>
    </form>
  );
}
