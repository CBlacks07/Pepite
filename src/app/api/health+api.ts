import { db } from '@/server/db';
import { json, route } from '@/server/http';

export const GET = route(async () => {
  const [row] = await db()`
    select now() as now,
           (select max(version) from schema_migrations) as schema,
           next_draw_on()::text as next_draw
  `;
  return json({ ok: true, database: 'neon', schema: row.schema, nextDraw: row.next_draw, now: row.now });
});
