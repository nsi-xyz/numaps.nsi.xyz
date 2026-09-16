# Contribuer — règles de collaboration

> **Ce document s'applique à tout le monde : humains et agents IA.**
> Objectif : permettre à **plusieurs intervenants de travailler en parallèle** sur ce dépôt
> sans se marcher dessus, et **sans jamais bloquer** le travail des autres.

---

## 1. Le principe : diverger le moins longtemps possible

Un conflit n'est pas un accident : c'est le produit du **temps de divergence** et du **nombre
de fichiers partagés**. On agit donc sur les deux :

- **branches courtes** — une tâche = une branche = une pull request ;
- **fichiers partagés** — un seul rédacteur à la fois.

---

## 2. Workflow

```bash
git switch main && git pull
git switch -c feat/ma-tache          # feat/… fix/… docs/… chore/…
# … travail …
git fetch origin && git rebase origin/main   # AVANT de proposer
git push -u origin feat/ma-tache
```

1. **Une branche par tâche.** Jamais de travail direct sur `main`.
2. **PR courte et fréquente.** Une PR qui vit trois jours est un conflit garanti.
3. **Rebase, pas de merge commit** : `git rebase origin/main` avant de proposer.
   L'historique reste linéaire et un conflit se résout **une fois**, pas à chaque merge.
4. **Un commit = une intention.** Messages conventionnels : `feat(scope): …`, `fix(scope): …`,
   `docs(scope): …`, `chore(scope): …`.
5. ℹ️ **Le déploiement est manuel** : pousser sur `main` ne met **rien** en ligne. Le
   propriétaire déclenche le déploiement depuis l'onglet *Actions* quand il le décide. La
   branche et la pull request servent donc à **limiter les conflits**, pas à protéger la
   production — mais elles restent la bonne pratique.

---

## 3. Les fichiers « chauds » — un seul rédacteur à la fois

Ces fichiers sont modifiés par tout le monde et concentrent presque tous les conflits :

| Fichier | Pourquoi il est conflictuel |
|---|---|
| `package.json` | Tout ajout de dépendance y touche |
| **`package-lock.json`** | Régénéré en entier à chaque `npm install` — **conflit systématique** |
| `wrangler.json` | Bindings, routes, configuration Cloudflare |
| config du framework | `astro.config.*`, `vite.config.*`, `tsconfig.json` |
| `README.md`, `BRIEF.md` | Documentation transverse |
| types et contrats partagés | Modifiés par toutes les couches |

**Règle : avant de modifier un fichier de cette liste, vérifier qu'aucune autre branche ouverte
n'y travaille déjà.** En cas de doute, attendre ou se coordonner.

---

## 4. Les trois règles qui évitent 90 % des conflits

### 4.1 `package-lock.json` ne se fusionne **jamais** à la main

En cas de conflit sur ce fichier :

```bash
git checkout --theirs package-lock.json   # ou --ours, peu importe
npm install                               # régénère un lockfile cohérent
git add package-lock.json
```

Ne jamais tenter de résoudre les marqueurs `<<<<<<<` dans un lockfile.

### 4.2 Ne pas reformater ce qu'on ne modifie pas

Pas de formatage global, pas de réordonnancement d'imports, pas de renommage cosmétique sur un
fichier qu'on ne change pas fonctionnellement. **C'est la première cause de conflits
artificiels** — et ils sont les plus pénibles, parce qu'ils ne portent sur rien.

### 4.3 Geler les interfaces avant de paralléliser

Avant de lancer deux chantiers en parallèle, **figer les contrats** : types partagés, forme des
données, signatures d'API. Ensuite chacun code contre le contrat sans se coordination
davantage. Un contrat qui change en cours de route coûte plus cher que le conflit qu'il évite.

---

## 5. Résoudre un conflit

1. **Le second à merger résout.** Il prévient l'autre de ce qu'il a décidé.
2. **Ne jamais résoudre un conflit en supprimant le travail d'autrui** pour faire disparaître
   les marqueurs. En cas de doute sur l'intention, demander.
3. `git rebase --continue` après résolution. Si tout part de travers : `git rebase --abort` et
   recommencer — c'est gratuit.
4. Après résolution d'un conflit : **relancer le build et les tests** avant de proposer.
   Un conflit mal résolu compile parfois… tout en cassant le comportement.

---

## 6. Répartition recommandée

Pour limiter les collisions, attribuer des **territoires disjoints** plutôt que des tâches
transverses :

| Territoire | Contenu |
|---|---|
| Interface | vues, composants, styles, charte Material |
| Métier | logique pure : nommage, conflits, validation, tags |
| Données | schéma D1, accès base, migrations |
| Matériel | WebUSB, simulateur, intégration des bibliothèques |
| Documentation | `README.md`, `BRIEF.md`, `docs/` |

Un intervenant peut changer de territoire, mais **pas sans prévenir** : c'est le signal qui
permet aux autres de savoir quels fichiers « chauds » sont occupés.

---

## 7. Avant de proposer une pull request

- [ ] La branche est **rebasée** sur `main`.
- [ ] Le **build passe** sans erreur.
- [ ] Les **tests** passent (au minimum ceux du cœur métier).
- [ ] Aucun **secret** ajouté (le dépôt est **public**, la *push protection* est active).
- [ ] Aucun **reformatage gratuit** de fichiers non concernés.
- [ ] Les **dépendances ajoutées** sont notées dans `THIRD-PARTY-NOTICES.md`.
- [ ] La description de la PR dit **ce qui change et pourquoi** — pas seulement comment.
