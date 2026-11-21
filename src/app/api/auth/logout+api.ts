import { destroySession } from '@/server/auth';
import { json, route } from '@/server/http';

export const POST = route(async (request) => {
  const cookie = await destroySession(request);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
});
