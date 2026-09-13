-- =====================================================
-- numaps.nsi.xyz — Schéma de la base D1
-- Appliqué par : npm run d1:init:remote
-- =====================================================
--
-- NB : ce schéma sera complété lors de la spécification
-- fonctionnelle du gestionnaire de scripts. Il ne contient
-- pour l'instant que la table de suivi de version.

CREATE TABLE IF NOT EXISTS schema_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('schema_version', '1');
