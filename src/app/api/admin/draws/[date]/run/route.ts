import { logAdmin } from '@/server/adminLog';
import { CODE_ALPHABET, randomString, requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';

// Lancer le tirage du dimanche. Le code est tiré ici : personne ne peut le choisir.
export const POST = route(async (request, params) => {
  const admin = await requireAdmin(request);
  const drawOn = v.date(params.date, 'Date du tirage');
  const body = await readJson(request);
  const witnesses = v.optionalText(body.note, 'Témoins', 300);
  const seed = `${randomString(4, CODE_ALPHABET)}-${randomString(4, CODE_ALPHABET)}`;
  const [row] = await db()`select run_draw(${admin.id}, ${drawOn}::date, ${seed}) as winners`;
  if (witnesses) await logAdmin(admin.id, 'draw_witnesses', 'draw', drawOn, witnesses);
  return json({ ok: true, seed, winners: row.winners });
});
