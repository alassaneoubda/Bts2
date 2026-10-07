# BTS2 CV-A Gestion

Application de gestion de classe (ESMA • 2A BTS Communication Visuelle • Groupe A • 2026-2027) :
participations bonus/malus, interrogations & devoirs, ventes de documents, étudiants, matières, exports CSV.

**Stack** : Next.js 16 (App Router, Server Actions) • Neon Postgres • Drizzle ORM • Tailwind 4 • Motion (animations).

## Démarrage local

```bash
npm install
cp .env.example .env.local     # puis renseigner DATABASE_URL (Neon) et SESSION_SECRET
npm run db:push                # crée les tables dans Neon
npm run db:seed                # 50 étudiants, 10 matières, mot de passe initial (ADMIN_PASSWORD)
npm run dev
```

Connexion : utilisateur fixe `ESMA BTS2`, mot de passe = `ADMIN_PASSWORD` (modifiable dans Paramètres).

## Déploiement Vercel

1. Pousser le dépôt sur GitHub, puis **Vercel → Add New Project** (ou `npx vercel`).
2. Variables d'environnement : `DATABASE_URL`, `SESSION_SECRET` (`openssl rand -base64 32`).
   Avec l'intégration **Vercel Storage → Neon**, `DATABASE_URL` est injectée automatiquement.
3. Initialiser la base une fois depuis votre poste (`npm run db:push && npm run db:seed` avec la même `DATABASE_URL`).

## Données

Plus rien n'est codé en dur : étudiants, matières, notes, points, ventes et le hash du mot de passe sont en base.
`src/db/seed-data.ts` ne sert qu'à l'import initial.
