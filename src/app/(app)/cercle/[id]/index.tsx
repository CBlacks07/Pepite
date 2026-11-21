import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { A } from '@/components/A';
import {
  Banknote,
  BellRing,
  CalendarClock,
  ChevronLeft,
  CircleCheck,
  Copy,
  Dices,
  HandCoins,
  Hourglass,
  Landmark,
  Lock,
  Receipt,
  Send,
  Share,
  Shield,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Users,
  Wallet,
  BadgeCheck,
  Check,
  Clock,
} from '@/components/icons';
import { JarRing, type RingMember } from '@/components/JarRing';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { ErrorNotice, FormError, PageSkeleton, Spinner, StatusPill } from '@/components/ui';
import { dateLong, dateShort, fcfa, initial, per } from '@/lib/format';
import { useIsClient } from '@/lib/hooks';
import { useCircle, useDeclare, useRemind, useValidate } from '@/lib/queries';
import type { CircleData, Method } from '@/lib/types';

type PayTarget = { roundId: string; number: number; beneficiary: string; dueOn: string };
type RemindTarget = { roundId: string; memberId: string; name: string; beneficiary: string; dueOn: string; iAmBeneficiary: boolean };

const METHODS: { id: Method; label: string; Icon: typeof Smartphone }[] = [
  { id: 'mobile_money', label: 'Mobile money', Icon: Smartphone },
  { id: 'bank_transfer', label: 'Virement', Icon: Landmark },
  { id: 'cash', label: 'Espèces', Icon: Banknote },
];
const METHOD_LABEL: Record<Method, string> = { mobile_money: 'Mobile money', bank_transfer: 'Virement', cash: 'Espèces' };

export default function Cercle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useCircle(id);

  if (q.isPending) return <PageSkeleton />;
  if (q.isError)
    return (
      <div className="view">
        <A href="/" className="back">
          <ChevronLeft strokeWidth={1.9} aria-hidden />
          Accueil
        </A>
        <ErrorNotice error={q.error} onRetry={() => q.refetch()} />
      </div>
    );

  const d = q.data;
  return (
    <div className="view">
      <A href="/" className="back">
        <ChevronLeft strokeWidth={1.9} aria-hidden />
        Accueil
      </A>
      <h1 className="h-app">{d.circle.name}</h1>
      <div className="sub">
        {fcfa(d.circle.amount)} {per(d.circle.frequency)} · {d.circle.size} membres
        {d.current ? ` · tour ${d.current.number} sur ${d.circle.size}` : ''}
      </div>
      {d.circle.status === 'forming' ? <Forming d={d} /> : <Active d={d} />}
      <Rules d={d} />
    </div>
  );
}

/* ---------- Cercle en formation : invitation ---------- */

function Forming({ d }: { d: CircleData }) {
  const toast = useToast();
  const isClient = useIsClient();
  const origin = isClient ? window.location.origin : '';
  const canShare = isClient && typeof navigator.share === 'function';

  const c = d.circle;
  const full = d.members.length >= c.size;
  const organizer = d.members.find((m) => m.role === 'organizer');
  const text =
    `Rejoins mon cercle « ${c.name} » sur Pépite : ${fcfa(c.amount)} ${per(c.frequency)}, ${c.size} membres. ` +
    `Code d'invitation : ${c.inviteCode}` +
    (origin ? `\n${origin}/rejoindre?code=${c.inviteCode}` : '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Invitation copiée.', Copy);
    } catch {
      toast('Copie impossible : sélectionne le texte à la main.', Copy);
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: `Cercle ${c.name}`, text });
    } catch {
      // partage annulé
    }
  };

  return (
    <>
      {!full && (
        <div className="card invite" style={{ marginTop: 18 }}>
          <div className="eyebrow">Invitation</div>
          <div className="sub">Code d'invitation</div>
          <div className="code">{c.inviteCode}</div>
          <div className="msg">{text}</div>
          <div className="btn-row">
            {canShare && (
              <button type="button" className="btn" onClick={share}>
                <Share strokeWidth={1.9} aria-hidden />
                Partager l'invitation
              </button>
            )}
            <button type="button" className={`btn${canShare ? ' ghost' : ''}`} onClick={copy}>
              <Copy strokeWidth={1.9} aria-hidden />
              Copier l'invitation
            </button>
          </div>
        </div>
      )}

      <h2 className="section-h">
        {d.members.length} sur {c.size} ont rejoint
      </h2>
      <ul className="members">
        {d.members.map((m) => (
          <li key={m.id}>
            <div className="av mini">{initial(m.name)}</div>
            <div className="nm">
              {m.id === d.me ? `Toi (${m.name})` : m.name}
              <small>{m.role === 'organizer' ? 'Organise le cercle' : m.isNew ? 'Nouveau sur Pépite' : 'Membre'}</small>
            </div>
          </li>
        ))}
        {Array.from({ length: c.size - d.members.length }, (_, i) => (
          <li key={`empty-${i}`}>
            <div className="av mini soft">
              <UserPlus strokeWidth={1.9} aria-hidden />
            </div>
            <div className="nm sub">Place libre</div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        {full && c.isOrganizer ? (
          <A href={`/cercle/${c.id}/ordre`} className="btn gold">
            <Dices strokeWidth={1.9} aria-hidden />
            Lancer le tirage de l'ordre
          </A>
        ) : full ? (
          <div className="notice">
            <Dices strokeWidth={1.9} aria-hidden />
            <span>Le cercle est complet. {organizer?.name ?? "L'organisateur"} va lancer le tirage de l'ordre.</span>
          </div>
        ) : (
          <p className="sub center" style={{ margin: 0 }}>
            Le tirage de l'ordre se fait quand les {c.size} membres ont rejoint.
          </p>
        )}
      </div>
    </>
  );
}

/* ---------- Cercle actif : le bocal et les versements ---------- */

function Active({ d }: { d: CircleData }) {
  const toast = useToast();
  const declare = useDeclare();
  const validate = useValidate();
  const remind = useRemind();
  const [pay, setPay] = useState<PayTarget | null>(null);
  const [rem, setRem] = useState<RemindTarget | null>(null);
  const [method, setMethod] = useState<Method>('mobile_money');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');

  const c = d.circle;
  const cur = d.current;
  const byId = new Map(d.members.map((m) => [m.id, m]));
  const nameOf = (uid: string) => byId.get(uid)?.name ?? 'Un membre';
  const ordered = [...d.members].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const roundOf = new Map(d.rounds.map((r) => [r.beneficiaryId, r]));

  if (!cur) return null;
  const status = new Map(cur.contributions.map((k) => [k.memberId, k]));
  const iReceive = cur.beneficiaryId === d.me;
  const ben = nameOf(cur.beneficiaryId);
  const paid = cur.contributions.filter((k) => k.status === 'paid').length;
  const sent = cur.contributions.filter((k) => k.status === 'sent').length;
  const due = c.size - paid - sent;
  const mine = status.get(d.me);
  const done = c.status === 'completed';

  const openPay = (t: PayTarget) => {
    setMethod('mobile_money');
    setReference('');
    declare.reset();
    setPay(t);
  };
  const openRemind = (t: RemindTarget) => {
    setMessage(
      `Salut ${t.name}, petit rappel pour la cagnotte de ${t.beneficiary} : ta part de ${fcfa(c.amount)} est attendue avant le ${dateLong(t.dueOn)}. Merci et bonne journée.`,
    );
    remind.reset();
    validate.reset();
    setRem(t);
  };
  const validating = (roundId: string, memberId: string) =>
    validate.isPending && validate.variables?.roundId === roundId && validate.variables?.memberId === memberId;
  const doValidate = (roundId: string, memberId: string, after?: () => void) =>
    validate.mutate(
      { roundId, memberId },
      {
        onSuccess: (r) => {
          after?.();
          toast(
            r.ticket
              ? `Versement de ${nameOf(memberId)} validé. Il gagne un ticket pour dimanche.`
              : `Versement de ${nameOf(memberId)} validé.`,
            CircleCheck,
          );
        },
        onError: (err) => toast(err.message),
      },
    );

  const ring: RingMember[] = ordered.map((m) => ({
    id: m.id,
    label: m.id === d.me ? 'Toi' : m.name,
    initial: initial(m.name),
    status: status.get(m.id)?.status ?? 'due',
    isBeneficiary: m.id === cur.beneficiaryId,
  }));

  const curTarget = (memberId: string): RemindTarget => ({
    roundId: cur.roundId,
    memberId,
    name: nameOf(memberId),
    beneficiary: iReceive ? 'toi' : ben,
    dueOn: cur.dueOn,
    iAmBeneficiary: iReceive,
  });

  const myLate = d.late.filter((l) => l.memberId === d.me || l.beneficiaryId === d.me);

  return (
    <>
      <div className="ringwrap">
        <JarRing
          members={ring}
          onSelect={
            done
              ? undefined
              : (m) => {
                  if (m.id === d.me) {
                    if (!iReceive) openPay({ roundId: cur.roundId, number: cur.number, beneficiary: ben, dueOn: cur.dueOn });
                  } else if (cur.remindedIds.includes(m.id)) toast(`Rappel déjà envoyé à ${m.label}.`, BellRing);
                  else openRemind(curTarget(m.id));
                }
          }
        />
      </div>
      <div className="amount num">
        {fcfa(paid * c.amount)}
        <small>sur {fcfa(c.size * c.amount)}</small>
      </div>
      <p className="sub center" style={{ margin: '6px 0 0' }}>
        {done
          ? 'Cercle terminé : chacun a reçu sa cagnotte.'
          : `Tour ${cur.number} : cagnotte pour ${iReceive ? 'toi' : ben}. Versements avant le ${dateLong(cur.dueOn)}.`}
      </p>
      <div className="counts">
        <span className="pill p-paid">
          <Check strokeWidth={2.4} aria-hidden />
          {paid} {paid > 1 ? 'payés' : 'payé'}
        </span>
        {sent > 0 && (
          <span className="pill p-sent">
            <Hourglass strokeWidth={2.4} aria-hidden />
            {sent} {sent > 1 ? 'reçus' : 'reçu'} à valider
          </span>
        )}
        {due > 0 && (
          <span className="pill p-due">
            <Clock strokeWidth={2.4} aria-hidden />
            {due} en attente
          </span>
        )}
      </div>

      {done ? (
        <div className="card cta ok">
          <div className="row">
            <span className="itile">
              <BadgeCheck strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <b>Bravo, le cercle est bouclé</b>
              <div className="sub">Tout le monde a versé et reçu. Vous pouvez en relancer un ensemble.</div>
            </div>
          </div>
        </div>
      ) : iReceive ? (
        <div className="card cta gold">
          <div className="row">
            <span className="itile">
              <HandCoins strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <b>C'est ton tour : tu reçois {fcfa(c.size * c.amount)}</b>
              <div className="sub">
                {sent
                  ? `${sent} ${sent > 1 ? 'reçus attendent' : 'reçu attend'} ta validation. Valide dès que tu vois l'argent arriver.`
                  : "Valide chaque versement dès que tu vois l'argent arriver."}
              </div>
            </div>
          </div>
        </div>
      ) : mine?.status === 'due' ? (
        <div className="card cta">
          <div className="row">
            <span className="itile pend">
              <Wallet strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <b>
                Ta part : {fcfa(c.amount)} pour {ben}
              </b>
              <div className="sub">À verser avant le {dateLong(cur.dueOn)}.</div>
            </div>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => openPay({ roundId: cur.roundId, number: cur.number, beneficiary: ben, dueOn: cur.dueOn })}
          >
            <Receipt strokeWidth={1.9} aria-hidden />
            J'ai payé ma part
          </button>
        </div>
      ) : mine?.status === 'sent' ? (
        <div className="card cta">
          <div className="row">
            <span className="itile">
              <Hourglass strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <b>Reçu envoyé à {ben}</b>
              <div className="sub">{ben} valide dès que l'argent arrive.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card cta ok">
          <div className="row">
            <span className="itile">
              <CircleCheck strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <b>Ta part est validée</b>
              <div className="sub">Merci. Payée à l'heure, elle te rapporte un ticket pour dimanche.</div>
            </div>
          </div>
        </div>
      )}

      {myLate.length > 0 && (
        <>
          <h2 className="section-h">Versements en retard</h2>
          <ul className="members">
            {myLate.map((l) => {
              const iAmMember = l.memberId === d.me;
              return (
                <li key={`${l.roundId}-${l.memberId}`}>
                  <div className="av mini soft">{initial(nameOf(iAmMember ? l.beneficiaryId : l.memberId))}</div>
                  <div className="nm">
                    {iAmMember ? `Ta part pour ${nameOf(l.beneficiaryId)}` : `${nameOf(l.memberId)} te doit ${fcfa(c.amount)}`}
                    <small>
                      Tour {l.number}, attendu le {dateShort(l.dueOn)}
                    </small>
                  </div>
                  {iAmMember && l.status === 'due' && (
                    <button
                      type="button"
                      className="linkbtn"
                      onClick={() =>
                        openPay({ roundId: l.roundId, number: l.number, beneficiary: nameOf(l.beneficiaryId), dueOn: l.dueOn })
                      }
                    >
                      <Wallet strokeWidth={1.9} aria-hidden />
                      Payer
                    </button>
                  )}
                  {!iAmMember && (
                    <button
                      type="button"
                      className="linkbtn"
                      disabled={validate.isPending}
                      onClick={() => doValidate(l.roundId, l.memberId)}
                    >
                      {validating(l.roundId, l.memberId) ? <Spinner /> : <CircleCheck strokeWidth={1.9} aria-hidden />}
                      {l.status === 'sent' ? 'Valider' : "J'ai reçu"}
                    </button>
                  )}
                  <StatusPill status={l.status} late />
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2 className="section-h">Membres</h2>
      <ul className="members">
        {ordered.map((m) => {
          const k = status.get(m.id);
          const r = roundOf.get(m.id);
          const isBen = m.id === cur.beneficiaryId;
          const when = !r
            ? ''
            : r.number < cur.number || done
              ? `A reçu le ${dateShort(r.dueOn)}`
              : isBen
                ? 'Reçoit ce tour-ci'
                : `Reçoit le ${dateShort(r.dueOn)}`;
          const detail =
            iReceive && k?.status === 'sent' && k.method
              ? ` · ${METHOD_LABEL[k.method]}${k.reference ? `, réf. ${k.reference}` : ''}`
              : '';
          let action = null;
          if (!done && k?.status === 'due' && m.id === d.me && !iReceive) {
            action = (
              <button
                type="button"
                className="linkbtn"
                onClick={() => openPay({ roundId: cur.roundId, number: cur.number, beneficiary: ben, dueOn: cur.dueOn })}
              >
                <Wallet strokeWidth={1.9} aria-hidden />
                Payer
              </button>
            );
          } else if (!done && iReceive && k?.status === 'sent') {
            action = (
              <button
                type="button"
                className="linkbtn"
                disabled={validate.isPending}
                onClick={() => doValidate(cur.roundId, m.id)}
              >
                {validating(cur.roundId, m.id) ? <Spinner /> : <CircleCheck strokeWidth={1.9} aria-hidden />}
                Valider
              </button>
            );
          } else if (!done && k?.status === 'due' && m.id !== d.me) {
            action = cur.remindedIds.includes(m.id) ? (
              <span className="sub">Rappel envoyé</span>
            ) : (
              <button type="button" className="linkbtn" onClick={() => openRemind(curTarget(m.id))}>
                <BellRing strokeWidth={1.9} aria-hidden />
                Rappel
              </button>
            );
          }
          return (
            <li key={m.id}>
              <div className={`av mini${k?.status === 'paid' ? '' : ' soft'}`}>{initial(m.name)}</div>
              <div className="nm">
                {m.id === d.me ? `Toi (${m.name})` : m.name}
                <small>
                  {when}
                  {detail}
                </small>
              </div>
              {action}
              {isBen && !done ? (
                <span className="pill p-gold">
                  <HandCoins strokeWidth={2.4} aria-hidden />
                  Reçoit
                </span>
              ) : k ? (
                <StatusPill status={k.status} />
              ) : null}
            </li>
          );
        })}
      </ul>

      <h2 className="section-h">Ordre des tours</h2>
      <div className="turns">
        {d.rounds.map((r) => {
          const isMine = r.beneficiaryId === d.me;
          const past = r.number < cur.number || done;
          const now = r.number === cur.number && !done;
          return (
            <div key={r.id} className={`turn${past ? ' past' : ''}${now ? ' now' : ''}${isMine ? ' mine' : ''}`}>
              <span>{dateShort(r.dueOn)}</span>
              <b>{isMine ? 'Toi' : nameOf(r.beneficiaryId)}</b>
              <small>{past ? 'Reçu' : now ? 'En cours' : isMine ? 'Ton tour' : ' '}</small>
            </div>
          );
        })}
      </div>

      {/* Payer ma part */}
      <Sheet open={!!pay} onClose={() => setPay(null)} label="Payer ma part">
        {pay && (
          <>
            <h2 className="sheet-h">Payer ma part</h2>
            <p className="sub" style={{ margin: 0 }}>
              {fcfa(c.amount)} pour {pay.beneficiary}, tour {pay.number} de {c.name}.
            </p>
            <span className="fl">Comment as-tu payé ?</span>
            <div className="seg" role="group" aria-label="Moyen de paiement">
              {METHODS.map(({ id: mid, label, Icon }) => (
                <button key={mid} type="button" aria-pressed={method === mid} onClick={() => setMethod(mid)}>
                  <Icon strokeWidth={1.9} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
            <p className="sub" style={{ margin: '6px 0 0' }}>
              {method === 'mobile_money'
                ? 'Mixx by Yas ou Flooz : recopie la référence de la transaction.'
                : method === 'bank_transfer'
                  ? 'Recopie la référence du virement.'
                  : `Remets l'argent en main propre à ${pay.beneficiary}.`}
            </p>
            {method !== 'cash' && (
              <>
                <label className="fl" htmlFor="ref">
                  Référence de la transaction
                </label>
                <input
                  id="ref"
                  className="input"
                  maxLength={80}
                  autoComplete="off"
                  placeholder={method === 'mobile_money' ? 'Référence Mixx ou Flooz' : 'Référence du virement'}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </>
            )}
            <FormError error={declare.error} />
            <button
              type="button"
              className="btn"
              disabled={declare.isPending}
              onClick={() =>
                declare.mutate(
                  { roundId: pay.roundId, method, reference: method === 'cash' ? '' : reference },
                  {
                    onSuccess: () => {
                      setPay(null);
                      toast(`Reçu envoyé à ${pay.beneficiary}. Il reste à valider.`, Send);
                    },
                  },
                )
              }
            >
              {declare.isPending ? <Spinner /> : <Send strokeWidth={1.9} aria-hidden />}
              <span>Envoyer à {pay.beneficiary} pour validation</span>
            </button>
            <p className="sub center" style={{ margin: '10px 0 0' }}>
              {pay.beneficiary} confirme quand l'argent arrive. Ton versement compte alors dans le bocal.
            </p>
          </>
        )}
      </Sheet>

      {/* Rappel privé */}
      <Sheet open={!!rem} onClose={() => setRem(null)} label="Envoyer un rappel">
        {rem && (
          <>
            <h2 className="sheet-h">Rappel pour {rem.name}</h2>
            <p className="sub lockline">
              <Lock strokeWidth={1.9} aria-hidden />
              Le message part en privé : {rem.name} le verra dans l'appli.
            </p>
            <label className="fl" htmlFor="rm-text">
              Message
            </label>
            <textarea id="rm-text" className="input" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
            <FormError error={remind.error ?? validate.error} />
            <button
              type="button"
              className="btn"
              disabled={remind.isPending || !message.trim()}
              onClick={() =>
                remind.mutate(
                  { roundId: rem.roundId, memberId: rem.memberId, message },
                  {
                    onSuccess: () => {
                      setRem(null);
                      toast(`Rappel envoyé à ${rem.name}.`, BellRing);
                    },
                  },
                )
              }
            >
              {remind.isPending ? <Spinner /> : <BellRing strokeWidth={1.9} aria-hidden />}
              <span>Envoyer le rappel</span>
            </button>
            {rem.iAmBeneficiary && (
              <button
                type="button"
                className="btn ghost"
                disabled={validate.isPending}
                onClick={() => doValidate(rem.roundId, rem.memberId, () => setRem(null))}
              >
                {validating(rem.roundId, rem.memberId) ? <Spinner /> : <CircleCheck strokeWidth={1.9} aria-hidden />}
                {rem.name} m'a déjà payé
              </button>
            )}
          </>
        )}
      </Sheet>
    </>
  );
}

/* ---------- Règles ---------- */

function Rules({ d }: { d: CircleData }) {
  const c = d.circle;
  return (
    <>
      <h2 className="section-h">Les règles du cercle</h2>
      <ul className="ilist">
        <li>
          <CalendarClock strokeWidth={1.9} aria-hidden />
          <span>
            Versement de {fcfa(c.amount)} {per(c.frequency)}, avant chaque date limite.
          </span>
        </li>
        <li>
          <CircleCheck strokeWidth={1.9} aria-hidden />
          <span>Celui qui reçoit valide chaque versement dès qu'il voit l'argent.</span>
        </li>
        {c.newMembersLast && (
          <li>
            <UserPlus strokeWidth={1.9} aria-hidden />
            <span>Un nouveau membre sans historique passe en fin d'ordre.</span>
          </li>
        )}
        {c.depositRequired && (
          <li>
            <Shield strokeWidth={1.9} aria-hidden />
            <span>Caution d'un versement par membre, rendue à la fin du cercle.</span>
          </li>
        )}
        <li>
          <Users strokeWidth={1.9} aria-hidden />
          <span>L'argent passe directement entre les membres. Pépite organise les tours, les rappels et les preuves.</span>
        </li>
        {c.drawSeed && (
          <li>
            <ShieldCheck strokeWidth={1.9} aria-hidden />
            <span>
              Ordre tiré au sort, code de vérification <b className="num">{c.drawSeed}</b>.{' '}
              <A href={`/cercle/${c.id}/ordre`} style={{ color: 'var(--brand)', fontWeight: 700 }}>
                Voir le tirage
              </A>
            </span>
          </li>
        )}
      </ul>
    </>
  );
}
