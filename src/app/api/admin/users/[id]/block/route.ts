import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';
import { TEXT } from '@/lib/rules';

// Suspendre (blocked: true, avec un motif) ou rétablir (blocked: false) un compte.
export const POST = route(async (request, params) => {
  const admin = await requireAdmin(request);
  const userId = v.uuid(params.id, 'Membre');
  const body = await readJson(request);
  const blocked = v.bool(body.blocked, 'Suspension');
  const reason = blocked ? v.text(body.reason, 'Motif', { min: TEXT.adminNoteMin, max: TEXT.adminNoteMax }) : null;
  await db()`select admin_set_blocked(${admin.id}, ${userId}, ${blocked}, ${reason})`;
  return json({ ok: true });
});
