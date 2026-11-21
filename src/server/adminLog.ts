import 'server-only';

import { db } from './db';

/** Trace une action d'administration (visible dans le journal de /admin). */
export async function logAdmin(adminId: string, action: string, targetType: string, targetId: string, note?: string | null) {
  await db()`
    insert into admin_actions (admin_id, action, target_type, target_id, note)
    values (${adminId}, ${action}, ${targetType}, ${targetId}, ${note ?? null})
  `;
}

/** Vérifie qu'une date "AAAA-MM-JJ" tombe un dimanche. */
export function isSunday(day: string): boolean {
  return new Date(`${day}T00:00:00Z`).getUTCDay() === 0;
}
