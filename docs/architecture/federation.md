# Fédération d'instances — architecture et risques

> **Version :** 1.0 **Statut :** architecture de référence. **Aucune
> implémentation.** **Objet :** décrire le modèle « logiciel libre auto-hébergé +
> annuaire + liens optionnels », figer le vocabulaire, spécifier les niveaux de
> consentement, et recenser les risques.

- - -
## 0\. Le changement de modèle


|                         |Modèle précédent                         |Modèle retenu                                          |
|-------------------------|-----------------------------------------|-------------------------------------------------------|
|Nature                   |Plateforme centralisée multi-utilisateurs|**Logiciel libre, auto-hébergé**                       |
|Utilisateurs par instance|Nombreux                                 |**Un seul** — le propriétaire du compte Cloudflare     |
|Qui héberge les scripts  |La plateforme                            |**Chaque propriétaire, chez lui**                      |
|Contenu des tiers        |Oui                                      |**Non** — chaque instance n'héberge que ses propres scripts|
|Lien entre instances     |Sans objet                               |**Annuaire + liens optionnels, consentis**             |
|Visiteurs                |Statique                                 |**Statique** (inchangé)                                |

### 0.1 Ce que ce modèle résout

- **L'essentiel du risque juridique disparaît.** Une instance mono-utilisateur
  n'héberge aucun contenu de tiers : son propriétaire est l'**éditeur de son
  propre contenu**. Il n'y a ni modération, ni signalement, ni obligation liée à
  la diffusion de contenu d'autrui.
- **Le coût est porté par chaque hébergeur**, pas par un opérateur unique.
- **Pas de point de capture** : le logiciel est libre, donc forkable, et aucune
  entité ne peut fermer le réseau.
- **La contrainte « un seul utilisateur » est aussi une simplification de sécurité**
  : plus de gestion de comptes, plus de rôles, plus de fuite de données
  d'autrui.

### 0.2 Ce que ce modèle déplace — et qu'il faut regarder en face

- **Le fardeau passe à l'installation.** Un logiciel fédéré qui est difficile à
  installer n'a pas de réseau. C'est le premier risque d'échec, avant tout
  problème technique.
- **La fédération réintroduit du risque juridique** dès qu'une instance *copie*
  le contenu d'une autre : elle redevient hébergeur de contenu de tiers (voir
  §6.2).
- **L'annuaire devient la seule brique partagée**, donc le seul point de contrôle
  — et le seul point d'attaque central (voir §6.1).

- - -
## 1\. Vocabulaire à figer

Un vocabulaire imprécis produit une architecture imprécise. Ces termes sont
normatifs.


|Terme                 |Définition                                                                                 |
|----------------------|-------------------------------------------------------------------------------------------|
|**Instance** (ou *nœud*)|Un déploiement du logiciel : un compte Cloudflare, une base D1, **un** utilisateur authentifié.|
|**Propriétaire**      |La personne qui contrôle l'instance et en est responsable.                                 |
|**Instance de référence**|L'instance `numaps.nsi.xyz`, qui héberge l'annuaire public. **Privilège de fait, pas de droit.**|
|**Annuaire**          |La liste publiée des instances déclarées. **Doit rester un fichier.**                      |
|**Manifeste**         |Document statique signé, publié par une instance, décrivant son identité et ses intentions.|
|**Niveau de consentement**|Ce qu'une instance déclare émettre et accepter (§3).                                       |
|**Réseau**            |L'ensemble des instances se reconnaissant mutuellement.                                    |

- - -
## 2\. Topologie

```
        ┌───────────────────────────┐
        │  Instance de référence    │
        │  numaps.nsi.xyz           │
        │  ── publie l'annuaire ──  │   ← un simple FICHIER statique
        └─────────────┬─────────────┘
                      │  GET /instances.json (1×/jour)
        ┌─────────────┴─────────────┬─────────────────────┐
        ▼                           ▼                     ▼
  ┌───────────┐              ┌───────────┐         ┌───────────┐
  │ instance A│◄──── liens ──►│ instance B│◄───────►│ instance C│
  │ 1 user    │   optionnels  │ 1 user    │         │ 1 user    │
  │ 1 D1      │               │ 1 D1      │         │ 1 D1      │
  └───────────┘              └───────────┘         └───────────┘
     visiteurs : 100 % statique (aucun Worker, aucune D1)
```
**Principe : seul l'annuaire est partagé, et il ne doit être qu'un fichier.**
Plus l'annuaire est « bête », moins il peut nuire, et moins il coûte.

- - -
## 3\. Niveaux de consentement — spécification

Le point délicat : un lien entre deux instances ne peut exister que si **les deux**
le veulent. Il faut donc distinguer ce qu'une instance **émet** de ce qu'elle **
accepte**.

### 3.1 Ce qu'une instance émet


|Niveau|Nom        |Contenu émis                                                                        |
|------|-----------|------------------------------------------------------------------------------------|
|**E0**|Fermée     |Rien. Non listée, non découvrable.                                                  |
|**E1**|Présence   |Identité de l'instance : id, nom, domaine, version, clé publique.                   |
|**E2**|Réciprocité|E1 + publication de l'annuaire reçu sur son propre site.                            |
|**E3**|Vitrine    |E2 + **métadonnées** des scripts publics (titre, auteur, licence, URL). **Sans le contenu.**|
|**E4**|Partage    |E3 + **contenu** des scripts publics, en tout ou en sélection. ⚠️ Voir §6.2.        |

### 3.2 Ce qu'une instance accepte


|Niveau|Nom     |Contenu accepté                                             |
|------|--------|------------------------------------------------------------|
|**R0**|Fermée  |Rien.                                                       |
|**R1**|Annuaire|Affiche la liste des instances.                             |
|**R2**|Index   |R1 + les métadonnées de scripts d'autres instances.         |
|**R3**|Contenu |R2 + le contenu de scripts d'autres instances. ⚠️ Voir §6.2.|

### 3.3 Règle d'établissement d'un lien

> **Un flux A → B existe si et seulement si `émission(A) ≥ niveau requis` ET `
> réception(B) ≥ niveau requis`.**

Exemples :


|Cas           |Résultat                                                                         |
|--------------|---------------------------------------------------------------------------------|
|A = E1, B = R1|B affiche A dans la liste. **Lien minimal.**                                     |
|A = E1, B = R3|B affiche A dans la liste, mais **ne peut pas** afficher ses scripts : A n'émet rien.|
|A = E4, B = R1|A partage, mais B ne veut pas : **rien ne circule.** Le consentement est bilatéral.|
|A = E0, B = R3|A est invisible : **aucun lien**.                                                |

**L'annuaire n'enregistre que des déclarations, jamais des relations.** Les
relations se calculent par intersection. Cela évite qu'un tiers décide à la
place d'un autre.

### 3.4 Portée du consentement

- Les niveaux sont **déclarés dans le manifeste signé** (§4) : ils sont donc **
  vérifiables**.
- Ils sont **révocables** : une instance peut redescendre de E4 à E1, et la
  révocation doit se propager en un cycle de rafraîchissement.
- Ils sont **publics** : un niveau est un engagement lisible par tous, pas un
  réglage caché.

- - -
## 4\. Protocole de découverte — spécification

> ⚠️ Spécification, **pas** une implémentation.

### 4.1 Manifeste d'instance

Publié à une URL bien connue, en **fichier statique** :

```
https://<domaine>/.well-known/numaps.json
```
Contenu minimal :


|Champ           |Rôle                                                                                 |
|----------------|-------------------------------------------------------------------------------------|
|`id`            |**Identifiant stable** (UUID généré à l'installation) — survit à un changement de domaine|
|`name`, `domain`|Identité lisible                                                                     |
|`public_key`    |Clé publique **Ed25519** — permet de **vérifier** les déclarations                   |
|`protocol_version`|Version du protocole de fédération                                                   |
|`software_version`|Version du logiciel installé                                                         |
|`emit`, `accept`|Niveaux déclarés (§3)                                                                |
|`updated_at`    |Date de dernière mise à jour                                                         |
|`index_url`     |URL de l'index des scripts publics, **si** `emit ≥ E3`                               |

**Signature** : le manifeste est signé par la clé privée de l'instance. Aucun
secret partagé, aucune autorité de certification. La confiance repose sur la **
continuité de la clé** : si la clé change sans explication, les autres instances
doivent le signaler.

### 4.2 Alimentation de l'annuaire — le mécanisme le plus simple qui marche

Proposition : **l'annuaire vit dans le dépôt Git du projet**.

```
1. Le propriétaire d'une instance ouvre une pull request ajoutant
   `registry/instances/<id>.json` (son manifeste signé).
2. La CI valide : schéma, signature, format, cohérence domaine/URL.
3. Un humain relit et fusionne.        ← barrière anti-spam, et piste d'audit publique
4. Le build régénère `instances.json` et le publie en ASSET STATIQUE.
5. Chaque instance le récupère 1×/jour.  ← PULL, jamais push
```
Pourquoi c'est le bon choix :

- ✅ **Réutilise l'infrastructure existante** (dépôt, CI, déploiement statique) ;
- ✅ **Revue humaine** : barrière naturelle contre l'empoisonnement de l'annuaire ;
- ✅ **Piste d'audit publique** : qui est entré, quand, avec quelle clé ;
- ✅ **Coût nul** et **annuaire statique**, donc gratuit et illimité en lecture ;
- ✅ **Modèle PULL** : l'annuaire ne collecte **aucune donnée** sur ses lecteurs,
  pas de télémétrie, pas de compte, donc pas de responsabilité de traitement.

Contreparties à assumer : **GitHub devient une dépendance de l'annuaire**, et
l'ajout passe par une revue humaine (donc un délai).

### 4.3 Robustesse

- **Dégradation gracieuse** : chaque instance conserve sa dernière copie. Si
  l'instance de référence disparaît, **le réseau continue de fonctionner** — il
  cesse seulement de découvrir.
- **Annuaire remplaçable** : le logiciel doit accepter **plusieurs URL d'annuaire**
  , y compris aucune. Un annuaire unique serait un point de contrôle politique
  inacceptable.
- **Versionnage** : l'annuaire porte une version de protocole et une date.

### 4.4 Ce qu'il ne faut PAS faire


|❌                            |Pourquoi                                                                              |
|-----------------------------|--------------------------------------------------------------------------------------|
|ActivityPub / ActivityStreams|Surdimensionné : inbox/outbox, acteurs, signatures HTTP. Complexité sans bénéfice ici.|
|Un compte sur l'annuaire     |Réintroduit l'authentification centralisée et la collecte de données.                 |
|Un enregistrement en **push**|L'annuaire devient responsable de traitement et cible de spam.                        |
|Exécuter du code distant     |Surface d'attaque majeure, sans bénéfice.                                             |
|Faire confiance par défaut   |Toute instance est non fiable jusqu'à preuve du contraire.                            |
|Copier le contenu par défaut |Réintroduit le risque juridique (§6.2).                                               |

- - -
## 5\. Ce que la fédération ne doit pas changer

- **Les visiteurs reçoivent du 100 % statique** (cf. `cache-et-statique.md`).
  L'annuaire reçu est lui aussi un **asset statique** : le rafraîchissement est
  le fait du propriétaire, pas du visiteur.
- **Aucun Worker, aucune D1 en lecture.** L'agrégation se fait hors ligne, au
  rythme quotidien.

- - -
## 6\. Risques

### 6.1 Risques de sécurité


|\#|Risque                                                                                                                                   |Gravité    |Mitigation                                                                                                                                                                                           |
|-|-----------------------------------------------------------------------------------------------------------------------------------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|1|**Hameçonnage via l'annuaire** — une fausse instance imite une instance légitime pour capter des identifiants ou diffuser du contenu trompeur|🔴 **Critique**|Manifestes **signés** ; vérification du domaine ; affichage explicite de la clé et de la date ; **jamais d'identifiants** transitant par une instance ; procédure de retrait ; avertissement dans l'interface|
|2|**SSRF** — une URL d'instance malveillante fait récupérer par le serveur des ressources internes (métadonnées cloud, réseau local)       |🔴 Élevé   |Schémas autorisés (`https` uniquement) ; refus des IP privées et des redirections vers celles-ci ; timeouts ; taille maximale ; pas de suivi de redirection arbitraire                               |
|3|**Empoisonnement / Sybil** — enregistrement massif d'instances factices                                                                  |🟠 Moyen   |Revue humaine par pull request ; plafond du nombre d'entrées ; révocation ; signature                                                                                                                |
|4|**Contenu malveillant** propagé par un partage                                                                                           |🟠 Moyen   |Le contenu est du **texte**, jamais exécuté côté serveur ; CSP stricte ; `Content-Disposition: attachment` au téléchargement ; attribution et lien vers la source                                    |
|5|**Chaîne d'approvisionnement** — compromettre le dépôt compromet **toutes** les instances                                                |🔴 Élevé   |Protection de branche, revue par les deux mainteneurs, *push protection* (déjà activée), dépendances épinglées, **releases signées**, build reproductible                                            |
|6|**Fuite d'IP des visiteurs** — si le navigateur interroge directement chaque instance                                                    |🟠 Moyen   |Agrégation **côté instance**, pas côté visiteur ; le visiteur ne parle qu'à l'instance qu'il consulte                                                                                                |
|7|**Déni de service sur l'annuaire**                                                                                                       |🟡 Faible  |Fichier statique → gratuit et illimité ; cache ; répliques possibles                                                                                                                                 |
|8|**Perte de domaine** = perte d'identité                                                                                                  |🟠 Moyen   |Identifiant **stable** (UUID) indépendant du domaine ; changement de domaine possible sans changer d'identité                                                                                        |

### 6.2 Risques juridiques — réintroduits par la fédération

> ⚠️ **C'est le point le plus important de ce document.**

Le modèle mono-utilisateur supprime presque tout le risque juridique. **Mais dès
qu'une instance copie le contenu d'une autre, elle redevient hébergeur de
contenu de tiers** — avec les obligations correspondantes (retrait sur
notification, conservation, point de contact).


|Niveau                 |Statut juridique de l'instance qui reçoit                                                         |
|-----------------------|--------------------------------------------------------------------------------------------------|
|R0 / R1                |**Aucun contenu de tiers.** Statut inchangé.                                                      |
|R2 (métadonnées seules)|Zone grise : on cite des titres et des auteurs, on ne reproduit pas l'œuvre. **Le plus sûr après R1.**|
|**R3 (contenu)**       |🔴 **L'instance redevient hébergeur de contenu de tiers.**                                        |

Autres points :

- **Droit d'auteur** : partager un script = un **acte de reproduction**. Il faut
  une **licence explicite** de l'auteur, transportée dans les métadonnées du
  script. « Public » ne veut pas dire « réutilisable ».
- **L'annuaire** : publier une liste de liens est une activité d'intermédiaire de
  faible portée. Le risque augmente si l'opérateur **trie**, **classe** ou **
  recommande** : il glisserait vers un rôle éditorial. **L'annuaire doit rester
  neutre et exhaustif.**
- **RGPD** : les manifestes doivent être **minimisés** — aucune donnée
  personnelle, aucun e-mail, aucun nom réel. Un pseudonyme public et une URL
  suffisent.
- **Juridictions multiples** : les instances peuvent être partout. Un lien vers
  une instance étrangère ne transfère pas la responsabilité, mais un contenu
  illicite chez elle peut vous valoir une notification.

**Recommandation d'architecture :** faire de **R1 le niveau par défaut et R3
l'exception explicite**, jamais l'inverse. Le réseau fonctionne parfaitement en
R1/E1 : découvrir les instances, c'est déjà l'essentiel du bénéfice.

### 6.3 Risques organisationnels


|Risque                     |Description                                                                                     |Piste                                                                          |
|---------------------------|------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
|**Le réseau vide**         |Un annuaire à une entrée est inutile. Le facteur limitant est l'installation, pas la fédération.|Priorité absolue à l'expérience d'installation                                 |
|**Fragmentation**          |Forks divergents, protocole divergent, réseau scindé                                            |Protocole **versionné**, politique de compatibilité écrite                     |
|**Versions hétérogènes**   |La norme, pas l'exception (cf. Mastodon)                                                        |Négociation de version, dépréciation annoncée, jamais de rupture silencieuse   |
|**Point de contrôle politique**|L'instance de référence est tenue par une personne                                              |**Plusieurs annuaires possibles**, annuaire remplaçable, politique neutre et écrite|
|**Bus factor**             |Deux développeurs                                                                               |Tout documenter ; c'est précisément l'objet de ces documents                   |
|**Coût et support**        |Chaque hébergeur paie son instance ; le propriétaire de l'annuaire paie le sien                 |Documentation d'auto-assistance, pas de support individuel implicite           |

- - -
## 7\. Décisions ouvertes

1.  **Nom du projet.** « numaps » reste proche de la marque NumWorks. En
    diffusion large, le risque de marque augmente (voir `logiciel-libre.md`).
    Faut-il un nom distinct pour le logiciel, `numaps.nsi.xyz` restant
    l'instance de référence ?
2.  **Niveau par défaut** d'une nouvelle instance : `E1`/`R1` (recommandé) ou
    plus fermé ?
3.  **Annuaire dans le dépôt Git** (§4.2) : confirmé ? Sinon, quel mécanisme
    d'enregistrement ?
4.  **Nombre d'annuaires** supportés par le logiciel : un seul, ou plusieurs
    configurables ?
5.  `protocol_version` : quelle politique de compatibilité ? (tolérance N-1 ?
    N-2 ?)
6.  **R3** : maintenu comme possibilité, ou repoussé hors périmètre pour
    préserver la simplicité juridique du modèle ?
7.  **Clé de signature** : générée à l'installation. Que se passe-t-il en cas de
    perte ? (ré-enrôlement ? nouvelle identité ?)
