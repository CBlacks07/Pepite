import { redirect } from 'next/navigation';

import { currentUser } from '@/server/auth';

// Lien d'invitation partagé : /rejoindre?code=XXXXXX.
// Connecté : direction le formulaire ; sinon, inscription d'abord, puis retour ici.
export default async function InviteLink({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const { code } = await searchParams;
  const clean = typeof code === 'string' ? code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) : '';
  const target = `/app/rejoindre${clean ? `?code=${clean}` : ''}`;
  const user = await currentUser();
  if (user?.displayName) redirect(target);
  redirect(`/connexion?next=${encodeURIComponent(target)}`);
}
