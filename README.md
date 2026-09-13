# numaps.nsi.xyz — Gestionnaire de scripts NumWorks

Plateforme de gestion de scripts Python pour la calculatrice **NumWorks**.

> **Hébergement :** Cloudflare Workers (SSR) + Cloudflare D1 (SQLite distribué) + KV (sessions)
> **Dépôt GitHub :** `https://github.com/nsi-xyz/numaps.nsi.xyz` (privé)
> **Nom de domaine :** `https://numaps.nsi.xyz`
> **Déploiement :** automatique via GitHub Actions à chaque push sur `main`

---

## 🏛️ Stack technique

Stack alignée sur `abc.nsi.xyz` pour garantir la cohérence de l'écosystème `*.nsi.xyz`.

| Couche | Technologie |
|---|---|
| Rendu | Astro 5 (`output: 'server'`) |
| Adaptateur | `@astrojs/cloudflare` |
| API | Hono, monté sous `/api/*` |
| Styles | Tailwind CSS 3 (Flat Design strict, aucune ombre) |
| Base de données | Cloudflare D1 — binding `DB` |
| Sessions | Cloudflare KV — binding `SESSION` |
| CI/CD | GitHub Actions → `wrangler deploy` |

### Architecture en couches

```text
numaps.nsi.xyz/
├── .github/workflows/     # 🚀 CI/CD : build, migrations D1, déploiement, sonde
├── .secrets/              # 🔒 JETONS LOCAUX — gitignoré, jamais commité
├── schema.sql             # 🗄️ Schéma de la base D1
├── wrangler.json          # ⚙️ Configuration Worker (bindings, domaine)
├── astro.config.mjs       # ⚙️ Configuration Astro
├── src/
│   ├── server/            # 🔌 API Hono (app.ts + routes/)
│   ├── pages/             # 🖥️ Pages Astro SSR + pont API
│   ├── layouts/           # 📐 Layouts globaux
│   └── styles/            # 🎨 Tailwind + charte nsi.xyz
└── package.json
```

---

## 🚀 Commandes

```bash
npm install          # Installer les dépendances
npm run dev          # Serveur de développement (localhost:4321)
npm run build        # Compilation de production
npm run deploy       # Build + déploiement manuel sur Cloudflare

npm run d1:init         # Appliquer schema.sql en local
npm run d1:init:remote  # Appliquer schema.sql en production
```

---

## 🔐 Secrets et variables d'environnement

**Règle absolue : aucun secret dans `wrangler.json` ni dans le code.**

- En local : fichier `.dev.vars` (gitignoré), modèle dans `.dev.vars.example`.
- En production : `npx wrangler secret put NOM_DU_SECRET`.
- La CI utilise les secrets GitHub `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID`.

Le dossier `.secrets/` contient les jetons d'administration locaux ; il est exclu du dépôt.

---

## 📦 Ressources Cloudflare

| Ressource | Nom | Identifiant |
|---|---|---|
| Worker | `numaps-nsi-xyz` | — |
| D1 | `numaps-nsi-xyz` | `f8ca591f-abc5-4881-a077-e5156e22e5a3` |
| KV | `numaps-nsi-xyz-session` | `9dcddad8ffdf4946a2df577dd3dba54e` |

Le domaine `numaps.nsi.xyz` est raccordé au Worker via un **Custom Domain** déclaré dans
`wrangler.json` (`routes[].custom_domain`), donc reproductible en CI.
