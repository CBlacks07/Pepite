import { router } from 'expo-router';
import { useState, type FormEvent } from 'react';

import { CalendarDays, CirclePlus, HandCoins, Repeat, Shield, UserPlus } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { FormError, Spinner, Stepper, SwitchRow } from '@/components/ui';
import { fcfa, per } from '@/lib/format';
import { useCreateCircle } from '@/lib/queries';
import type { Frequency } from '@/lib/types';

const MIN = 1_000;
const MAX = 1_000_000;

// Pas du montant : 1 000 jusqu'à 10 000, puis 5 000 jusqu'à 100 000, puis 25 000.
function step(v: number, dir: 1 | -1): number {
  if (dir > 0) return v < 10_000 ? v + 1_000 : v < 100_000 ? v + 5_000 : v + 25_000;
  return v <= 10_000 ? v - 1_000 : v <= 100_000 ? v - 5_000 : v - 25_000;
}

export default function Creer() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(25_000);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [size, setSize] = useState(8);
  const [newLast, setNewLast] = useState(true);
  const [deposit, setDeposit] = useState(false);
  const create = useCreateCircle();
  const toast = useToast();

  const unit = frequency === 'monthly' ? 'mois' : 'semaines';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { name: name.trim(), amount, frequency, size, newMembersLast: newLast, depositRequired: deposit },
      {
        onSuccess: (r) => {
          toast('Cercle créé. Partage le code avec les membres.');
          router.push(`/cercle/${r.id}`);
        },
      },
    );
  };

  return (
    <form className="view" onSubmit={submit}>
      <h1 className="h-app">Nouveau cercle</h1>
      <p className="sub" style={{ margin: '4px 0 0' }}>
        Tu inviteras ensuite les membres avec un code. L'ordre des tours est tiré quand tout le monde est là.
      </p>

      <div className="field">
        <label className="fl" htmlFor="f-name">
          Nom du cercle
        </label>
        <input
          id="f-name"
          className="input"
          maxLength={40}
          autoComplete="off"
          placeholder="Les voisins de Bè"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <span className="fl">Montant par personne</span>
        <Stepper
          label="Montant par personne"
          value={amount}
          display={fcfa(amount)}
          onMinus={() => setAmount((v) => Math.max(MIN, step(v, -1)))}
          onPlus={() => setAmount((v) => Math.min(MAX, step(v, 1)))}
          minDisabled={amount <= MIN}
          maxDisabled={amount >= MAX}
        />
      </div>

      <div className="field">
        <span className="fl">Rythme</span>
        <div className="seg two" role="group" aria-label="Rythme">
          <button type="button" aria-pressed={frequency === 'monthly'} onClick={() => setFrequency('monthly')}>
            <CalendarDays strokeWidth={1.9} aria-hidden />
            Chaque mois
          </button>
          <button type="button" aria-pressed={frequency === 'weekly'} onClick={() => setFrequency('weekly')}>
            <Repeat strokeWidth={1.9} aria-hidden />
            Chaque semaine
          </button>
        </div>
      </div>

      <div className="field">
        <span className="fl">Nombre de membres</span>
        <Stepper
          label="Nombre de membres"
          value={size}
          display={size}
          onMinus={() => setSize((v) => Math.max(3, v - 1))}
          onPlus={() => setSize((v) => Math.min(20, v + 1))}
          minDisabled={size <= 3}
          maxDisabled={size >= 20}
        />
      </div>

      <div className="field">
        <span className="fl">Règles</span>
        <SwitchRow
          id="f-last"
          icon={<UserPlus strokeWidth={1.9} aria-hidden />}
          title="Nouveaux en dernier"
          text="Un membre sans historique reçoit la cagnotte en fin d'ordre."
          checked={newLast}
          onChange={setNewLast}
        />
        <SwitchRow
          id="f-dep"
          icon={<Shield strokeWidth={1.9} aria-hidden />}
          title="Caution d'un versement"
          text="Rendue à chacun à la fin du cercle. À gérer entre vous pour l'instant."
          checked={deposit}
          onChange={setDeposit}
        />
      </div>

      <div className="summary">
        <div className="t">
          <HandCoins strokeWidth={1.9} aria-hidden />
          {fcfa(amount)} {per(frequency)}, {size} membres
        </div>
        <div>
          Chacun verse {fcfa(amount)} {per(frequency)} pendant {size} {unit}, et reçoit{' '}
          <b className="num">{fcfa(amount * size)}</b> une fois. Personne ne perd ce qu'il a versé.
        </div>
        {deposit && <div className="sub">Caution de {fcfa(amount)} par membre, rendue à la fin.</div>}
        {newLast && <div className="sub">Les nouveaux sans historique reçoivent en fin d'ordre.</div>}
      </div>

      <FormError error={create.error} />
      <button className="btn" style={{ marginTop: 14 }} disabled={create.isPending || !name.trim()}>
        {create.isPending ? <Spinner /> : <CirclePlus strokeWidth={1.9} aria-hidden />}
        <span>Créer le cercle</span>
      </button>
    </form>
  );
}
