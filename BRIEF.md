# BRIEF — Maquette fonctionnelle locale

> **Destinataire :** agent IA de développement.
> **Objectif :** produire une **première maquette fonctionnelle en local** d'un gestionnaire de
> scripts NumWorks. On veut valider la **logique métier** et l'**expérience utilisateur**, pas
> mettre en production.
> **Dépôt :** `https://github.com/nsi-xyz/numaps.nsi.xyz` — déjà initialisé, déjà déployé.
> **Langue du projet :** français (code, UI, commentaires, commits).

---

## 1. Contexte en dix lignes

`numaps` est un **logiciel libre** et **auto-hébergé** de gestion de scripts Python pour la
calculatrice **NumWorks**. Chaque personne héberge **sa propre instance** pour gérer **ses
propres scripts**.

Conséquence structurante : **une instance n'héberge que le contenu de son unique
propriétaire**. Il n'y a donc ni inscription publique, ni comptes multiples, ni rôles, ni
modération, ni contenu de tiers.

La fédération entre instances (annuaire, partage) est **conçue mais hors périmètre** de cette
maquette : ne l'implémente pas.

---

## 2. Contraintes non négociables

Ces règles ne sont pas des préférences. Les enfreindre invalide le travail.

| # | Contrainte | Pourquoi |
|---|---|---|
| 1 | **Mono-utilisateur.** Aucune inscription, aucun multi-comptes, aucun rôle. | C'est le cœur du modèle : pas de contenu de tiers, donc pas de risque ni de complexité. |
| 2 | **Les visiteurs reçoivent du statique.** Aucune requête D1 ne doit être déclenchée par un visiteur non authentifié. | Contrainte de coût et de résistance aux attaques. Voir `docs/architecture/cache-et-statique.md`. |
| 3 | **Règles de nommage Epsilon, dès la frappe.** Pas d'espace, seul `_` toléré, longueur limitée, `.py` masqué dans l'interface mais géré par la logique métier. | C'est la cause n°1 de perte de données sur les outils existants. |
| 4 | **Jamais d'écrasement silencieux.** Tout conflit de nom interrompt le flux. | Idem. |
| 5 | **Aucun identifiant NumWorks collecté, stocké ou journalisé.** | Sécurité et responsabilité. |
| 6 | **Aucun secret dans le code ni dans `wrangler.json`.** | Le dépôt est **public**. |
| 7 | **Dépendances sous licence permissive uniquement** (MIT, ISC, Apache-2.0, BSD, CC0). | La licence du projet dépend de celle de ses dépendances. Voir `docs/architecture/logiciel-libre.md` §2.4. |

---

## 3. Stack et état du dépôt

La stack est **imposée** pour rester cohérente avec l'écosystème `*.nsi.xyz` :

| Couche | Technologie |
|---|---|
| Rendu | **Astro 5** en `output: 'server'` |
| Adaptateur | `@astrojs/cloudflare` |
| API | **Hono**, monté sous `/api/*` |
| Styles | **Tailwind CSS 3** |
| Base | **Cloudflare D1** — binding `DB` |
| Sessions | **Cloudflare KV** — binding `SESSION` |
| CI/CD | GitHub Actions → `wrangler deploy` |

**Le squelette existe déjà — ne le recrée pas, complète-le :**

- `wrangler.json` — bindings, domaine personnalisé, D1 et KV déjà provisionnés
- `src/server/app.ts` — application Hono, avec `/api/health` fonctionnel
- `src/pages/api/[...path].ts` — pont Astro → Hono
- `src/layouts/BaseLayout.astro`, `src/pages/index.astro` — coquille minimale
- `schema.sql` — schéma D1 à étendre
- `src/styles/global.css`, `tailwind.config.mjs` — Tailwind et charte

```bash
npm install
npm run dev          # http://localhost:4321
npm run d1:init      # applique schema.sql sur la D1 LOCALE
npm run build        # doit passer sans erreur
```

> ⚠️ **`npm run d1:init` ne s'applique qu'en local.** N'utilise `--remote` que si
> explicitement demandé.

> ⚠️ **Un push sur `main` déploie automatiquement en production** (`numaps.nsi.xyz`).
> Travaille sur une branche et ouvre une pull request, sauf indication contraire.

### Architecture en couches attendue

```
src/core/      logique métier PURE — zéro effet de bord, testable en mémoire
src/services/  accès I/O — D1, WebUSB, fichiers
src/server/    API Hono — contrôleurs minces
src/pages/     vues Astro SSR
src/components/ composants d'interface
```

C'est la convention de l'écosystème : la logique métier (nommage, conflits, validation) doit
vivre dans `src/core/` et être **testable sans navigateur ni base**.

---

## 4. Périmètre — par ordre de priorité

### Cœur (à rendre fonctionnel en premier)

1. **CRUD des scripts** en D1 : créer, éditer, renommer, dupliquer, supprimer.
2. **Tags multiples** par script, sans arborescence de dossiers.
3. **Recherche instantanée** sur le nom **et** le contenu.
4. **Filtres reflétés dans l'URL** (`/?tags=maths,jeux`) — favoris, partage, état conservé.
5. **Grille de cartes**, actions accessibles depuis la carte (éditer, envoyer, supprimer),
   sans navigation profonde ni modale inutile.

### Ensuite

6. **Éditeur Python intégré** : coloration syntaxique, numérotation des lignes.
7. **Simulateur** : écran **320 × 222**, modules `kandinsky` et `ion`, console pour `print`
   et tracebacks.
8. **WebUSB** : détection du périphérique (branché / débranché), envoi, extraction, glisser-déposer.
9. **Sauvegarde « un clic »** : lecture de la mémoire de la calculatrice → archive locale.

### Résolution de conflits (transversale, dès le cœur)

Trois choix explicites, jamais d'écrasement silencieux : **écraser**, **renommer
automatiquement** (suffixe intelligent, ex. `monscript_v2`), **ignorer**.

---

## 5. Directives techniques fortes

### 5.1 Ne réinvente pas le simulateur

Il existe des simulateurs web **open source** issus des projets alternatifs **Omega** et
**Upsilon**. Récupère, intègre et adapte ce code plutôt que d'écrire un émulateur Python en
JavaScript. Harmoniser ensuite la charte graphique du simulateur — **ce n'est pas l'urgence**.

### 5.2 Ne réinvente pas WebUSB

Le matériel : microcontrôleur **STM32**, `VID 0x0483`, `PID 0xa291`, endpoints Bulk In/Out.
Le protocole se déroule en trois phases : **handshake** (version d'OS), **encapsulation** des
scripts en paquets de taille fixe, puis **écriture mémoire**.

Bibliothèques de référence de la communauté : **`numworks.js`** (détection, handshake, envoi)
et **`upsilon.js`** (fork gérant le nouvel adressage et les applications `.nwa`).

Interfaces existantes à étudier : le *Workshop* officiel NumWorks (fermé, référence de
comportement), **Upsilon-Workshop** (yaya-cout), l'interface **KhiCAS** de Bernard Parisse
(archives `.nws`), **WebDFU NumWorks** (Devan Lai / TI-Planet), **PyNumStore**.

### 5.3 ⚠️ Vérifie les licences avant de copier du code

Les simulateurs Omega/Upsilon descendent d'**Epsilon**, dont le dépôt public **ne déclare
aucune licence standard**. Ne copie pas de code dont la licence est indéterminée sans le
signaler. En cas de doute : **documente-le et demande**, ne tranche pas seul.

### 5.4 Contraintes système à connaître

- **Linux** : règles `udev` dans `/etc/udev/rules.d/` pour l'accès USB non-root.
- **Windows** : pilote générique **WinUSB**, sinon Zadig.
- Le *Workshop* officiel **rejette les firmwares alternatifs** (Upsilon, Omega) — un outil
  communautaire doit fonctionner dans les deux cas.

---

## 6. Charte visuelle — l'essentiel

- **Flat design strict** : aucune ombre portée (`box-shadow: none`).
- **Violet institutionnel** `#9A29D2` comme couleur d'accent.
- Sémantique : vert `#208F46`, ambre `#B88514`, rouge `#CF3327`.
- **Material Symbols** pour toutes les icônes fonctionnelles.
- **Boutons d'action icône** : format compact uniforme (36 × 36 px), icône centrée.
- **Typographie** : Inter (texte), JetBrains Mono (code).
- **Aucun `alert()`, `confirm()` ni `prompt()` natif** : prévoir un système de notifications
  (toasts non bloquants) et une confirmation asynchrone.
- En-tête sobre avec le nom du site en haut à gauche, pas de flèche retour.
- **Accessibilité** : navigation clavier, contrastes suffisants, libellés explicites.

L'échelle typographique Tailwind de l'écosystème est volontairement plus grande que celle par
défaut (`xs` = 14 px, `sm` = 16 px, `base` = 18 px). À reprendre pour l'homogénéité — ou à
justifier autrement si tu fais un autre choix.

---

## 7. Ce qu'il ne faut PAS faire

| ❌ | Raison |
|---|---|
| Implémenter la fédération, l'annuaire, les niveaux de consentement | Hors périmètre de la maquette |
| Créer une inscription, des comptes multiples, des rôles | Contredit le modèle mono-utilisateur |
| Collecter, transmettre ou journaliser des identifiants NumWorks | Risque majeur, interdit par conception |
| Héberger ou afficher le contenu d'un tiers | Fait basculer l'instance en hébergeur |
| Écrire un secret dans le code ou `wrangler.json` | Le dépôt est public |
| Ajouter une dépendance copyleft forte ou non commerciale | Ferme le choix de licence du projet |
| Recoder un émulateur ou la couche WebUSB depuis zéro | Travail déjà fait par la communauté |
| Faire une requête D1 pour un visiteur non authentifié | Contrainte de coût |

---

## 8. Définition de « terminé » pour cette maquette

- [ ] `npm run dev` démarre, l'application est utilisable en local.
- [ ] La D1 **locale** est initialisée par `schema.sql` et le CRUD fonctionne.
- [ ] Le nommage Epsilon est validé **côté cœur métier**, avec tests.
- [ ] La résolution de conflits propose les trois choix, sans écrasement silencieux.
- [ ] Les filtres par tags sont reflétés dans l'URL et survivent au rechargement.
- [ ] `npm run build` passe sans erreur.
- [ ] Aucun secret, aucun identifiant NumWorks, aucune donnée de tiers dans le code.
- [ ] Une note courte indique ce qui est fonctionnel, ce qui est simulé, ce qui reste à faire.

---

## 9. Ta liberté

Tout ce qui n'est pas listé en §2 et §7 est **ton choix** :

- la mise en page exacte, les composants, les transitions, le ton des libellés ;
- le choix de l'éditeur (CodeMirror, Monaco, ou autre) ;
- la stratégie de simulation et le degré de fidélité atteint dans cette première étape ;
- le schéma D1 précis ;
- le découpage des routes et des modules ;
- l'ordre dans lequel tu attaques la §4, à condition de livrer le **cœur** d'abord.

**Prends des décisions, explique-les brièvement, et avance.** Si un choix structurel te semble
devoir être tranché par un humain, pose la question au lieu de supposer.

---

## 10. Pour aller plus loin (lecture optionnelle)

| Document | Ce que tu y trouveras |
|---|---|
| `README.md` | Vue d'ensemble du projet et ressources Cloudflare |
| `docs/architecture/cache-et-statique.md` | Pourquoi et comment tenir « zéro Worker, zéro D1 » en lecture |
| `docs/architecture/federation.md` | Le modèle de réseau (hors périmètre) — §6 explique les risques évités par le mono-utilisateur |
| `docs/architecture/logiciel-libre.md` | Licence, gouvernance, distribution, **politique de dépendances** (§2.4) |
