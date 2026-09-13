import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { healthRouter } from './routes/health';

/**
 * Bindings Cloudflare exposés au Worker (cf. wrangler.json).
 */
export type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
};

export const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Middleware Global CORS (même politique que abc.nsi.xyz)
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
  exposeHeaders: ['Content-Disposition'],
}));

// Montage des sous-routeurs
app.route('/health', healthRouter);

// Sonde de disponibilité à la racine de l'API
app.get('/', (c) => c.json({ service: 'numaps-nsi-xyz', api: 'v1' }));
