# Projet libre — licence, gouvernance, distribution

> **Version :** 1.1
> **Statut :** document de référence. **Aucune implémentation.**
> **Objet :** traiter le projet comme un **logiciel libre** et non comme un site : licence,
> gouvernance, marque, distribution, compatibilité, et risques propres au libre.

---

## 1. Conséquence fondatrice : le logiciel **est** le produit

Tant que le projet était un site, compromettre le dépôt compromettait un site.
Désormais, **compromettre le dépôt compromet toutes les instances du réseau.**

Cela hisse la sécurité de la chaîne d'approvisionnement au premier rang des préoccupations :

| Mesure | État |
|---|---|
| Dépôt public, historique auditable | ✅ en place |
| *Push protection* contre les secrets | ✅ activée |
| *Secret scanning* | ✅ activé |
| Protection de branche sur `main` | ⬜ à activer (revue obligatoire) |
| Revue par les **deux** mainteneurs avant fusion | ⬜ à instituer |
| Dépendances épinglées, `npm audit` en CI | ⬜ à ajouter |
| **Releases signées / taguées** | ⬜ à instituer |
| Procédure de divulgation responsable (`SECURITY.md`) | ⬜ à écrire |

---

## 2. Licence du logiciel

### 2.1 Options

| Licence | Type | Clause réseau | Un fork hébergé doit-il publier son code ? | Adoption |
|---|---|---|---|---|
| **AGPL-3.0** | Copyleft fort | ✅ Oui (§13) | **Oui** | Standard des logiciels fédérés |
| **EUPL-1.2** | Copyleft fort, Commission européenne | ✅ Oui (art. 5) | **Oui** | Européenne, **disponible en français** |
| GPL-3.0 | Copyleft fort | ❌ Non | Non — c'est la « faille SaaS » | Large |
| MPL-2.0 | Copyleft faible (par fichier) | ❌ Non | Non pour les fichiers inchangés | Large |
| MIT / Apache-2.0 | Permissif | ❌ Non | Non | Maximale |

### 2.2 Recommandation : **AGPL-3.0**, ou **EUPL-1.2**

Le choix se joue sur **une seule question** :

> Acceptez-vous qu'une entité prenne le logiciel, l'améliore, l'héberge et **ne partage
> jamais ses améliorations** avec le réseau ?

- Si **non** → **AGPL-3.0**. C'est le choix de Mastodon, Nextcloud, Miniflux, Plausible.
  La clause réseau garantit que **toute version modifiée offerte en service reste ouverte**.
  C'est exactement l'esprit d'un projet fédéré : le réseau ne peut pas être capturé.
- Variante **EUPL-1.2** si vous préférez un texte **européen et francophone**, avec la même
  protection (l'article 5 couvre la communication au public). C'est un choix cohérent pour un
  projet éducatif français.
- Si **oui** → MIT ou Apache-2.0. Adoption maximale, mais **aucune garantie de réciprocité**.

⚠️ **Contrepartie assumée de l'AGPL** : certains hébergeurs et entreprises l'écartent par
précaution. Pour un projet éducatif auto-hébergé, ce n'est pas un obstacle réel.

### 2.3 Point clé : **séparer la licence du code et celle du protocole**

| Élément | Licence recommandée | Raison |
|---|---|---|
| **Code** | AGPL-3.0 (ou EUPL-1.2) | Protège le réseau de la capture |
| **Spécification du protocole** | **CC0 / permissive** | Permet des **implémentations indépendantes**. Un protocole sous AGPL découragerait des clients tiers, ce qui irait contre l'objectif d'ouverture. |
| **Documentation** | CC BY-SA 4.0 | Usage pédagogique, réutilisation encouragée |
| **Contenus du site de référence** | À définir | Textes, illustrations |

> Un protocole fermé rendrait la fédération factice : il n'y aurait qu'un seul
> implémenteur. **Le protocole doit être un standard, pas un artefact du logiciel.**

---

### 2.4 ⚠️ La contrainte vient des dépendances, pas de l'intention

**Principe :** la licence du projet est **bornée** par les licences de ses dépendances. On ne
choisit pas sa licence puis ses bibliothèques : on choisit ses bibliothèques, **puis** on
découvre quelle licence est encore possible.

Conséquence pratique : **la décision de licence peut être reportée, mais la politique de
dépendances doit être fixée maintenant.** Intégrer aujourd'hui une bibliothèque sous
GPL-2.0-only fermerait définitivement la porte à l'AGPL-3.0 — et le découvrir trop tard
obligerait à tout retirer.

#### Règle de tri

| Catégorie | Licences | Effet sur le choix du projet |
|---|---|---|
| ✅ **Sûres** | MIT, ISC, BSD-2/3-Clause, Apache-2.0, CC0, Unlicense, BlueOak | **Toutes** les options restent ouvertes |
| 🟡 **Compatibles sous conditions** | LGPL-3.0, GPL-3.0, MPL-2.0 | Compatibles avec AGPL-3.0 ; imposent des obligations (source, relinkage) |
| 🔴 **Rédhibitoires** | GPL-2.0-only, SSPL, BUSL, Commons Clause, **CC BY-NC-\***, tout « non commercial », propriétaire, licence absente | **Détruisent l'option AGPL** — et une licence non commerciale **détruit le projet libre lui-même** |

**Règle par défaut : n'intégrer que la première catégorie.** Toute dépendance copyleft est
un choix conscient, inventorié et validé **avant** intégration.

#### Inventaire réel (vérifié sur l'installation courante)

Sur **426 paquets** :

| Licence | Paquets |
|---|---|
| MIT | 356 |
| ISC | 20 |
| Apache-2.0 | 15 |
| BSD-2-Clause | 10 |
| MIT OR Apache-2.0 | 7 |
| BSD-3-Clause | 4 |
| CC0-1.0 | 3 |
| Unlicense | 3 |
| BlueOak-1.0.0 | 2 |
| LGPL-3.0-or-later | 2 (famille `sharp-libvips`) |
| Python-2.0 | 1 |
| CC-BY-4.0 | 1 (`caniuse-lite` — des **données**, pas du code) |
| **non déclarée** | 1 (`zod-to-ts`) |

> ✅ **Conclusion : toutes les options de licence restent ouvertes.**

#### Trois distinctions qui changent tout

1. **Code distribué ≠ code de développement.** Seul le code **effectivement embarqué** dans
   le bundle du Worker compte pour la licence du produit distribué. Les outils de build
   (`typescript` Apache-2.0, `wrangler` MIT/Apache-2.0) et les binaires natifs
   (`sharp-libvips`, LGPL-3.0, utilisés côté build) **ne sont pas embarqués**.
   → Cette vérification est à **refaire à chaque ajout de dépendance**, pas une fois pour toutes.
2. **Obligations d'attribution.** Apache-2.0 et CC-BY-4.0 imposent de **conserver les
   mentions**. Il faut donc un **`THIRD-PARTY-NOTICES.md`** généré depuis les dépendances de
   production. Ce n'est pas une politesse : c'est une **condition** de ces licences.
3. **Licence absente = risque.** Un paquet sans licence déclarée (`zod-to-ts`) n'est pas
   « libre de droits » : par défaut, **tous droits réservés**. À vérifier avant toute
   distribution.

#### Points de vigilance pour la suite

| Sujet | Attention |
|---|---|
| **WebUSB** | Une bibliothèque tierce sera peut-être nécessaire → vérifier sa licence **avant** intégration |
| **Modules NumWorks** | Ne jamais intégrer de code issu de NumWorks (licence non établie) |
| **Polices** | Inter, JetBrains Mono : licence OFL → à inclure dans les notices |
| **Icônes** | Material Symbols : Apache-2.0 → attribution obligatoire |
| **Composants copiés** | Tout code repris d'un autre projet doit être inventorié |

---

## 3. Marque, nom et domaine

**Le code est libre. Le nom ne l'est pas.** C'est une distinction que beaucoup de projets
libres découvrent trop tard.

| Actif | Qui le contrôle | Statut |
|---|---|---|
| Le code | Tout le monde (licence libre) | — |
| Le nom « numaps » | À décider | ⚠️ non couvert par la licence |
| Le domaine `numaps.nsi.xyz` | Le propriétaire | **Contrôle de fait de l'annuaire** |
| La clé de signature de l'instance de référence | Le propriétaire | **Contrôle de fait de l'identité du réseau** |

### 3.1 Politique de fork

Sans politique écrite, deux dérives apparaissent :

- un fork se présente sous le même nom → **confusion pour les utilisateurs** ;
- un fork réclame la légitimité du projet → **conflit de gouvernance**.

Politique recommandée, explicite et publiée :

> Le code peut être forké librement. **Un fork distribué doit porter un nom différent.**
> Le nom « numaps » et le domaine `numaps.nsi.xyz` désignent l'instance de référence et le
> projet d'origine. Un fork qui conserve le nom crée une confusion et sera signalé.

C'est la pratique courante (Mozilla, Debian, Matrix). Elle **n'enfreint pas** la licence :
la marque n'est pas couverte par le droit d'auteur.

### 3.2 ⚠️ Risque de marque accru

Tant que le projet était un outil personnel, la proximité du nom avec **NumWorks** était peu
visible. En diffusion large — de nombreuses instances, un nom de projet, de la documentation —
l'exposition augmente. Trois mesures de prudence :

1. **Mention de non-affiliation** explicite et visible : « numaps n'est ni édité ni approuvé
   par NumWorks SAS ; NumWorks est une marque de son titulaire. » ;
2. **Ne jamais utiliser le logo ni la charte graphique NumWorks** ;
3. Envisager un **nom de projet distinct**, `numaps.nsi.xyz` restant l'instance de référence.

---

## 4. Gouvernance

### 4.1 Structure actuelle : deux mainteneurs

Il faut l'**écrire**, même à deux. Une gouvernance implicite devient un conflit au premier
désaccord.

| Question | Décision à prendre |
|---|---|
| Qui fusionne sur `main` ? | Les deux, avec revue croisée obligatoire |
| Qui tranche en cas de désaccord ? | Un mainteneur désigné (BDFL) — à nommer explicitement |
| Qui contrôle le domaine et l'annuaire ? | À écrire noir sur blanc |
| Comment un nouveau mainteneur est-il admis ? | Critères écrits |
| Comment un mainteneur se retire-t-il ? | Critères écrits |

### 4.2 Contributions : **DCO** plutôt que CLA

| | DCO (*Developer Certificate of Origin*) | CLA (*Contributor License Agreement*) |
|---|---|---|
| Principe | Le contributeur **signe** ses commits (`Signed-off-by`) | Le contributeur **cède ou licencie** ses droits |
| Charge | Très faible | Élevée, dissuasive |
| Permet de changer la licence plus tard | Non (accord des contributeurs requis) | Oui |
| Alignement avec l'esprit du libre | ✅ Fort | ⚠️ Souvent critiqué |

**Recommandation : DCO.** À deux contributeurs, un changement de licence ultérieur reste
négociable. Un CLA découragerait des contributions précieuses pour un bénéfice hypothétique.

### 4.3 Fichiers de gouvernance à produire

| Fichier | Rôle | Priorité |
|---|---|---|
| `LICENSE` | Licence du logiciel | 🔴 Avant la première publication |
| `CONTRIBUTING.md` | Conventions, workflow, DCO | 🔴 |
| `SECURITY.md` | Divulgation responsable, contact | 🔴 |
| `CODE_OF_CONDUCT.md` | Cadre des échanges | 🟠 |
| `GOVERNANCE.md` | Décisions, rôles, marque | 🟠 |
| `TRADEMARK.md` | Politique de nom et de fork | 🟠 |
| `CHANGELOG.md` | Historique lisible | 🟡 |

---

## 5. Distribution et auto-hébergement

### 5.1 Le risque numéro un n'est pas technique

> **Un logiciel fédéré difficile à installer n'a pas de réseau.**

L'annuaire peut être parfait : s'il faut trois heures et des compétences Cloudflare pour
rejoindre le réseau, il restera vide. **L'installation est le premier critère de succès du
projet**, avant toute considération de protocole.

### 5.2 Options de distribution

| Moyen | Effort pour l'hébergeur | Remarque |
|---|---|---|
| **Dépôt modèle** (« Use this template ») | Faible | Le plus simple à mettre en place |
| **Bouton « Deploy to Cloudflare »** | Très faible | Guide l'utilisateur pas à pas |
| **Script d'installation** (une commande) | Faible | Suppose `wrangler` et un compte |
| Image conteneur / autre hébergeur | Moyen | Élargit au-delà de Cloudflare — ⚠️ dépendances D1/KV à abstraire |
| Installation manuelle documentée | Élevé | **Toujours prévoir**, pour ne pas enfermer |

⚠️ **Dépendance à Cloudflare.** Le logiciel repose sur D1, KV, Workers. C'est un choix
d'hébergeur, pas un choix de conception. Le documenter honnêtement évite l'illusion d'un
logiciel « portable ».

### 5.3 Documentation obligatoire pour un hébergeur

| Document | Pourquoi |
|---|---|
| **Installer** | La barrière d'entrée |
| **Configurer** | Domaine, secrets, clés, niveaux de consentement |
| **Mettre à jour** | Les migrations D1 sont le point de fragilité |
| **Sauvegarder / restaurer** | Un hébergeur qui perd ses scripts ne revient pas |
| **Désinstaller / migrer** | Respect de l'utilisateur ; condition de la confiance |
| **Coût réel** | Dire clairement : « offer gratuit probablement suffisant, voici les limites » |

---

## 6. Versionnement et compatibilité du réseau

Un réseau fédéré est **toujours hétérogène** : des instances à des versions différentes.
Ce n'est pas un défaut à corriger, c'est une donnée de conception.

Deux numéros de version **distincts** :

| Version | Portée | Rôle |
|---|---|---|
| `software_version` | Le logiciel | Fonctionnalités, corrections |
| **`protocol_version`** | Le protocole de fédération | **Détermine qui peut parler à qui** |

Politique à écrire :

- **Tolérance** : une instance accepte-t-elle un manifeste en `N-1` ? En `N-2` ?
- **Dépréciation** : annonce préalable, jamais de rupture silencieuse ;
- **Comportement en cas d'incompatibilité** : ignorer l'instance, ou l'afficher comme
  « incompatible » ? (L'afficher est préférable : cela informe au lieu de masquer.)
- **Négociation** : le manifeste porte la version, donc la compatibilité se décide **avant**
  tout échange.

---

## 7. Risques propres au logiciel libre

| Risque | Description | Mitigation |
|---|---|---|
| **Non-adoption** | Personne n'installe → annuaire vide → personne n'installe | Installation triviale, documentation, communication ciblée |
| **Fork hostile** | Un tiers reprend le code sous un autre nom, capte les utilisateurs | AGPL + politique de marque ; un fork est aussi une **porte de sortie**, donc une garantie |
| **Épuisement des mainteneurs** | Support gratuit illimité, exigences des utilisateurs | Périmètre écrit, pas de support individuel implicite, `CONTRIBUTING.md` clair |
| **Privilège de l'instance de référence** | Celui qui tient l'annuaire a un pouvoir de fait | Plusieurs annuaires possibles, politique neutre et écrite, annuaire remplaçable |
| **Divulgation de faille mal gérée** | Publication sauvage, ou silence | `SECURITY.md`, délai de coordination, canal dédié |
| **Dépendances comprometues** | Attaque par la chaîne npm | Épinglage, revue, `npm audit`, releases signées |
| **Dérive du protocole** | Le « standard » devient le logiciel | Protocole spécifié **séparément**, sous licence permissive |

---

## 8. Décisions ouvertes

1. **Licence du code** : ⏸️ **reportée** — elle dépendra des outils et bibliothèques
   effectivement intégrés (voir §2.4). La **politique de dépendances**, elle, s'applique
   **dès maintenant** : toute dépendance hors catégorie « sûre » doit être validée avant
   intégration.
2. **`THIRD-PARTY-NOTICES.md`** : à générer automatiquement depuis les dépendances de
   production — condition des licences Apache-2.0 et CC-BY-4.0.
3. **`zod-to-ts`** : paquet sans licence déclarée. À vérifier ou à écarter avant toute
   distribution.
4. **Licence du protocole** : CC0, MIT, ou autre ?
5. **Nom du projet** : conserver « numaps » (avec mention de non-affiliation) ou choisir un
   nom distinct ?
6. **Politique de marque** : qui peut utiliser le nom, et sous quelles conditions ?
7. **Gouvernance** : qui tranche ? Qui contrôle domaine et annuaire ? Critères d'admission
   d'un mainteneur ?
8. **DCO** : confirmé ?
9. **Distribution** : dépôt modèle, bouton de déploiement, ou les deux ?
10. **Portabilité** : reste-t-on volontairement lié à Cloudflare, ou prépare-t-on une
    abstraction (D1 → SQL générique) dès la conception ?
11. **Politique de compatibilité** : quelle tolérance de version ?
