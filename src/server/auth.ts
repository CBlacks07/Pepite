// Connexion par téléphone + code à 6 chiffres. La session est un jeton aléatoire
// envoyé dans un cookie HttpOnly ; la base ne garde que son empreinte SHA-256.
import { db } from './db';
import { HttpError } from './http';

export const SESSION_COOKIE = 'pepite_session';
const SESSION_DAYS = 60;

export type SessionUser = { id: string; phone: string; displayName: string | null };

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

/** Tirage uniforme dans un alphabet, avec la source aléatoire cryptographique. */
export function randomString(length: number, alphabet: string): string {
  const limit = 256 - (256 % alphabet.length);
  let out = '';
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const b of bytes) {
      if (b < limit && out.length < length) out += alphabet[b % alphabet.length];
    }
  }
  return out;
}

/** Lettres et chiffres sans confusion possible (pas de 0/O, 1/I/L). */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Numéro au format international. Un numéro à 8 chiffres sans indicatif est
 * considéré comme togolais (+228).
 */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let s = input.replace(/[\s.\-()]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+')) {
    if (/^\d{8}$/.test(s)) s = '+228' + s;
    else return null;
  }
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function isHttps(request: Request): boolean {
  const proto = request.headers.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return new URL(request.url).protocol === 'https:';
}

export async function createSession(userId: string, request: Request): Promise<string> {
  const token = randomString(43, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  const hash = await sha256(token);
  await db()`
    insert into sessions (token_hash, user_id, expires_at)
    values (${hash}, ${userId}, now() + make_interval(days => ${SESSION_DAYS}))
  `;
  const secure = isHttps(request) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

export async function destroySession(request: Request): Promise<string> {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await db()`delete from sessions where token_hash = ${await sha256(token)}`;
  const secure = isHttps(request) ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function getUser(request: Request): Promise<SessionUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  const rows = await db()`
    select u.id, u.phone, u.display_name
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${await sha256(token)} and s.expires_at > now()
  `;
  const u = rows[0];
  return u ? { id: u.id, phone: u.phone, displayName: u.display_name } : null;
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUser(request);
  if (!user) throw new HttpError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
  return user;
}

/** Comme requireUser, mais exige aussi un prénom (fin de l'inscription). */
export async function requireMember(request: Request): Promise<SessionUser & { displayName: string }> {
  const user = await requireUser(request);
  if (!user.displayName) throw new HttpError(403, 'needs_name', "Choisis d'abord ton prénom.");
  return user as SessionUser & { displayName: string };
}
