import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/AppShell';
import { currentUser } from '@/server/auth';

// Espace membre : la session est vérifiée côté serveur avant tout affichage.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user || !user.displayName) redirect('/connexion');
  return <AppShell user={{ displayName: user.displayName, isAdmin: user.isAdmin }}>{children}</AppShell>;
}
