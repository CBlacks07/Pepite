import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';

// Le bénéficiaire confirme avoir reçu l'argent d'un membre.
export const POST = route(async (request, params) => {
  const user = await requireMember(request);
  const roundId = v.uuid(params.id, 'Tour');
  const body = await readJson(request);
  const memberId = v.uuid(body.memberId, 'Membre');
  const [row] = await db()`select validate_contribution(${user.id}, ${roundId}, ${memberId}) as ticket`;
  return json({ ok: true, ticket: row.ticket });
});
