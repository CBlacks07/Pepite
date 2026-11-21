import { requireMember } from '@/server/auth';
import { db } from '@/server/db';
import { json, route } from '@/server/http';

export const POST = route(async (request) => {
  const user = await requireMember(request);
  await db()`update reminders set read_at = now() where to_user = ${user.id} and read_at is null`;
  return json({ ok: true });
});
