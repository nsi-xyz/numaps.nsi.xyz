# numaps — Gestionnaire de scripts NumWorks, en logiciel libre

Logiciel **libre** et **auto-hébergé** de gestion de scripts Python pour la calculatrice
**NumWorks**. Chaque personne héberge **sa propre instance** pour gérer **ses propres scripts**.

> **Hébergement :** Cloudflare Workers (SSR) + Cloudflare D1 (SQLite distribué) + KV
> **Dépôt GitHub :** `https://github.com/nsi-xyz/numaps.nsi.xyz` (public)
> **Instance de référence :** `https://numaps.nsi.xyz` — elle héberge l'annuaire public
> **Déploiement :** **manuel**, déclenché depuis l'onglet *Actions* (`workflow_dispatch`).
> Un push sur `main` ne met **rien** en ligne.

---

> 🤖 **Brief de développement (agents IA) :** [`BRIEF.md`](BRIEF.md) — périmètre de la première
> maquette fonctionnelle locale, contraintes non négociables, directives techniques, charte
> visuelle et marges de liberté. **À lire avant toute ligne de code.**
>
> 🤝 **Travail à plusieurs (humains ou IA) :** [`CONTRIBUTING.md`](CONTRIBUTING.md) — branches
> courtes, rebase, fichiers « chauds », gestion des conflits.

---

## 🎯 Modèle du projet

| Principe | Décision |
|---|---|
| **Utilisateurs par instance** | **Un seul** — le propriétaire du compte Cloudflare |
| **Contenu hébergé** | **Uniquement celui du propriétaire.** Aucun contenu de tiers. |
| **Nature** | **Logiciel libre**, auto-hébergé, forkable |
| **Réseau** | Annuaire d'instances + **liens optionnels et consentis** entre instances |
| **Visiteurs** | **100 % statique** — ni Worker, ni D1 en lecture |
| **Statut** | 🚧 **Conception. Aucun développement en cours.** |

Ce choix dissout l'essentiel du risque juridique : une instance mono-utilisateur n'héberge
pas de contenu de tiers, son propriétaire est l'éditeur de son propre contenu.

⚠️ **Exception à connaître :** dès qu'une instance **copie** le contenu d'une autre, elle
redevient hébergeur de contenu de tiers. Voir `federation.md`, §6.2.

---

## 🏛️ Stack technique

Stack **actuelle** du squelette, alignée sur `abc.nsi.xyz`. ⚠️ **Ce n'est qu'un point de
départ** : la stack définitive est ouverte, sous la seule contrainte de rester déployable sur
Cloudflare (voir [`BRIEF.md`](BRIEF.md) §3).

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

---

## 🚀 Déploiement et sauvegardes

### Déploiement — manuel

Le déploiement est **volontairement manuel** : pousser sur `main` ne met **rien** en ligne.
Cela permet de travailler à plusieurs (humains ou agents IA) sans risque pour la production.

> **Actions** → *Déploiement Cloudflare* → **Run workflow**

Le workflow enchaîne : build → **sauvegarde de la base** → migrations D1 → déploiement →
sonde de vérification. Une migration contenant `DROP`, `DELETE` ou `TRUNCATE` **fait échouer
le déploiement**, sauf si l'entrée `allow_destructive` est cochée explicitement.

### Sauvegarde de la base

| Mécanisme | Fréquence | Rétention |
|---|---|---|
| `Sauvegarde D1` (workflow planifié) | quotidienne, 03:17 UTC | 90 jours |
| Sauvegarde avant déploiement | à chaque déploiement | 30 jours |
| **D1 Time Travel** (Cloudflare) | continu | fenêtre limitée |

⚠️ **Le dépôt est public : les artefacts GitHub Actions sont téléchargeables par n'importe
qui.** Les sauvegardes sont donc **toujours chiffrées** (AES-256) avec le secret
`BACKUP_PASSPHRASE` avant d'être archivées.

**Restaurer :**

```bash
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in d1-backup.sql.enc -out d1-backup.sql \
  -pass env:BACKUP_PASSPHRASE

npx wrangler d1 execute numaps-nsi-xyz --remote --file=d1-backup.sql
```

> 🔑 Sans la passphrase, une sauvegarde est **définitivement illisible**. Elle est conservée
> dans `.secrets/env` (local, gitignoré) et dans les secrets GitHub : **duplique-la dans un
> gestionnaire de mots de passe.**

---

## 📚 Documentation

| Document | Contenu |
|---|---|
| [`docs/architecture/federation.md`](docs/architecture/federation.md) | Modèle fédéré : vocabulaire, topologie, **niveaux de consentement**, protocole de découverte, annuaire, risques de sécurité / juridiques / organisationnels |
| [`docs/architecture/logiciel-libre.md`](docs/architecture/logiciel-libre.md) | Licence, protocole, marque et fork, gouvernance, distribution et auto-hébergement, compatibilité, risques du libre |
| [`docs/architecture/cache-et-statique.md`](docs/architecture/cache-et-statique.md) | Architecture « zéro Worker / zéro D1 » en lecture, snapshot de données, cache navigateur, invalidation, vérification |

> 🔒 **Documents internes hors dépôt.** L'analyse juridique (LCEN, DSA, RGPD, droit d'auteur),
> l'analyse des CGU NumWorks et les notes de stratégie sont conservées localement dans
> `docs/private/`, **exclu du dépôt** (voir `.gitignore`).

**Règle :** ce dépôt contient le code, l'architecture et la documentation du projet libre.
Aucun document juridique confidentiel, aucune note de stratégie, aucun document de travail
personnel.
