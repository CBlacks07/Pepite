'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ArrowRight, Copy, KeyRound, LogIn, UserPlus } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { FormError, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { TEXT } from '@/lib/rules';

type Mode = 'new' | 'code';

export function Connexion({ next, initialMode, invited }: { next: string; initialMode: Mode; invited: boolean }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const go = () => {
    router.replace(next);
    router.refresh();
  };

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const signup = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const r = await api<{ user: User; recoveryCode: string }>('/api/auth/signup', { body: { displayName: name } });
      qc.setQueryData(['me'], r.user);
      setRecovery(r.recoveryCode);
    });
  };

  const recover = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const r = await api<{ user: User }>('/api/auth/recover', { body: { code } });
      qc.setQueryData(['me'], r.user);
      go();
    });
  };

  if (recovery) {
    return (
      <div className="card">
        <h2 className="sheet-h">Ton code de secours</h2>
        <p className="sub m-0">
          Note-le dans un endroit sûr. Il te permet de retrouver ton compte sur un autre téléphone, et il ne sera plus
          affiché ensuite. Tu pourras en générer un nouveau depuis ton profil.
        </p>
        <div className="recovery-code">{recovery}</div>
        <div className="btn-row">
          <button type="button" className="btn" onClick={go}>
            <ArrowRight strokeWidth={1.9} aria-hidden />
            J'ai noté mon code
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(recovery);
                toast('Code copié.', Copy);
              } catch {
                toast('Copie impossible : recopie-le à la main.', Copy);
              }
            }}
          >
            <Copy strokeWidth={1.9} aria-hidden />
            Copier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="tabs2" role="group" aria-label="Type de connexion">
        <button type="button" aria-pressed={mode === 'new'} onClick={() => setMode('new')}>
          Je suis nouveau
        </button>
        <button type="button" aria-pressed={mode === 'code'} onClick={() => setMode('code')}>
          J'ai déjà un compte
        </button>
      </div>

      {mode === 'new' ? (
        <form onSubmit={signup}>
          <h2 className="sheet-h">{invited ? 'Crée ton compte pour rejoindre le cercle' : 'Créer mon compte'}</h2>
          <p className="sub m-0">
            Juste ton prénom : c'est ce que verront les membres de tes cercles.
          </p>
          <label className="fl" htmlFor="name">
            Prénom
          </label>
          <input
            id="name"
            className="input"
            autoComplete="given-name"
            maxLength={TEXT.displayNameMax}
            placeholder="Akossiwa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormError error={error} />
          <button className="btn mt-16" disabled={busy || !name.trim()}>
            {busy ? <Spinner /> : <UserPlus strokeWidth={1.9} aria-hidden />}
            <span>Créer mon compte</span>
          </button>
          <p className="sub m-t14">
            En continuant, tu acceptes les <a className="text-link" href="/conditions">conditions d'utilisation</a>.
          </p>
        </form>
      ) : (
        <form onSubmit={recover}>
          <h2 className="sheet-h">Me reconnecter</h2>
          <p className="sub m-0">
            Entre le code de secours affiché lors de ton inscription (8 lettres et chiffres).
          </p>
          <label className="fl" htmlFor="code">
            Code de secours
          </label>
          <input
            id="code"
            className="input big"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={9}
            placeholder="ABCD-EFGH"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
          <FormError error={error} />
          <button className="btn mt-16" disabled={busy || code.replace(/[^A-Z0-9]/g, '').length !== 8}>
            {busy ? <Spinner /> : <LogIn strokeWidth={1.9} aria-hidden />}
            <span>Me reconnecter</span>
          </button>
          <p className="sub m-t14 inline-icon">
            <KeyRound className="icon-sm" strokeWidth={1.9} aria-hidden />
            Code perdu ? Demande à l'équipe Pépite de t'aider.
          </p>
        </form>
      )}
    </div>
  );
}
