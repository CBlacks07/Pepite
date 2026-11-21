import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState, type FormEvent } from 'react';

import { ArrowRight, Info, KeyRound, Smartphone } from '@/components/icons';
import { FormError, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/queries';
import type { User } from '@/lib/types';

type Step = 'phone' | 'code' | 'name';

function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export default function Connexion() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);
  const me = useMe();
  const qc = useQueryClient();

  const [stepState, setStep] = useState<Step>('phone');
  // Connecté mais sans prénom : on reprend directement à l'étape du prénom.
  const step: Step = me.data && !me.data.displayName ? 'name' : stepState;
  const [phone, setPhone] = useState('');
  const [normalized, setNormalized] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Déjà connecté avec un prénom : direction l'appli.
  useEffect(() => {
    if (me.data?.displayName) router.replace(next as Href);
  }, [me.data, next]);

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

  const requestCode = (e?: FormEvent) => {
    e?.preventDefault();
    const full = /^\s*(\+|00)/.test(phone) ? phone : '+228' + phone.replace(/\D/g, '');
    return run(async () => {
      const r = await api<{ phone: string; devCode?: string }>('/api/auth/request-otp', { body: { phone: full } });
      setNormalized(r.phone);
      setDevCode(r.devCode ?? null);
      setCode('');
      setStep('code');
    });
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const r = await api<{ user: User }>('/api/auth/verify-otp', { body: { phone: normalized, code } });
      qc.setQueryData(['me'], r.user);
      if (r.user.displayName) router.replace(next as Href);
      else setStep('name');
    });
  };

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const r = await api<{ user: User }>('/api/me', { method: 'PATCH', body: { displayName: name } });
      qc.setQueryData(['me'], r.user);
      router.replace(next as Href);
    });
  };

  return (
    <div className="view no-tabs">
      <h1 className="brand-h">
        P<span className="e">é</span>pite
      </h1>
      <p className="lede">
        La tontine entre proches, avec un tirage bonus le dimanche. Chacun reçoit la cagnotte à son tour, et chaque
        versement fait à l'heure rapporte un ticket.
      </p>

      {step === 'phone' && (
        <form className="card" onSubmit={requestCode}>
          <h2 className="sheet-h">Connexion</h2>
          <p className="sub" style={{ margin: 0 }}>
            On t'envoie un code par SMS. Pas de mot de passe à retenir.
          </p>
          <label className="fl" htmlFor="phone">
            Ton numéro de téléphone
          </label>
          <div className="phone-in">
            {!/^\s*(\+|00)/.test(phone) && <span className="cc-code">+228</span>}
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="90 12 34 56"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <p className="sub" style={{ margin: '8px 0 0' }}>
            Hors du Togo, écris le numéro complet avec l'indicatif, par exemple +229 97 12 34 56.
          </p>
          <FormError error={error} />
          <button className="btn" style={{ marginTop: 16 }} disabled={busy || phone.replace(/\D/g, '').length < 8}>
            {busy ? <Spinner /> : <Smartphone strokeWidth={1.9} aria-hidden />}
            <span>Recevoir le code</span>
          </button>
        </form>
      )}

      {step === 'code' && (
        <form className="card" onSubmit={verify}>
          <h2 className="sheet-h">Entre le code</h2>
          <p className="sub" style={{ margin: 0 }}>
            Envoyé au {normalized}. Il reste valable 10 minutes.
          </p>
          {devCode && (
            <div className="notice" style={{ marginTop: 12 }}>
              <Info strokeWidth={1.9} aria-hidden />
              <span>
                Mode test : aucun SMS n'est envoyé. Ton code est <b className="num">{devCode}</b>.
              </span>
            </div>
          )}
          <label className="fl" htmlFor="code">
            Code à 6 chiffres
          </label>
          <input
            id="code"
            className="input big num"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
          <FormError error={error} />
          <button className="btn" style={{ marginTop: 16 }} disabled={busy || code.length !== 6}>
            {busy ? <Spinner /> : <KeyRound strokeWidth={1.9} aria-hidden />}
            <span>Me connecter</span>
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button type="button" className="linkbtn" onClick={() => setStep('phone')}>
              Changer de numéro
            </button>
            <button type="button" className="linkbtn" onClick={() => requestCode()} disabled={busy}>
              Renvoyer le code
            </button>
          </div>
        </form>
      )}

      {step === 'name' && (
        <form className="card" onSubmit={saveName}>
          <h2 className="sheet-h">Comment tes proches t'appellent ?</h2>
          <p className="sub" style={{ margin: 0 }}>
            C'est ce que verront les membres de tes cercles.
          </p>
          <label className="fl" htmlFor="name">
            Prénom
          </label>
          <input
            id="name"
            className="input"
            autoComplete="given-name"
            maxLength={40}
            placeholder="Akossiwa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormError error={error} />
          <button className="btn" style={{ marginTop: 16 }} disabled={busy || !name.trim()}>
            {busy ? <Spinner /> : <ArrowRight strokeWidth={1.9} aria-hidden />}
            <span>Continuer</span>
          </button>
        </form>
      )}
    </div>
  );
}
