import { useSyncExternalStore } from 'react';

const never = () => () => {};

/** false au rendu serveur et à l'hydratation, true ensuite dans le navigateur. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}

/** Heure courante arrondie à l'intervalle (stable entre deux rendus) ; null côté serveur. */
export function useNow(intervalMs = 30_000): number | null {
  return useSyncExternalStore(
    (notify) => {
      const t = setInterval(notify, intervalMs);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
}
