import { router, type Href } from 'expo-router';
import type { AnchorHTMLAttributes, MouseEvent } from 'react';

/** Vrai lien <a> (rendu côté serveur, ouvrable dans un onglet) avec navigation sans rechargement. */
export function A({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    router.push(href as Href);
  }
  return <a href={href} onClick={handle} {...rest} />;
}
