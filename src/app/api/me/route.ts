import { requireUser } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, route, v } from '@/server/http';
import { TEXT } from '@/lib/rules';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return json({ user });
});

export const PATCH = route(async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  const name = v.text(body.displayName, 'Prénom', { max: TEXT.displayNameMax });
  await db()`update users set display_name = ${name} where id = ${user.id}`;
  return json({ user: { ...user, displayName: name } });
});
