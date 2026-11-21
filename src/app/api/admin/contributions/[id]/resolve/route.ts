import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';

// Litige : valider le versement ('paid') ou refuser le reçu ('due'). Une note est obligatoire.
export const POST = route(async (request, params) => {
  const admin = await requireAdmin(request);
  const contributionId = v.uuid(params.id, 'Versement');
  const body = await readJson(request);
  const decision = v.oneOf(body.decision, 'Décision', ['paid', 'due'] as const);
  const note = v.text(body.note, 'Note', { min: 3, max: 500 });
  const [row] = await db()`select admin_resolve_contribution(${admin.id}, ${contributionId}, ${decision}, ${note}) as ticket`;
  return json({ ok: true, ticket: row.ticket });
});
