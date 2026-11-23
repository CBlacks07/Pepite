import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';
import { CIRCLE } from '@/lib/rules';

export const POST = route(async (request) => {
  const user = await requireMember(request);
  const body = await readJson(request);
  const code = v.text(body.code, "Code d'invitation", { min: CIRCLE.inviteCodeLength, max: CIRCLE.inviteCodeLength * 2 }).replace(/[\s-]/g, '').toUpperCase();
  const [row] = await db()`select join_circle(${user.id}, ${code}) as id`;
  return json({ id: row.id });
});
