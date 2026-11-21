import Link from 'next/link';

import { CircleAlert } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="wrap" style={{ maxWidth: 560, padding: '80px 18px' }}>
      <div className="card empty-state">
        <CircleAlert strokeWidth={1.9} aria-hidden />
        <b>Cette page n'existe pas.</b>
        <span className="sub">Le lien est peut-être incomplet, ou la page a été déplacée.</span>
        <Link href="/" className="btn" style={{ marginTop: 10 }}>
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
