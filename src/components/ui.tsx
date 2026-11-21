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
    <span role="status" aria-label={label} style={{ display: 'inline-grid' }}>
      <Loader className="lucide spin" aria-hidden />
    </span>
  );
}

export function PageSkeleton() {
  return (
    <div className="view" aria-busy="true">
      <div className="skel" style={{ height: 44, width: '55%', marginBottom: 18 }} />
      <div className="skel" style={{ height: 170, marginBottom: 12 }} />
      <div className="skel" style={{ height: 70, marginBottom: 26 }} />
      <div className="skel" style={{ height: 96, marginBottom: 10 }} />
      <div className="skel" style={{ height: 96 }} />
    </div>
  );
}

export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <CircleAlert strokeWidth={1.9} aria-hidden />
      <div style={{ flex: 1 }}>
        <div>{errorMessage(error)}</div>
        {onRetry && !(error instanceof ApiError && error.status === 404) && (
          <button type="button" className="linkbtn" style={{ paddingLeft: 0 }} onClick={onRetry}>
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
    <p className="sub" role="alert" style={{ color: 'var(--late)', margin: '10px 0 0' }}>
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
