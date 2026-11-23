import type { ReactNode } from 'react';

import { ApiError, errorMessage } from '@/lib/api';
import type { ContribStatus } from '@/lib/types';

import { Check, CircleAlert, Clock, Hourglass, Loader, Minus, Plus } from './icons';

const STATUS: Record<ContribStatus, { cls: string; label: string; Icon: typeof Check }> = {
  paid: { cls: 'p-paid', label: 'Payé', Icon: Check },
  sent: { cls: 'p-sent', label: 'Reçu à valider', Icon: Hourglass },
  due: { cls: 'p-due', label: 'En attente', Icon: Clock },
};

export function StatusPill({ status, late }: { status: ContribStatus; late?: boolean }) {
  const s = STATUS[status];
  return (
    <span className={`pill ${late && status === 'due' ? 'p-late' : s.cls}`}>
      <s.Icon strokeWidth={2.4} aria-hidden />
      {late && status === 'due' ? 'En retard' : s.label}
    </span>
  );
}

export function Track({ n, done, cur }: { n: number; done: number; cur: number }) {
  return (
    <span className="track" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < done ? 'done' : i === cur ? 'cur' : ''} />
      ))}
    </span>
  );
}

export function Spinner({ label = 'Chargement' }: { label?: string }) {
  return (
    <span className="inline-grid" role="status" aria-label={label}>
      <Loader className="lucide spin" aria-hidden />
    </span>
  );
}

export function PageSkeleton() {
  return (
    <div className="view" aria-busy="true">
      <div className="skel skel-title" />
      <div className="skel skel-hero" />
      <div className="skel skel-bar" />
      <div className="skel skel-card mb-10" />
      <div className="skel skel-card" />
    </div>
  );
}

export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <CircleAlert strokeWidth={1.9} aria-hidden />
      <div className="grow">
        <div>{errorMessage(error)}</div>
        {error instanceof ApiError && error.status === 401 ? (
          <a href="/connexion?mode=code" className="linkbtn pl-0">
            Me reconnecter
          </a>
        ) : null}
        {onRetry && !(error instanceof ApiError && (error.status === 404 || error.status === 401)) && (
          <button type="button" className="linkbtn pl-0" onClick={onRetry}>
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p className="sub text-danger m-t10" role="alert">
      {errorMessage(error)}
    </p>
  );
}

export function Stepper({
  label,
  value,
  display,
  onMinus,
  onPlus,
  minDisabled,
  maxDisabled,
}: {
  label: string;
  value: number;
  display: ReactNode;
  onMinus: () => void;
  onPlus: () => void;
  minDisabled?: boolean;
  maxDisabled?: boolean;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={onMinus} disabled={minDisabled} aria-label={`Diminuer : ${label}`}>
        <Minus strokeWidth={2.4} aria-hidden />
      </button>
      <output className="num" aria-live="polite" data-value={value}>
        {display}
      </output>
      <button type="button" onClick={onPlus} disabled={maxDisabled} aria-label={`Augmenter : ${label}`}>
        <Plus strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}

export function SwitchRow({
  id,
  icon,
  title,
  text,
  checked,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="sw-row" htmlFor={id}>
      <span className="itile sm">{icon}</span>
      <span className="txt">
        <b>{title}</b>
        <span className="sub">{text}</span>
      </span>
      <input type="checkbox" className="sw" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
