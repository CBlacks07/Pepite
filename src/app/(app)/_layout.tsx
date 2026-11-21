import { Redirect, Slot, usePathname, type Href } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { ErrorNotice, PageSkeleton } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useMe } from '@/lib/queries';

// Toutes les pages de ce groupe demandent d'être connecté avec un prénom choisi.
export default function AppLayout() {
  const me = useMe();
  const pathname = usePathname();

  if (me.isPending) return <PageSkeleton />;
  if (me.isError) {
    if (me.error instanceof ApiError && me.error.status === 401) {
      const here = pathname + (typeof window !== 'undefined' ? window.location.search : '');
      const next = here === '/' ? '' : `?next=${encodeURIComponent(here)}`;
      return <Redirect href={`/connexion${next}` as Href} />;
    }
    return (
      <div className="view">
        <ErrorNotice error={me.error} onRetry={() => me.refetch()} />
      </div>
    );
  }
  if (!me.data.displayName) return <Redirect href="/connexion" />;

  return (
    <>
      <Slot />
      <TabBar />
    </>
  );
}
