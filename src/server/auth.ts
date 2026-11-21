// Comptes et sessions. Pour l'instant l'inscription se fait avec un prénom seul
// (pas encore de service SMS) ; un code de secours permet de retrouver son compte
// sur un autre appareil. La session est un jeton aléatoire dans un cookie HttpOnly ;
// la base ne garde que son empreinte SHA-256.
import 'server-only';

import { cookies } from 'next/headers';

import { db } from './db';
import { HttpError } from './http';

export const SESSION_COOKIE = 'pepite_session';
const SESSION_DAYS = 365;

export type SessionUser = { id: string; displayName: string | null; isAdmin: boolean };

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

/** Code de secours « ABCD-EFGH ». */
export function newRecoveryCode(): string {
  return `${randomString(4, CODE_ALPHABET)}-${randomString(4, CODE_ALPHABET)}`;
}

/** Accepte « abcd efgh », « ABCDEFGH »… et renvoie « ABCD-EFGH », ou null. */
export function normalizeRecoveryCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length !== 8 || [...s].some((ch) => !CODE_ALPHABET.includes(ch))) return null;
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export const recoveryHash = (code: string) => sha256(`recovery:${code}`);

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
  await db()`
    insert into sessions (token_hash, user_id, expires_at)
    values (${await sha256(token)}, ${userId}, now() + make_interval(days => ${SESSION_DAYS}))
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

async function userFromToken(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token || token.length > 100) return null;
  const rows = await db()`
    select u.id, u.display_name, u.is_admin
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${await sha256(token)} and s.expires_at > now() and u.blocked_at is null
  `;
  const u = rows[0];
  return u ? { id: u.id, displayName: u.display_name, isAdmin: u.is_admin } : null;
}

/** Utilisateur de la requête (routes d'API). */
export function getUser(request: Request): Promise<SessionUser | null> {
  return userFromToken(readCookie(request, SESSION_COOKIE));
}

/** Utilisateur courant (pages serveur), lu dans les cookies de Next.js. */
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return userFromToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUser(request);
  if (!user) throw new HttpError(401, 'unauthenticated', 'Connecte-toi pour continuer.');
  return user;
}

/** Comme requireUser, mais exige aussi un prénom. */
export async function requireMember(request: Request): Promise<SessionUser & { displayName: string }> {
  const user = await requireUser(request);
  if (!user.displayName) throw new HttpError(403, 'needs_name', "Choisis d'abord ton prénom.");
  return user as SessionUser & { displayName: string };
}

export async function requireAdmin(request: Request): Promise<SessionUser> {
  const user = await requireUser(request);
  if (!user.isAdmin) throw new HttpError(403, 'not_admin', "Accès réservé à l'administration.");
  return user;
}
