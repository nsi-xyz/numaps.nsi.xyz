# MISSION — Prototype local « numaps »

> **Document autonome.** Il ne fait référence à aucun autre fichier et ne suppose aucun
> contexte extérieur. Tu peux tout construire à partir de ces seules pages.
>
> **Destinataire :** un agent IA de codage, travaillant avec un élève.
> **Budget :** environ **3 jours** de travail. Sois efficace, ne sur-conçois pas.
> **Livrable :** une application **qui tourne en local** sur la machine de l'élève, avec un
> **éditeur Python**, un **simulateur de calculatrice** et le **transfert WebUSB**.

---

## 1. Le produit en une phrase

Un gestionnaire de scripts Python pour calculatrice **NumWorks**, qui permet de **écrire**,
**tester dans un simulateur** et **envoyer vers la vraie calculatrice par USB** — le tout
**en local**, sans compte, sans serveur distant, sans base de données.

---

## 2. Contraintes absolues

Ces règles ne sont pas négociables. Les enfreindre fait échouer la mission.

| # | Contrainte |
|---|---|
| 1 | **Tout tourne en local.** Aucun déploiement, aucun hébergement distant, aucun GitHub, aucun Cloudflare. |
| 2 | **Aucune base de données.** Pas de SQL, pas de serveur de données. Les scripts vivent **dans le navigateur**. |
| 3 | **Aucune authentification.** Pas de compte, pas de mot de passe, pas de session. |
| 4 | **Aucune requête réseau sortante** au fonctionnement. L'application doit marcher hors ligne (hors chargement initial des dépendances). |
| 5 | **Le serveur Node ne contient aucune logique métier.** Il sert des fichiers statiques, c'est tout. |
| 6 | **Ne jamais écrire dans la mémoire flash ni le bootloader de la calculatrice.** Uniquement des scripts. Une mauvaise écriture peut rendre la machine inutilisable. |
| 7 | **Chrome ou Edge obligatoire** pour le WebUSB. Firefox et Safari ne le supportent pas — affiche un message clair si le navigateur ne convient pas. |

### Pourquoi « pas de serveur » ?

L'application sera plus tard hébergée sur Cloudflare, où **servir un fichier statique est
gratuit et illimité**, alors que faire exécuter du code serveur coûte. En gardant **toute la
logique dans le navigateur**, la migration future sera quasi gratuite : on prendra le dossier
`public/` et on le publiera tel quel.

Le serveur Node ne sert donc qu'à **contourner une limite du navigateur** : ouvrir des fichiers
depuis le disque et offrir un contexte sécurisé pour le WebUSB. C'est un détail technique, pas
une architecture.

---

## 3. Architecture imposée

```
numaps/
├── package.json
├── server.mjs          ← serveur Node : fichiers statiques uniquement, zéro logique
├── public/             ← TOUTE l'application (c'est ce dossier qu'on déploiera plus tard)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── vendor/         ← bibliothèques tierces récupérées
├── CREDITS.md          ← origine et licence de chaque bibliothèque utilisée
└── README.md           ← comment lancer, comment tester
```

**Le serveur :** `node server.mjs` → l'application s'ouvre sur `http://localhost:4321`.

> ℹ️ **`localhost` compte comme un contexte sécurisé** pour le navigateur : le WebUSB
> fonctionnera sans HTTPS. C'est essentiel — ne cherche pas à configurer un certificat.

**La persistance :** `IndexedDB` (recommandé) ou `localStorage`. Prévois **en plus** un
export/import au format JSON, pour que l'élève puisse sauvegarder ses scripts dans un fichier.

**Stack frontend :** ton choix. Un framework (React, Vue, Svelte) ou du JavaScript simple avec
un bundler (Vite) — les deux conviennent. Critère unique : ça doit **démarrer sans friction**
sur la machine d'un élève.

---

## 4. Les fonctionnalités

### 4.1 Gestion des scripts (le socle)

- **Créer, éditer, renommer, dupliquer, supprimer** un script.
- **Tags multiples** par script — **pas de dossiers, pas d'arborescence**. Un script peut avoir
  plusieurs tags (ex. `maths`, `jeux`, `physique`).
- **Recherche instantanée** pendant la frappe, portant sur le **nom** *et* le **contenu**.
- **Filtres par tags reflétés dans l'URL** (ex. `/?tags=maths,jeux`) : un rechargement ou un
  favori doit retrouver exactement la même vue.
- **Grille de cartes** : chaque carte montre le nom, les tags, un aperçu ; les actions
  (éditer, envoyer, dupliquer, supprimer) sont accessibles **directement sur la carte**, sans
  navigation profonde ni fenêtre intermédiaire.

### 4.2 Éditeur de code

- Coloration syntaxique **Python** et numérotation des lignes.
- L'extension `.py` **n'apparaît jamais** dans l'interface : elle est ajoutée automatiquement
  au transfert et à l'export.

### 4.3 Simulateur (à tester avant d'envoyer)

- Écran de **320 × 222 pixels**, affiché agrandi (facteur 2 ou 3) avec des pixels nets
  (`image-rendering: pixelated`).
- Les scripts doivent pouvoir utiliser les modules propres à la machine :
  - **`kandinsky`** : dessin sur l'écran (pixels, rectangles, lignes, texte, couleurs).
  - **`ion`** : événements clavier et temporisation.
- **Console** sous l'écran : affiche les `print` et les erreurs (tracebacks) du script.
- Boutons **Exécuter** et **Arrêter**.

> **Stratégie à deux niveaux — c'est le point technique le plus délicat.**
>
> **Niveau A (à faire en premier, résultat garanti) :** exécute du Python **dans le navigateur**
> avec **Pyodide** (CPython compilé en WebAssembly, licence MIT), et écris toi-même deux petits
> modules `kandinsky` et `ion` qui dessinent sur le canvas 320×222 et lisent le clavier.
> La plupart des scripts de lycée fonctionneront.
>
> **Niveau B (seulement si le temps le permet) :** il existe des **simulateurs web open source**
> des projets communautaires **Upsilon** et **Omega** (dérivés d'Epsilon), qui embarquent un
> vrai MicroPython. Meilleure fidélité, intégration plus lourde. Cherche-les sur GitHub.
>
> **Conçois un adaptateur interchangeable** (`SimulatorAdapter`) entre les deux, pour pouvoir
> passer de A à B sans toucher au reste de l'application. Si tu manques de temps, **reste au
> niveau A** : un simulateur approximatif qui marche vaut mieux qu'un simulateur parfait qui
> n'existe pas.

### 4.4 Transfert WebUSB (le cœur du produit)

C'est la fonctionnalité qui justifie le projet. Sois rigoureux.

**Détection de la calculatrice**
- La NumWorks se présente comme un périphérique **STM32** : `vendorId 0x0483`,
  `productId 0xa291`.
- Affiche en permanence un **indicateur d'état** : *Branché* / *Débranché*, mis à jour
  automatiquement (événements `connect` / `disconnect` de `navigator.usb`).
- L'autorisation d'accès nécessite **un clic de l'utilisateur** (règle de sécurité du
  navigateur) : prévois un bouton explicite « Connecter la calculatrice ».

**Protocole**
1. **Handshake** : échange initial pour identifier la version du système (Epsilon, Upsilon,
   Omega) et ouvrir une session.
2. **Encapsulation** : le script n'est pas envoyé brut. Il est découpé en **paquets de taille
   fixe**, accompagnés de ses métadonnées (nom, longueur).
3. **Écriture** : les paquets sont transmis séquentiellement vers la mémoire de la machine.

La communication utilise des *endpoints* USB en mode **Bulk** : un pour l'envoi, un pour la
réception.

> **Ne réimplémente pas ce protocole de zéro sans nécessité.** Il existe des bibliothèques
> JavaScript communautaires qui le font déjà — cherche `numworks.js` et `upsilon.js` sur
> GitHub, et inspire-toi des projets **Upsilon-Workshop**, **PyNumStore** ou de l'interface
> **KhiCAS**. Récupère, adapte, crédite. Si tu dois l'implémenter toi-même, fais-le à partir
> des trois phases ci-dessus.

**Fonctions attendues**
- **Envoyer** un script (ou une sélection de plusieurs scripts) vers la calculatrice.
- **Lire** la liste des scripts présents sur la machine, et en **extraire** un vers l'application.
- **Glisser-déposer** un fichier `.py` depuis le bureau vers l'application.
- **Sauvegarde en un clic** : lire toute la mémoire de scripts et produire une archive locale.

**Gestion des erreurs** — sois exhaustif, c'est ce qui distingue un prototype d'un outil :
- calculatrice non branchée, ou débranchée en cours de transfert ;
- accès refusé par l'utilisateur ;
- navigateur non compatible ;
- firmware non reconnu ;
- nom invalide ;
- conflit de nom (voir §6).

**Contraintes système à signaler dans le README**
- **Linux** : l'accès USB nécessite des règles `udev` (`/etc/udev/rules.d/`) pour un
  utilisateur non-root.
- **Windows** : un pilote générique **WinUSB** est requis ; sinon l'utilitaire *Zadig*.
- ⚠️ Le *Workshop* officiel de NumWorks **refuse les firmwares alternatifs**. Ton outil doit
  fonctionner aussi bien avec un firmware officiel qu'avec Upsilon ou Omega.

### 4.5 Sauvegarde et export

- **Export** de tous les scripts dans un fichier JSON téléchargeable.
- **Import** d'un fichier JSON pour restaurer.
- **Export d'une archive** des scripts lus depuis la calculatrice.

---

## 5. Design — Material Design 3

**La référence est Material Design 3.** L'application doit se lire comme du Material, pas comme
un thème approximatif.

| Élément | Attendu |
|---|---|
| Système | Material Design 3 : rôles de couleur, élévation, états, formes, typographie |
| Couleur de marque | **Violet `#9A29D2`**, à utiliser comme couleur primaire ou *seed color* |
| Icônes | **Material Symbols** |
| Composants | Boutons, cartes, barres de recherche, menus, *snackbars*, dialogues Material |
| Élévation | Autorisée et attendue |
| Thème sombre | À prévoir si le coût est faible, sinon hors périmètre |

**Exigences d'ergonomie :**
- **Aucun `alert()`, `confirm()` ni `prompt()` natif du navigateur.** Utilise des *snackbars*
  Material et des boîtes de dialogue Material. Les popups natifs bloquent l'interface et
  cassent l'impression de qualité.
- **Zéro friction** : pas d'écran intermédiaire inutile, pas de navigation profonde. Tout ce
  qui est fréquent doit être à un clic.
- **Navigation au clavier** et contrastes suffisants.
- **En français**, avec des libellés courts et explicites.

---

## 6. Règles NumWorks à respecter

### 6.1 Nommage — validation dès la frappe

Le système de fichiers de la calculatrice est restrictif. L'application doit **empêcher la
saisie invalide**, pas la corriger après coup :

- ❌ **aucun espace** ;
- ❌ **aucun caractère spécial** — **seul `_` est toléré** ;
- ✅ lettres, chiffres et `_` uniquement ;
- 📏 **longueur limitée** (les noms sont courts sur la machine : reste prudent, de l'ordre de
  quelques dizaines de caractères, et fais de cette limite **une constante nommée** facile à
  ajuster) ;
- l'extension `.py` est **gérée par le code**, jamais montrée ni saisie.

### 6.2 Conflits de noms — jamais d'écrasement silencieux

Si un script du même nom existe déjà, à l'envoi comme à l'import :

> **Le transfert s'interrompt et l'utilisateur choisit explicitement**, parmi trois options :
>
> 1. **Écraser** — remplacer le fichier existant.
> 2. **Renommer automatiquement** — ajouter un suffixe lisible (ex. `script_v2`) et transférer.
> 3. **Ignorer** — ne pas transférer ce fichier.

C'est la première cause de perte de données dans les outils existants. **Aucune exception.**

---

## 7. Ce qu'il ne faut PAS faire

| ❌ | Pourquoi |
|---|---|
| Ajouter une base de données, un serveur d'API, une authentification | Explicitement hors périmètre |
| Déployer quoi que ce soit en ligne | La mission est locale |
| Écrire dans la mémoire flash ou le bootloader | Risque de rendre la calculatrice inutilisable |
| Collecter ou transmettre des identifiants NumWorks | Jamais |
| Réimplémenter un interpréteur Python ou le protocole USB de zéro si une bibliothèque existe | Perte de temps et de jetons |
| Utiliser `alert()`, `confirm()`, `prompt()` | Interdit par la charte |
| Passer plus de temps sur le style que sur le WebUSB | L'inverse de la priorité |

---

## 8. Ordre de travail et arbitrages

Le budget est de **trois jours**. Voici la répartition qui maximise les chances d'avoir un
produit utilisable à la fin.

**Jour 1 — le socle**
Serveur Node qui démarre · structure `public/` · CRUD des scripts · tags · recherche
instantanée · filtres dans l'URL · grille de cartes · charte Material posée.

**Jour 2 — l'éditeur et le simulateur**
Éditeur Python coloré · exécution Python dans le navigateur · canvas 320×222 · modules
`kandinsky` et `ion` · console des sorties et des erreurs · validation du nommage.

**Jour 3 — le WebUSB et les finitions**
Détection du périphérique · envoi d'un script · lecture et extraction · glisser-déposer ·
résolution des conflits · messages d'erreur · export/import JSON · README.

**Si tu prends du retard, sacrifie dans cet ordre :**
1. le thème sombre ;
2. la sauvegarde « un clic » de toute la mémoire ;
3. l'extraction depuis la calculatrice (garde au minimum **l'envoi**) ;
4. l'intégration du vrai simulateur MicroPython (reste sur Pyodide) ;
5. les animations et les transitions.

**Ne sacrifie jamais :** le nommage, la résolution des conflits, l'envoi WebUSB, et le fait que
l'application **démarre**.

---

## 9. Définition de « terminé »

- [ ] `npm install` puis `npm start` (ou `node server.mjs`) lance l'application.
- [ ] L'élève ouvre `http://localhost:4321` et voit la grille de ses scripts.
- [ ] Créer, taguer, chercher, filtrer, renommer, supprimer — tout fonctionne, et **les
      données survivent au rechargement de la page**.
- [ ] Les filtres par tags sont visibles dans l'URL et restaurés au rechargement.
- [ ] L'éditeur colore le Python et un script s'exécute dans le simulateur, avec son affichage
      et sa console.
- [ ] Une calculatrice branchée est détectée, et **un script s'y envoie avec succès**.
- [ ] Un conflit de nom propose les **trois choix**, sans jamais écraser en silence.
- [ ] Aucune donnée ne sort de la machine.
- [ ] Le `README.md` explique **pas à pas** comment installer et lancer, et **ce qu'il faut
      tester à la main**.

---

## 10. Consignes de travail pour l'agent

1. **Avance par petits pas vérifiables.** À chaque étape, l'application doit continuer à
   démarrer. Ne construis pas trois fonctionnalités avant de vérifier la première.
2. **Tu ne peux pas tester le WebUSB ni le simulateur toi-même** : ils exigent un navigateur et
   une vraie calculatrice. En revanche, tu **peux** vérifier que le serveur démarre, que la page
   se charge et que le code compile.
3. **Écris à la fin un protocole de test manuel**, sous forme de liste numérotée, que l'élève
   suivra pas à pas. Sois précis : « branche la calculatrice, ouvre l'application, clique sur
   *Connecter*, vérifie que l'indicateur passe au vert… ». C'est **un livrable à part entière**.
4. **Documente tes hypothèses.** Quand tu ne peux pas vérifier quelque chose, écris-le dans le
   README plutôt que de rester silencieux.
5. **Utilise des bibliothèques existantes** pour tout ce qui est difficile : éditeur de code,
   exécution Python, communication USB. Ne réinvente que ce qui est spécifique au projet.
6. **Note dans `CREDITS.md`** chaque bibliothèque utilisée : nom, adresse du dépôt, licence.
   Préfère les licences permissives (MIT, Apache, BSD, ISC).
7. **Pose des questions** si un choix structurel te semble devoir être tranché par un humain.
   Sinon, décide, explique brièvement, et continue — le temps est compté.

---

## 11. Ce dont l'élève a besoin

**À installer une seule fois :**
1. **Node.js** (version 20 ou plus récente) : <https://nodejs.org> → bouton « LTS ».
2. **Google Chrome** ou **Microsoft Edge** — indispensable pour le WebUSB.

**Pour lancer l'application :**
```bash
npm install     # une seule fois
npm start       # à chaque utilisation
```
Puis ouvrir <http://localhost:4321>.

**Pour tester le transfert :**
- une calculatrice **NumWorks**, un câble USB **qui transmet les données** (certains câbles ne
  font que charger !) ;
- brancher la calculatrice **avant** de cliquer sur « Connecter » ;
- sous Linux ou Windows, appliquer les règles système décrites dans le README.

---

**Commence maintenant. Lis ce document en entier, annonce ton plan en quelques lignes, puis
exécute-le.**
