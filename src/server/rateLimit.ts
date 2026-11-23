// Limitation de débit par adresse IP, comptée en base (fonction SQL rate_limit,
// migration 005) pour tenir sur toutes les instances de l'appli.
import 'server-only';

import { RATE_LIMITS } from '@/lib/rules';

import { sha256 } from './auth';
import { db } from './db';
import { HttpError } from './http';

type Bucket = keyof typeof RATE_LIMITS;

/**
 * Adresse du client. Sur Vercel, x-real-ip et x-vercel-forwarded-for sont posés par
 * la plateforme et ne peuvent pas être imposés par le client.
 */
function clientIp(request: Request): string {
  const h = request.headers;
  const direct = h.get('x-vercel-forwarded-for') ?? h.get('x-real-ip');
  if (direct) return direct.split(',')[0].trim();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'local';
}

// Fonction ou table absente : migration 005 pas encore appliquée.
const MISSING = new Set(['42883', '42P01']);

async function count(bucket: Bucket, request: Request, increment: boolean): Promise<number> {
  const { windowSeconds } = RATE_LIMITS[bucket];
  const key = await sha256(`ip:${clientIp(request)}`);
  try {
    const [row] = await db()`select rate_limit(${bucket}, ${key}, ${windowSeconds}, ${increment}) as n`;
    return row.n as number;
  } catch (err) {
    if (MISSING.has((err as { code?: string }).code ?? '')) {
      // On laisse passer plutôt que de bloquer toutes les inscriptions.
      console.error('[rate-limit] migration 005 non appliquée : lance npm run db:migrate');
      return 0;
    }
    throw err;
  }
}

const tooMany = () => new HttpError(429, 'rate_limited', 'Trop de tentatives depuis cette connexion. Réessaie dans un moment.');

/** Compte cet essai et refuse au-delà de la limite. */
export async function hitLimit(bucket: Bucket, request: Request): Promise<void> {
  if ((await count(bucket, request, true)) > RATE_LIMITS[bucket].max) throw tooMany();
}

/** Refuse si la limite est déjà atteinte, sans compter cet essai. */
export async function checkLimit(bucket: Bucket, request: Request): Promise<void> {
  if ((await count(bucket, request, false)) >= RATE_LIMITS[bucket].max) throw tooMany();
}

/** Compte un échec (à appeler seulement quand l'essai a échoué). */
export async function recordFailure(bucket: Bucket, request: Request): Promise<void> {
  await count(bucket, request, true);
}
