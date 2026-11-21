import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { A } from '@/components/A';
import { ChevronLeft, Dices, RotateCw, ShieldCheck, Users } from '@/components/icons';
import { ErrorNotice, FormError, PageSkeleton, Spinner } from '@/components/ui';
import { Wheel } from '@/components/Wheel';
import { addDays, dateLong, dateShort, fcfa, initial, per, todayLome } from '@/lib/format';
import { useIsClient } from '@/lib/hooks';
import { useCircle, useDrawOrder } from '@/lib/queries';

const seenKey = (id: string) => `pepite:seen-draw:${id}`;
function hasSeen(id: string) {
  try {
    return localStorage.getItem(seenKey(id)) === '1';
  } catch {
    return false;
  }
}
function markSeen(id: string) {
  try {
    localStorage.setItem(seenKey(id), '1');
  } catch {}
}

export default function Ordre() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useCircle(id);
  const draw = useDrawOrder(id);
  const [startsOnInput, setStartsOn] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isClient = useIsClient();

  const d = q.data;
  // Ordre fixe des parts de la roue (avant et après le tirage), pour que la roue ne saute pas.
  const wheelMembers = useMemo(() => (d ? [...d.members].sort((a, b) => a.id.localeCompare(b.id)) : []), [d]);
  const drawn = !!d?.circle.drawSeed;
  const startsOn = startsOnInput ?? (d ? addDays(todayLome(), d.circle.frequency === 'weekly' ? 7 : 30) : '');

  // Dès que l'ordre existe : la roue tourne une fois par appareil, puis le résultat s'affiche.
  const showResult = revealed || (isClient && !!d && drawn && hasSeen(d.circle.id));
  const target = isClient && drawn && !showResult ? wheelMembers.findIndex((m) => m.position === 1) : null;

  if (q.isPending) return <PageSkeleton />;
  if (q.error || !d)
    return (
      <div className="view">
        <ErrorNotice error={q.error} onRetry={() => q.refetch()} />
      </div>
    );

  const c = d.circle;
  const full = d.members.length >= c.size;
  const pot = c.amount * c.size;
  const meIndex = wheelMembers.findIndex((m) => m.id === d.me);
  const names = wheelMembers.map((m) => (m.id === d.me ? 'Toi' : m.name));
  const nameOf = (uid: string) => (uid === d.me ? 'Toi' : (d.members.find((m) => m.id === uid)?.name ?? 'Un membre'));
  const firstRound = d.rounds[0];
  const myRound = d.rounds.find((r) => r.beneficiaryId === d.me);

  return (
    <div className="view">
      <A href={`/cercle/${c.id}`} className="back">
        <ChevronLeft strokeWidth={1.9} aria-hidden />
        {c.name}
      </A>
      <h1 className="h-app">Tirage de l'ordre</h1>
      <div className="sub">
        {fcfa(c.amount)} {per(c.frequency)} · {c.size} membres · {fcfa(pot)} par tour
      </div>

      <div className="card online">
        <div className="stack">
          {wheelMembers.slice(0, 8).map((m) => (
            <div key={m.id} className="av">
              {initial(m.name)}
            </div>
          ))}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Users strokeWidth={1.9} aria-hidden />
          <span>
            <b>
              {d.members.length} sur {c.size}
            </b>{' '}
            membres
          </span>
        </span>
      </div>

      <Wheel
        names={names}
        meIndex={meIndex}
        target={target}
        onDone={() => {
          setRevealed(true);
          markSeen(c.id);
        }}
      />

      {!drawn && (
        <>
          <p className="sub center" style={{ margin: '0 0 14px' }}>
            La roue désigne qui reçoit la cagnotte en premier, puis l'ordre complet s'affiche. Le résultat est tiré par le
            serveur avec un code que chacun peut vérifier.
          </p>
          {c.isOrganizer && full ? (
            <div className="card">
              <label className="fl" htmlFor="starts" style={{ marginTop: 0 }}>
                Date limite du premier versement
              </label>
              <input
                id="starts"
                type="date"
                className="input"
                min={todayLome()}
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
              />
              <p className="sub" style={{ margin: '6px 0 0' }}>
                Les tours suivants tombent {c.frequency === 'weekly' ? 'chaque semaine' : 'chaque mois'} à partir de cette
                date.
              </p>
              <FormError error={draw.error} />
              <button
                type="button"
                className="btn"
                style={{ marginTop: 14 }}
                disabled={draw.isPending || !startsOn}
                onClick={() => draw.mutate(startsOn)}
              >
                {draw.isPending ? <Spinner /> : <RotateCw strokeWidth={1.9} aria-hidden />}
                <span>Lancer le tirage</span>
              </button>
            </div>
          ) : (
            <div className="notice">
              <Dices strokeWidth={1.9} aria-hidden />
              <span>
                {full
                  ? "Le cercle est complet. L'organisateur va lancer le tirage."
                  : `Le tirage se lance quand les ${c.size} membres ont rejoint.`}
              </span>
            </div>
          )}
        </>
      )}

      {drawn && !showResult && (
        <button type="button" className="btn" disabled>
          <Spinner />
          <span>Tirage en cours…</span>
        </button>
      )}

      {drawn && showResult && firstRound && (
        <div>
          <div className="first">
            <div className="eyebrow">Résultat du tirage</div>
            <div className="h-app">
              {firstRound.beneficiaryId === d.me ? 'Tu commences' : `${nameOf(firstRound.beneficiaryId)} commence`}
            </div>
            <div className="sub">
              {firstRound.beneficiaryId === d.me
                ? `Tu reçois ${fcfa(pot)} le ${dateLong(firstRound.dueOn)}.`
                : `${nameOf(firstRound.beneficiaryId)} reçoit ${fcfa(pot)} le ${dateLong(firstRound.dueOn)}.` +
                  (myRound ? ` Ton tour : tour ${myRound.number}, le ${dateLong(myRound.dueOn)}.` : '')}
            </div>
          </div>
          <ol className="order">
            {d.rounds.map((r, i) => (
              <li key={r.id} className={r.beneficiaryId === d.me ? 'me' : ''} style={{ animationDelay: `${i * 90}ms` }}>
                <span className="pos num">{r.number}</span>
                <span className="nm">{nameOf(r.beneficiaryId)}</span>
                <span className="sub num">{dateShort(r.dueOn)}</span>
              </li>
            ))}
          </ol>
          <div className="card verify">
            <span className="itile">
              <ShieldCheck strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <div className="sub">Code de vérification</div>
              <div className="code">{c.drawSeed}</div>
              <div className="sub">
                Le serveur a tiré ce code au hasard. Chaque membre est classé selon l'empreinte md5 du code suivi de son
                identifiant{c.newMembersLast ? ', les nouveaux en dernier' : ''}. Avec ce code, tout le monde retrouve
                exactement le même ordre : personne ne peut tricher, pas même l'organisateur.
              </div>
            </div>
          </div>
          <A href={`/cercle/${c.id}`} className="btn ghost" style={{ marginTop: 14 }}>
            Voir le cercle
          </A>
        </div>
      )}
    </div>
  );
}
