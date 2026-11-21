<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pépite

Application web (PWA installable) de tontine entre proches, pour le Togo : montants en francs CFA, heure de Lomé.

## Structure

- `src/app/(public)/` : site public (présentation, connexion, règlement du jeu, conditions, confidentialité).
- `src/app/app/` : espace membre (`/app`), écrans clients qui appellent l'API avec React Query.
- `src/app/admin/` : administration (`/admin`), pages serveur réservées aux comptes `is_admin`.
- `src/app/api/**/route.ts` : API. Toute écriture passe par une fonction SQL (`db/migrations`).
- `src/server/` : code serveur uniquement (`import 'server-only'`), seul à lire `DATABASE_URL`.

## Commandes

```bash
npm run dev          # serveur de développement
npm run build        # build de production
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run db:migrate   # applique les migrations SQL sur Neon (.env.local)
npm run admin:grant  # donne les droits admin à un compte
npm run test:e2e     # test de bout en bout de l'API (serveur lancé sur le port 3000)
```

Lancer lint, typecheck et build avant de considérer une tâche terminée.
