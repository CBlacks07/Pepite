import { A } from '@/components/A';
import { CircleAlert } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="view no-tabs">
      <div className="card empty-state" style={{ marginTop: 40 }}>
        <CircleAlert strokeWidth={1.9} aria-hidden />
        <b>Cette page n'existe pas.</b>
        <A href="/" className="btn" style={{ marginTop: 10 }}>
          Retour à l'accueil
        </A>
      </div>
    </div>
  );
}
