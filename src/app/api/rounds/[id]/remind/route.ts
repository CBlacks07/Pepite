import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';

// Rappel privé à un membre qui n'a pas encore payé.
export const POST = route(async (request, params) => {
  const user = await requireMember(request);
  const roundId = v.uuid(params.id, 'Tour');
  const body = await readJson(request);
  const memberId = v.uuid(body.memberId, 'Membre');
  const message = v.text(body.message, 'Message', { max: 500 });
  await db()`select send_reminder(${user.id}, ${roundId}, ${memberId}, ${message})`;
  return json({ ok: true });
});
