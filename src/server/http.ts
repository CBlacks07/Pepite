import 'server-only';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Erreurs levées par les fonctions SQL ("pepite:<code>") -> réponse HTTP lisible.
const DB_ERRORS: Record<string, [number, string]> = {
  invalid_code: [404, "Ce code d'invitation n'existe pas."],
  circle_started: [409, 'Ce cercle a déjà commencé.'],
  circle_full: [409, 'Ce cercle est complet.'],
  not_found: [404, 'Introuvable.'],
  not_organizer: [403, "Seul l'organisateur peut lancer le tirage."],
  already_drawn: [409, "L'ordre a déjà été tiré."],
  circle_not_full: [409, "Le cercle n'est pas encore complet."],
  bad_start: [400, "La date du premier versement doit être aujourd'hui ou plus tard."],
  not_member: [403, 'Tu ne fais pas partie de ce cercle.'],
  own_round: [400, "C'est ton tour : tu n'as rien à te verser."],
  already_paid: [409, 'Ce versement est déjà validé.'],
  not_beneficiary: [403, 'Seul le bénéficiaire du tour valide les versements.'],
  not_due: [409, "Ce membre n'a rien en attente."],
  already_reminded: [429, 'Tu lui as déjà envoyé un rappel dans les dernières 24 h.'],
  bad_request: [400, 'Requête invalide.'],
  not_admin: [403, "Accès réservé à l'administration."],
  note_required: [400, 'Ajoute une note pour expliquer la décision.'],
  draw_done: [409, 'Ce tirage a déjà eu lieu.'],
  draw_too_early: [409, 'Le tirage ne peut pas avoir lieu avant dimanche 20 h (heure de Lomé).'],
  no_prizes: [409, "Ajoute au moins un lot avant de lancer le tirage."],
  max_tickets: [409, 'Cette personne a déjà 4 tickets pour ce tirage.'],
};

export function json(data: unknown, status = 200, extra?: Record<string, string>): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  for (const [k, v] of Object.entries(extra ?? {})) headers.append(k, v);
  return Response.json(data, { status, headers });
}

function toResponse(err: unknown): Response {
  if (err instanceof HttpError) return json({ error: err.message, code: err.code }, err.status);
  const message = err instanceof Error ? err.message : String(err);
  const m = /pepite:([a-z_]+)/.exec(message);
  if (m && DB_ERRORS[m[1]]) {
    const [status, text] = DB_ERRORS[m[1]];
    return json({ error: text, code: m[1] }, status);
  }
  console.error('[api]', err);
  return json({ error: 'Erreur du serveur. Réessaie dans un instant.', code: 'server_error' }, 500);
}

type Params = Record<string, string>;
type Handler = (request: Request, params: Params) => Promise<Response>;
// Next.js 16 : les paramètres de route arrivent dans une promesse.
type RouteContext = { params: Promise<Params> };

/** Enveloppe une route Next.js : attend les paramètres et transforme les erreurs en JSON propre. */
export function route(fn: Handler) {
  return async (request: Request, ctx: RouteContext): Promise<Response> => {
    try {
      return await fn(request, (await ctx?.params) ?? {});
    } catch (err) {
      return toResponse(err);
    }
  };
}

/**
 * Lit un corps JSON. Exiger application/json bloque aussi les formulaires
 * envoyés depuis un autre site (protection CSRF avec le cookie SameSite=Lax).
 */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    throw new HttpError(415, 'bad_content_type', 'Envoie les données en JSON.');
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'bad_json', 'JSON invalide.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'bad_json', 'JSON invalide.');
  }
  return body as Record<string, unknown>;
}

const bad = (message: string) => new HttpError(400, 'invalid', message);

export const v = {
  text(value: unknown, field: string, { min = 1, max = 200 } = {}): string {
    if (typeof value !== 'string') throw bad(`${field} manquant.`);
    const s = value.trim();
    if (s.length < min || s.length > max) throw bad(`${field} : entre ${min} et ${max} caractères.`);
    return s;
  },
  optionalText(value: unknown, field: string, max = 200): string | null {
    if (value === undefined || value === null || value === '') return null;
    return v.text(value, field, { min: 0, max });
  },
  int(value: unknown, field: string, min: number, max: number): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
      throw bad(`${field} : nombre entier entre ${min} et ${max}.`);
    }
    return value;
  },
  bool(value: unknown, field: string): boolean {
    if (typeof value !== 'boolean') throw bad(`${field} : vrai ou faux.`);
    return value;
  },
  oneOf<T extends string>(value: unknown, field: string, options: readonly T[]): T {
    if (typeof value !== 'string' || !options.includes(value as T)) throw bad(`${field} invalide.`);
    return value as T;
  },
  uuid(value: unknown, field: string): string {
    if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw bad(`${field} invalide.`);
    return value;
  },
  date(value: unknown, field: string): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      throw bad(`${field} : date au format AAAA-MM-JJ.`);
    }
    return value;
  },
};
