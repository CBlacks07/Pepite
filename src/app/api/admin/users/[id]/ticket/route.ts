import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';
import { TEXT } from '@/lib/rules';

// Participation gratuite au tirage (article 5 du règlement).
export const POST = route(async (request, params) => {
  const admin = await requireAdmin(request);
  const userId = v.uuid(params.id, 'Membre');
  const body = await readJson(request);
  const note = v.optionalText(body.note, 'Note', TEXT.adminNoteMax);
  const [row] = await db()`select admin_free_ticket(${admin.id}, ${userId}, ${note}) as number`;
  return json({ ok: true, number: row.number });
});
