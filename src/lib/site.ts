/**
 * Interrupteur global du site, piloté par la variable d'environnement SITE_ENABLED.
 * - absente, "true", "1", "on"  → site fonctionnel
 * - "false", "0", "off", "no"   → site coupé (aucune connexion, aucune page, aucune API)
 */
export function isSiteEnabled() {
  const v = process.env.SITE_ENABLED?.trim().toLowerCase();
  return !(v === "false" || v === "0" || v === "off" || v === "no");
}
