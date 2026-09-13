import type { APIRoute } from 'astro';
import { app } from '../../server/app';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  const runtime = context.locals.runtime;
  const env = runtime?.env || (process.env as any) || {};
  const ctx = runtime?.ctx;

  return app.fetch(context.request, env, ctx);
};
