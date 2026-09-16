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
| 7 | **Toute dépendance non permissive doit être signalée et attribuée** — jamais intégrée en silence. | La licence du projet dépend de celle de ses dépendances. Voir `docs/architecture/logiciel-libre.md` §2.4. |

---

## 3. Stack : libre, mais compatible Cloudflare

**Le choix technique t'appartient.** Framework, bibliothèque de composants, gestion d'état,
outillage : décide, et justifie brièvement. Une seule contrainte : l'application doit rester
**déployable sur Cloudflare** (Workers ou Pages), qui est l'hébergement cible du projet.

### Ce qui existe déjà

Le dépôt contient un squelette **Astro 5 + Hono + Tailwind + D1**, déjà déployé et fonctionnel :

| Élément | Rôle |
|---|---|
| `wrangler.json` | Worker `numaps-nsi-xyz`, domaine `numaps.nsi.xyz`, bindings **D1 `DB`** et **KV `SESSION`** déjà provisionnés |
| `src/server/app.ts` | API Hono, avec `/api/health` fonctionnel |
| `src/pages/api/[...path].ts` | Pont Astro → Hono |
| `.github/workflows/deploy.yml` | CI : build → migrations D1 → `wrangler deploy` → sonde post-déploiement |
| `schema.sql` | Schéma D1, à étendre |

**Tu peux t'en servir comme point de départ, l'adapter, ou le remplacer.** Mais deux choses
doivent rester vraies :

1. **Le déploiement Cloudflare doit continuer à fonctionner.** Si tu changes de framework,
   adapte `wrangler.json` et le workflow pour que `main` reste déployable.
2. **La base reste Cloudflare D1** (elle est provisionnée) — sauf raison forte et argumentée.

```bash
npm install
npm run dev          # selon la stack retenue
npm run build        # doit passer sans erreur
npm run d1:init      # applique schema.sql sur la D1 LOCALE
```

> ⚠️ **Un push sur `main` déploie automatiquement en production** (`numaps.nsi.xyz`).
> Travaille sur une branche et ouvre une pull request, sauf indication contraire.

> ℹ️ `src/styles/global.css` contient pour l'instant `box-shadow: none !important` (charte
> « flat » héritée d'un autre projet). **Retire-le** : ce projet suit Material Design (§6).

### Principe d'architecture (indépendant de la stack)

Quelle que soit la technologie retenue, sépare :

```
logique métier PURE   nommage, conflits, validation, tags — zéro effet de bord, testable en mémoire
accès I/O             base de données, WebUSB, fichiers
API / contrôleurs     mince
interface             vues et composants
```

La logique métier — nommage Epsilon, résolution de conflits, validation — doit être **testable
sans navigateur ni base de données**. C'est le seul point d'architecture qui compte vraiment ici.

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

### 5.1 Réutilise le simulateur — ne le réécris pas

Les simulateurs web des projets **Omega** et **Upsilon** sont **open source et utilisables**.
Récupère, intègre et adapte ce code : réécrire un interpréteur Python en JavaScript serait un
travail considérable et inutile.

- Les deux projets dérivent d'**Epsilon** : vérifie à quelle version de firmware correspond le
  simulateur que tu intègres.
- Intègre-le comme un **composant isolé** (module, *web component*, iframe) afin de pouvoir le
  mettre à jour indépendamment du reste de l'application.
- L'harmonisation graphique du simulateur avec Material Design viendra **plus tard** : ce n'est
  pas l'urgence technique.

### 5.2 Ne réinvente pas WebUSB

Le matériel : microcontrôleur **STM32**, `VID 0x0483`, `PID 0xa291`, endpoints Bulk In/Out.
Le protocole se déroule en trois phases : **handshake** (version d'OS), **encapsulation** des
scripts en paquets de taille fixe, puis **écriture mémoire**.

Bibliothèques de référence de la communauté : **`numworks.js`** (détection, handshake, envoi)
et **`upsilon.js`** (fork gérant le nouvel adressage et les applications `.nwa`).

Interfaces existantes à étudier : le *Workshop* officiel NumWorks (fermé, référence de
comportement), **Upsilon-Workshop** (yaya-cout), l'interface **KhiCAS** de Bernard Parisse
(archives `.nws`), **WebDFU NumWorks** (Devan Lai / TI-Planet), **PyNumStore**.

### 5.3 Traçabilité des composants réutilisés

Réutiliser du code existant est **encouragé**. Garde simplement une trace : pour chaque
composant tiers intégré (simulateur, bibliothèque WebUSB, composant d'interface), note dans un
fichier `THIRD-PARTY-NOTICES.md` le **projet d'origine, l'URL, la version ou le commit, et la
licence**. C'est une bonne pratique — et une obligation de nombreuses licences.

### 5.4 Contraintes système à connaître

- **Linux** : règles `udev` dans `/etc/udev/rules.d/` pour l'accès USB non-root.
- **Windows** : pilote générique **WinUSB**, sinon Zadig.
- Le *Workshop* officiel **rejette les firmwares alternatifs** (Upsilon, Omega) — un outil
  communautaire doit fonctionner dans les deux cas.

---

## 6. Charte visuelle — Material Design

**Référence : Material Design 3.** C'est la charte de **ce** projet — et non la charte « flat »
héritée d'un autre site de l'écosystème.

| Élément | Attendu |
|---|---|
| Système | **Material Design 3** : rôles de couleur, élévation, états, formes, typographie |
| Couleur de marque | **Violet `#9A29D2`** — à utiliser comme *seed color* ou couleur primaire |
| Icônes | **Material Symbols** |
| Composants | Privilégie les composants Material standards : boutons, cartes, barres, menus, *snackbars*, dialogues |
| Élévation et ombres | **Autorisées** — contrairement à la charte flat d'un autre projet |
| Notifications | **Aucun `alert()`, `confirm()` ni `prompt()` natif** : *snackbars* et dialogues Material |
| Thème sombre | À prévoir si le coût est faible, sinon hors périmètre |
| Accessibilité | Navigation clavier, contrastes conformes, libellés explicites, cibles tactiles suffisantes |
| Langue | Français |

Tu choisis librement ta bibliothèque de composants et ta manière d'implémenter Material —
l'important est que le résultat **se lise comme du Material Design**, pas comme un thème
approximatif.

---

## 7. Ce qu'il ne faut PAS faire

| ❌ | Raison |
|---|---|
| Implémenter la fédération, l'annuaire, les niveaux de consentement | Hors périmètre de la maquette |
| Créer une inscription, des comptes multiples, des rôles | Contredit le modèle mono-utilisateur |
| Collecter, transmettre ou journaliser des identifiants NumWorks | Risque majeur, interdit par conception |
| Héberger ou afficher le contenu d'un tiers | Fait basculer l'instance en hébergeur |
| Écrire un secret dans le code ou `wrangler.json` | Le dépôt est public |
| Intégrer une dépendance sans noter sa licence ni son attribution | Traçabilité et respect des licences |
| Recoder un émulateur ou la couche WebUSB depuis zéro | Travail déjà fait par la communauté |
| Faire une requête D1 pour un visiteur non authentifié | Contrainte de coût |

---

## 8. Définition de « terminé » pour cette maquette

- [ ] L'application **démarre en local** par la commande documentée dans le README, et est utilisable.
- [ ] La D1 **locale** est initialisée par `schema.sql` et le CRUD fonctionne.
- [ ] Le nommage Epsilon est validé **côté cœur métier**, avec tests.
- [ ] La résolution de conflits propose les trois choix, sans écrasement silencieux.
- [ ] Les filtres par tags sont reflétés dans l'URL et survivent au rechargement.
- [ ] Le **build passe sans erreur** et le déploiement Cloudflare reste fonctionnel.
- [ ] Aucun secret, aucun identifiant NumWorks, aucune donnée de tiers dans le code.
- [ ] Une note courte indique ce qui est fonctionnel, ce qui est simulé, ce qui reste à faire.

---

## 9. Ta liberté

Tout ce qui n'est pas listé en §2 et §7 est **ton choix** :

- **la stack technique** : framework, bibliothèque de composants, gestion d'état, outillage —
  à condition de rester **déployable sur Cloudflare** (§3) ;
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
