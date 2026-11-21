import { CODE_ALPHABET, randomString, requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';

// Tirage de l'ordre. Le code de vérification est tiré ici, côté serveur :
// l'organisateur ne peut ni le choisir ni le prévoir.
export const POST = route(async (request, params) => {
  const user = await requireMember(request);
  const id = v.uuid(params.id, 'Cercle');
  const body = await readJson(request);
  const startsOn = v.date(body.startsOn, 'Date du premier versement');
  const seed = `${randomString(4, CODE_ALPHABET)}-${randomString(4, CODE_ALPHABET)}`;
  await db()`select draw_order(${user.id}, ${id}, ${seed}, ${startsOn}::date)`;
  return json({ ok: true, seed });
});
