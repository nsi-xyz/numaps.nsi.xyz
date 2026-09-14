# Cache, statique et coût — garantir « zéro Worker, zéro D1 » en lecture

> **Version :** 1.0
> **Statut :** architecture de référence pour la phase P0 (outil mono-utilisateur).

---

## 1. L'exigence

> « Le même site demandé 10 000 fois ne doit solliciter **ni le Worker, ni D1**. »

C'est une exigence de **coût** autant que de **résistance** : elle neutralise à la fois la
facture et le DDoS applicatif.

---

## 2. Le fait qui rend l'exigence atteignable

> « Requests to static assets are **free and unlimited**. Requests to the Worker script
> (for example, in the case of SSR content) are **billed** according to Workers pricing. »
> — [Cloudflare, *Static assets — Billing and limitations*](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

Traduction : **un fichier servi par les Assets ne coûte rien et n'invoque pas le Worker ;
une réponse SSR coûte une invocation.** Toute l'architecture se résume donc à une question :
*qu'est-ce qui est servi comme fichier, et qu'est-ce qui est calculé ?*

---

## 3. ⚠️ La confusion à éviter absolument

« **Mis en cache** » et « **n'invoque pas le Worker** » sont **deux choses différentes**.

| Mécanisme | Le Worker est-il invoqué ? | Répond à l'exigence ? |
|---|---|---|
| **Asset statique** (fichier dans `dist/`) | ❌ **Non** — servi par la couche Assets | ✅ **Oui** |
| **Cache API** (`caches.default`) *dans* le Worker | ✅ **Oui, à chaque requête** — le Worker s'exécute pour consulter le cache | ❌ **Non** |
| **Cache Rule** sur une route servie par le CDN, hors Worker | ❌ Non | ✅ Oui |
| **R2 public + domaine personnalisé** | ❌ Non — servi par R2/CDN | ✅ Oui |
| **D1** | ✅ Oui | ❌ Non |

> 🔴 **Le piège classique :** croire qu'utiliser `caches.default` dans le Worker « évite de
> solliciter le Worker ». C'est faux : la requête entre par la route du Worker, donc **le
> Worker s'exécute systématiquement**. Le cache ne réduit alors que les appels à D1, pas les
> invocations. Pour satisfaire l'exigence, il faut que la réponse **ne passe pas par le Worker**.

---

## 4. Principe directeur : séparer radicalement lecture et écriture

```
   ┌───────────────────────── LECTURE (10 000 fois) ─────────────────────────┐
   │  Coquille applicative  →  assets statiques      →  0 Worker, 0 D1       │
   │  Données partagées     →  snapshot statique/R2  →  0 Worker, 0 D1       │
   │  Cache navigateur      →  localStorage / IndexedDB                      │
   └─────────────────────────────────────────────────────────────────────────┘

   ┌───────────────────────── ÉCRITURE (rare) ───────────────────────────────┐
   │  Édition / sauvegarde  →  Worker + D1  →  authentifié, quota, journal   │
   └─────────────────────────────────────────────────────────────────────────┘
```

**Règle d'or :** *si une réponse est demandée 10 000 fois, c'est qu'elle n'est pas
personnalisée — donc elle doit être un fichier.* Une réponse personnalisée ne doit **jamais**
être servie depuis un cache partagé.

---

## 5. Architecture cible en quatre couches

| Couche | Contenu | Mécanisme | Coût |
|---|---|---|---|
| **0. Assets statiques** | HTML pré-rendu, CSS, JS, polices, icônes, `catalogue.json` | Workers Assets | **Gratuit, illimité** |
| **1. Snapshot de données** | Les scripts et métadonnées, en JSON | R2 public **ou** asset régénéré | Quasi nul |
| **2. Cache navigateur** | Copie locale de travail | `localStorage` / `IndexedDB` (+ service worker optionnel) | Nul |
| **3. D1** | Source de vérité, écritures | **Uniquement** sur action authentifiée | Facturé |

---

## 6. Le point d'architecture à trancher : le snapshot de données

Puisque les données vivent en D1 mais doivent être lues sans D1, il faut une **projection**.

| Option | Fonctionnement | Mise à jour | Avantages | Inconvénients |
|---|---|---|---|---|
| **A. Rebuild déclenché** | À chaque écriture, on régénère le JSON dans `dist/` via un rebuild GitHub Actions | 1–3 min | **Gratuit**, illimité, aucune pièce mobile, tout est versionné | Latence ; un rebuild par modification |
| **B. R2 public + domaine** | Le Worker écrit le JSON dans R2 ; servi directement par un domaine dédié | **Instantanée** | Rapide, pas de rebuild, pas de Worker en lecture | ⚠️ **Données publiques** : inadapté à des scripts privés |
| **C. R2 privé + URL présignée** | Une URL signée est délivrée à l'ouverture de session, puis le client lit R2 directement | Selon TTL de l'URL | **0 Worker en lecture** et données non publiques | URL = secret à durée limitée ; complexité |
| **D. Cache API dans le Worker** | ❌ | — | — | **N'invoque pas… non : invoque le Worker.** Écarté. |

### Recommandation pour la phase P0 (mono-utilisateur)

**Option A — rebuild déclenché**, complétée par le cache navigateur.

Raisons : c'est la seule option **gratuite, sans pièce mobile et sans risque de fuite**, et
la latence de 1–3 minutes est parfaitement acceptable pour un outil personnel où l'on écrit
peu et où l'on relit beaucoup. Le cache navigateur (couche 2) absorbe la quasi-totalité des
relectures, et le rebuild ne sert qu'à propager les changements.

L'option **C** devient pertinente si l'édition devient fréquente et la latence gênante.
L'option **B** est à écarter tant que des données privées existent.

---

## 7. ⚠️ Le piège de configuration à ne jamais activer

> « **Important note for free tier users**: When using `run_worker_first`, requests matching
> the specified patterns will **always invoke your Worker script**. If you exceed your free
> tier request limits, these requests will receive a **429** (Too Many Requests) response
> instead of falling back to static asset serving. »
> — [Cloudflare, *Static assets — Billing and limitations*](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

Avec `run_worker_first` sur un motif large, **toutes** les requêtes publiques invoquent le
Worker : on perd le bénéfice du statique, on consomme le quota, et au-delà on sert des `429`
**au lieu de** retomber sur les fichiers. À réserver à des chemins précis (API), jamais à `/*`.

---

## 8. Cache navigateur : ce que ça apporte vraiment

| Niveau | Technologie | Effet |
|---|---|---|
| Mémoire (session) | Variables JS | Instantané, perdu au rechargement |
| Persistant | `localStorage` | Survit au rechargement ; ~5 Mo ; synchrone |
| Structuré | `IndexedDB` | Volume important, asynchrone, adapté aux scripts |
| Hors-ligne | Service Worker + Cache Storage | **Répond sans aucune requête réseau** |
| Hors-ligne « zéro coût » | Service Worker avec stratégie *cache-first* | Le serveur n'est **jamais** sollicité lors d'une relecture |

Avec un service worker en *cache-first* sur la coquille et les données, une relecture
identique ne génère **aucune requête réseau** : ni Worker, ni D1, ni même le CDN.

> ⚠️ **Prérequis technique :** le service worker exige **HTTPS** (acquis) et une stratégie
> d'invalidation propre, sinon l'utilisateur reste bloqué sur une version ancienne.
> Prévoir un **numéro de version** et une purge explicite à chaque déploiement.

---

## 9. Invalidation : le vrai point délicat

Un cache qui ne s'invalide pas propage des données fausses. Trois mécanismes complémentaires :

1. **Nommage par empreinte** : `catalogue.<hash>.json` — un nouveau contenu = une nouvelle
   URL, donc **aucun cache à purger**. C'est la méthode la plus robuste.
2. **Purge explicite** : à chaque écriture, purge de l'URL concernée (Cloudflare Cache API /
   purge par tag) **et** envoi d'un signal au service worker pour qu'il mette à jour.
3. **Version d'application** : un `version.json` interrogé par le client pour détecter un
   nouveau déploiement et déclencher la mise à jour du service worker.

---

## 10. Comment **prouver** que l'exigence est tenue

L'architecture doit être vérifiable, pas supposée :

| Vérification | Où | Attendu |
|---|---|---|
| Nombre d'invocations du Worker | Cloudflare → Workers → Metrics | **Plat** sous une charge de lecture |
| Nombre de lignes lues D1 | Cloudflare → D1 → Metrics | **0** en lecture seule |
| En-tête `cf-cache-status` | `curl -I` | `HIT` sur les contenus statiques |
| Statut du service worker | DevTools → Application | `activated`, réponses servies depuis le cache |
| Test de charge | `curl` en boucle / `ab` | Aucune variation du compteur Worker |

Un test de charge simple sera ajouté à la CI de contrôle : marteler une URL publique et
vérifier que les métriques Worker/D1 restent stables.

---

## 11. Synthèse

| Question | Réponse |
|---|---|
| Qu'est-ce qui ne doit **jamais** passer par le Worker ? | Toute page ou donnée publique demandée en masse |
| Qu'est-ce qui passe par le Worker ? | Les écritures authentifiées, et rien d'autre si possible |
| Comment le garantir ? | **Assets statiques** + snapshot + cache navigateur |
| Comment le vérifier ? | Métriques Workers/D1 + `cf-cache-status` |
| Quel piège éviter ? | `run_worker_first` large, et croire que `caches.default` évite l'invocation |
