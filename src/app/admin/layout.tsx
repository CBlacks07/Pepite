import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminPage } from '@/server/admin';

export const metadata: Metadata = { title: { default: 'Administration', template: '%s · Admin Pépite' }, robots: { index: false } };

// Réservé aux comptes is_admin : les autres reçoivent une page 404.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell name={admin.displayName ?? 'Admin'}>{children}</AdminShell>;
}
