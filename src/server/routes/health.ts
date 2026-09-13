import { Hono } from 'hono';
import type { Bindings } from '../app';

export const healthRouter = new Hono<{ Bindings: Bindings }>();

/**
 * Sonde de santé : vérifie que le Worker répond ET que la base D1 est joignable.
 * Utilisée pour la validation post-déploiement.
 */
healthRouter.get('/', async (c) => {
  let d1 = 'indisponible';
  try {
    const row = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    d1 = row?.ok === 1 ? 'ok' : 'reponse-inattendue';
  } catch (error) {
    d1 = `erreur: ${(error as Error).message}`;
  }

  return c.json({
    status: 'ok',
    service: 'numaps-nsi-xyz',
    d1,
    timestamp: new Date().toISOString(),
  });
});
