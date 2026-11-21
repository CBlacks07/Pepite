'use client';

// Boutons d'action de l'administration. Chaque action appelle /api/admin/*,
// puis recharge la page serveur (router.refresh) pour afficher l'état à jour.
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';

import { api } from '@/lib/api';
import { fcfa } from '@/lib/format';

import { CircleCheck, Gift, Plus, RotateCw, ShieldAlert, Ticket, UserCheck, UserX, X } from '../icons';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';
import { FormError, Spinner } from '../ui';

function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function run(path: string, body: unknown, done: string, method = 'POST') {
    setBusy(true);
    setError(null);
    try {
      const r = await api<Record<string, unknown>>(path, { method, body });
      toast(done);
      router.refresh();
      return r;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, error, reset: () => setError(null) };
}

/** Bouton + fenêtre de confirmation avec une note obligatoire. */
function ConfirmWithNote({
  trigger,
  title,
  text,
  noteLabel,
  confirmLabel,
  danger,
  onConfirm,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  text: string;
  noteLabel: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (note: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await onConfirm(note.trim());
    setBusy(false);
    if (ok) {
      setOpen(false);
      setNote('');
    }
  };
  return (
    <>
      {trigger(() => setOpen(true))}
      <Sheet open={open} onClose={() => setOpen(false)} label={title}>
        <form onSubmit={submit}>
          <h2 className="sheet-h">{title}</h2>
          <p className="sub" style={{ margin: 0 }}>
            {text}
          </p>
          <label className="fl" htmlFor="admin-note">
            {noteLabel}
          </label>
          <textarea
            id="admin-note"
            className="input"
            rows={3}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
          />
          <button className={`btn${danger ? ' danger' : ''}`} disabled={busy || note.trim().length < 3}>
            {busy ? <Spinner /> : null}
            {confirmLabel}
          </button>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
            Annuler
          </button>
        </form>
      </Sheet>
    </>
  );
}

export function BlockUserButton({ userId, blocked, name }: { userId: string; blocked: boolean; name: string }) {
  const { run, busy, error } = useAction();
  if (blocked) {
    return (
      <div>
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => run(`/api/admin/users/${userId}/block`, { blocked: false }, `Compte de ${name} rétabli.`)}
        >
          {busy ? <Spinner /> : <UserCheck strokeWidth={1.9} aria-hidden />}
          Rétablir le compte
        </button>
        <FormError error={error} />
      </div>
    );
  }
  return (
    <div>
      <ConfirmWithNote
        title={`Suspendre ${name}`}
        text="La personne est déconnectée partout et ne peut plus se reconnecter tant que le compte est suspendu. Ses cercles restent visibles par les autres membres."
        noteLabel="Motif (gardé dans le journal)"
        confirmLabel="Suspendre le compte"
        danger
        trigger={(open) => (
          <button type="button" className="btn ghost danger" onClick={open}>
            <UserX strokeWidth={1.9} aria-hidden />
            Suspendre
          </button>
        )}
        onConfirm={async (reason) =>
          !!(await run(`/api/admin/users/${userId}/block`, { blocked: true, reason }, `Compte de ${name} suspendu.`))
        }
      />
      <FormError error={error} />
    </div>
  );
}

export function FreeTicketButton({ userId, name }: { userId: string; name: string }) {
  const { run, error } = useAction();
  return (
    <div>
      <ConfirmWithNote
        title="Ticket de participation gratuite"
        text={`Ajoute un ticket à ${name} pour le prochain tirage, sans versement (article 5 du règlement). 4 tickets maximum par tirage.`}
        noteLabel="Demande reçue par (message, appel…)"
        confirmLabel="Ajouter le ticket"
        trigger={(open) => (
          <button type="button" className="btn ghost" onClick={open}>
            <Ticket strokeWidth={1.9} aria-hidden />
            Ticket gratuit
          </button>
        )}
        onConfirm={async (note) => !!(await run(`/api/admin/users/${userId}/ticket`, { note }, 'Ticket ajouté.'))}
      />
      <FormError error={error} />
    </div>
  );
}

export function ResolveButtons({
  contributionId,
  status,
  member,
  beneficiary,
  amount,
}: {
  contributionId: string;
  status: 'sent' | 'due';
  member: string;
  beneficiary: string;
  amount: number;
}) {
  const { run, error } = useAction();
  const path = `/api/admin/contributions/${contributionId}/resolve`;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <ConfirmWithNote
        title="Valider ce versement"
        text={`Tu confirmes que ${member} a bien remis ${fcfa(amount)} à ${beneficiary}, à la place de ${beneficiary}. Le versement compte alors dans le bocal.`}
        noteLabel="Preuve vérifiée (référence, échange…)"
        confirmLabel="Valider le versement"
        trigger={(open) => (
          <button type="button" className="linkbtn" onClick={open}>
            <CircleCheck strokeWidth={1.9} aria-hidden />
            Valider
          </button>
        )}
        onConfirm={async (note) => !!(await run(path, { decision: 'paid', note }, 'Versement validé.'))}
      />
      {status === 'sent' && (
        <ConfirmWithNote
          title="Refuser le reçu"
          text={`Le reçu de ${member} est retiré et le versement repasse « en attente ». À utiliser si l'argent n'est jamais arrivé.`}
          noteLabel="Raison"
          confirmLabel="Refuser le reçu"
          danger
          trigger={(open) => (
            <button type="button" className="linkbtn" style={{ color: 'var(--late)' }} onClick={open}>
              <ShieldAlert strokeWidth={1.9} aria-hidden />
              Refuser
            </button>
          )}
          onConfirm={async (note) => !!(await run(path, { decision: 'due', note }, 'Reçu refusé.'))}
        />
      )}
      <FormError error={error} />
    </div>
  );
}

export function DrawSponsorForm({ drawOn, sponsorName, sponsorContact }: { drawOn: string; sponsorName: string | null; sponsorContact: string | null }) {
  const { run, busy, error } = useAction();
  const [name, setName] = useState(sponsorName ?? '');
  const [contact, setContact] = useState(sponsorContact ?? '');
  return (
    <form
      className="form-grid"
      style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto' }}
      onSubmit={(e) => {
        e.preventDefault();
        run('/api/admin/draws', { drawOn, sponsorName: name, sponsorContact: contact }, 'Partenaire enregistré.');
      }}
    >
      <div>
        <label className="fl" htmlFor="sp-name">
          Partenaire de la semaine
        </label>
        <input id="sp-name" className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du partenaire" />
      </div>
      <div>
        <label className="fl" htmlFor="sp-contact">
          Contact (interne)
        </label>
        <input id="sp-contact" className="input" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Personne, téléphone" />
      </div>
      <button className="btn" disabled={busy}>
        {busy ? <Spinner /> : null}
        Enregistrer
      </button>
      <FormError error={error} />
    </form>
  );
}

export function AddPrizeForm({ drawOn }: { drawOn: string }) {
  const { run, busy, error } = useAction();
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('1');
  return (
    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(
          `/api/admin/draws/${drawOn}/prizes`,
          { label, value: Number(value), quantity: Number(quantity) },
          'Lot ajouté.',
        );
        if (ok) {
          setLabel('');
          setValue('');
          setQuantity('1');
        }
      }}
    >
      <div>
        <label className="fl" htmlFor="pz-label">
          Lot
        </label>
        <input id="pz-label" className="input" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Crédit téléphone" required />
      </div>
      <div>
        <label className="fl" htmlFor="pz-value">
          Valeur (F CFA)
        </label>
        <input id="pz-value" className="input" type="number" min={1} step={1} value={value} onChange={(e) => setValue(e.target.value)} placeholder="2000" required />
      </div>
      <div>
        <label className="fl" htmlFor="pz-qty">
          Quantité
        </label>
        <input id="pz-qty" className="input" type="number" min={1} max={1000} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      </div>
      <button className="btn" disabled={busy}>
        {busy ? <Spinner /> : <Plus strokeWidth={1.9} aria-hidden />}
        Ajouter
      </button>
      <FormError error={error} />
    </form>
  );
}

export function DeletePrizeButton({ prizeId }: { prizeId: string }) {
  const { run, busy, error } = useAction();
  return (
    <>
      <button
        type="button"
        className="linkbtn"
        style={{ color: 'var(--late)' }}
        disabled={busy}
        onClick={() => run(`/api/admin/prizes/${prizeId}`, undefined, 'Lot retiré.', 'DELETE')}
        aria-label="Retirer ce lot"
      >
        {busy ? <Spinner /> : <X strokeWidth={1.9} aria-hidden />}
        Retirer
      </button>
      <FormError error={error} />
    </>
  );
}

export function RunDrawButton({ drawOn, tickets }: { drawOn: string; tickets: number }) {
  const { run, error } = useAction();
  return (
    <div>
      <ConfirmWithNote
        title="Lancer le tirage"
        text={`${tickets} ticket(s) en jeu. Le code de vérification est tiré par le serveur et les gagnants sont publiés aussitôt. Cette action ne peut pas être annulée.`}
        noteLabel="Présent(s) lors du tirage (témoin, huissier…)"
        confirmLabel="Lancer le tirage maintenant"
        trigger={(open) => (
          <button type="button" className="btn gold" onClick={open}>
            <RotateCw strokeWidth={1.9} aria-hidden />
            Lancer le tirage
          </button>
        )}
        onConfirm={async (note) => !!(await run(`/api/admin/draws/${drawOn}/run`, { note }, 'Tirage effectué, gagnants publiés.'))}
      />
      <FormError error={error} />
    </div>
  );
}

export function DeliveredButton({ winnerId }: { winnerId: string }) {
  const { run, busy, error } = useAction();
  return (
    <>
      <button
        type="button"
        className="linkbtn"
        disabled={busy}
        onClick={() => run(`/api/admin/winners/${winnerId}/delivered`, {}, 'Lot marqué comme remis.')}
      >
        {busy ? <Spinner /> : <Gift strokeWidth={1.9} aria-hidden />}
        Marquer remis
      </button>
      <FormError error={error} />
    </>
  );
}
