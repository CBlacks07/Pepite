'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';

import { BadgeCheck, CalendarCheck, Check, Copy, KeyRound, Lock, LogOut, UserPlus } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { ErrorNotice, FormError, PageSkeleton, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { fcfa, initial, monthOf } from '@/lib/format';
import { useProfile } from '@/lib/queries';
import { SCORE_WEIGHTS } from '@/lib/rules';

const SCORE_PARTS = [
  ['punctuality', 'Ponctualité', 's1'],
  ['seniority', 'Ancienneté', 's2'],
  ['completed', 'Cercles terminés', 's3'],
] as const;

const MONTHS = 'JFMAMJJASOND'.split('');
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const TIP = { ontime: "À l'heure", late: 'En retard', none: 'Aucun versement', current: 'Mois en cours', future: 'À venir' };

function label(score: number) {
  if (score >= 90) return 'Très fiable';
  if (score >= 75) return 'Fiable';
  if (score >= 50) return 'En progrès';
  return 'À améliorer';
}

const UNLOCKS = [
  { at: 80, title: `Cercles jusqu'à ${fcfa(150_000)} par mois`, text: 'À partir de 80 points' },
  { at: 90, title: "Choisir sa place dans l'ordre", text: "Contre une caution d'un versement. À partir de 90 points" },
  { at: 95, title: 'Microcrédit chez un partenaire', text: 'À partir de 95 points' },
];

export default function Profil() {
  const q = useProfile();
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [leaving, setLeaving] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<unknown>(null);

  if (q.isPending) return <PageSkeleton />;
  if (q.isError)
    return (
      <div className="view">
        <ErrorNotice error={q.error} onRetry={() => q.refetch()} />
      </div>
    );

  const d = q.data;
  const score = d.score;
  const C = 2 * Math.PI * 50;

  const logout = async () => {
    setLeaving(true);
    try {
      await api('/api/auth/logout', { body: {} });
    } finally {
      qc.clear();
      router.replace('/connexion');
      router.refresh();
    }
  };

  const newCode = async () => {
    setCodeBusy(true);
    setCodeError(null);
    try {
      const r = await api<{ recoveryCode: string }>('/api/me/recovery', { body: {} });
      setCode(r.recoveryCode);
    } catch (err) {
      setCodeError(err);
    } finally {
      setCodeBusy(false);
    }
  };

  return (
    <div className="view">
      <div className="page-head">
        <div className="hello">
          <div className="av big">{initial(d.user.displayName)}</div>
          <div className="min-0">
            <h1 className="h-app">{d.user.displayName}</h1>
            <div className="sub">Membre depuis {monthOf(d.memberSince)}</div>
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn small ghost" onClick={logout} disabled={leaving}>
            {leaving ? <Spinner /> : <LogOut strokeWidth={1.9} aria-hidden />}
            Me déconnecter
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="col">
          <div className="card gauge">
            <svg viewBox="0 0 120 120" aria-hidden>
              <circle cx="60" cy="60" r="50" className="g-track" />
              {score !== null && (
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="g-val"
                  strokeDasharray={`${((score / 100) * C).toFixed(1)} ${C.toFixed(2)}`}
                  transform="rotate(-90 60 60)"
                />
              )}
              {/* Repère doré : 95 points, seuil du microcrédit */}
              <circle
                cx={60 + 50 * Math.cos(-Math.PI / 2 + 0.95 * 2 * Math.PI)}
                cy={60 + 50 * Math.sin(-Math.PI / 2 + 0.95 * 2 * Math.PI)}
                r="4"
                className="g-tick"
              />
              <text x="60" y="66" className="g-num">
                {score ?? '–'}
              </text>
              <text x="60" y="82" className="g-of">
                sur 100
              </text>
            </svg>
            <div>
              <div className="eyebrow">Score de fiabilité</div>
              {score === null ? (
                <>
                  <div className="gv">Pas encore de score</div>
                  <div className="sub">Il apparaît après ton premier versement validé.</div>
                </>
              ) : (
                <>
                  <div className="gv">{label(score)}</div>
                  <div className="sub">
                    {score >= 95
                      ? 'Tu as atteint le repère doré du microcrédit partenaire.'
                      : `Encore ${95 - score} points pour le microcrédit partenaire (repère doré).`}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="stats mt-0">
            <div className="stat">
              <CalendarCheck strokeWidth={1.9} aria-hidden />
              <b className="num">{d.stats.streak}</b>
              <span>mois sans retard</span>
            </div>
            <div className="stat">
              <BadgeCheck strokeWidth={1.9} aria-hidden />
              <b className="num">{d.stats.completed}</b>
              <span>{d.stats.completed > 1 ? 'cercles terminés' : 'cercle terminé'}</span>
            </div>
            <div className="stat">
              <UserPlus strokeWidth={1.9} aria-hidden />
              <b className="num">{d.stats.invited}</b>
              <span>{d.stats.invited > 1 ? 'personnes invitées' : 'personne invitée'}</span>
            </div>
          </div>

          <h2 className="section-h">Ce que ton score débloquera</h2>
          <ul className="unlock card py-4">
            {UNLOCKS.map((u) => {
              const ok = score !== null && score >= u.at;
              return (
                <li key={u.at} className={ok ? '' : 'lock'}>
                  <span className="chk">
                    {ok ? <Check strokeWidth={2.6} aria-hidden /> : <Lock strokeWidth={2.6} aria-hidden />}
                  </span>
                  <div>
                    <b>{u.title}</b>
                    <div className="sub">{u.text}. Arrive dans une prochaine version.</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="col">
          <h2 className="section-h">Historique des versements</h2>
          <div className="card">
            <div className="hrow head">
              <span />
              {MONTHS.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
            {d.history.map((y) => (
              <div key={y.year} className="hrow">
                <span className="yr">{y.year}</span>
                {y.months.map((s, i) => (
                  <span key={i} className={`dot ${s}`} title={`${MONTH_NAMES[i]} ${y.year} : ${TIP[s]}`} />
                ))}
              </div>
            ))}
            <div className="legend">
              <span>
                <i className="ontime" />À l'heure
              </span>
              <span>
                <i className="late" />
                En retard
              </span>
              <span>
                <i className="current" />
                Mois en cours
              </span>
            </div>
          </div>

          <h2 className="section-h">Comment il est calculé</h2>
          <div className="split" aria-hidden>
            {SCORE_PARTS.map(([key, , cls]) => (
              <span key={key} className={cls} style={{ '--w': SCORE_WEIGHTS[key] } as CSSProperties} />
            ))}
          </div>
          <div className="split-l">
            {SCORE_PARTS.map(([key, label]) => (
              <span key={key}>
                {label} {SCORE_WEIGHTS[key]} %
              </span>
            ))}
          </div>
          <p className="sub m-0">
            {d.stats.payments
              ? `${d.stats.onTime} versement${d.stats.onTime > 1 ? 's' : ''} à l'heure sur ${d.stats.payments}.`
              : 'Aucun versement compté pour le moment.'}
          </p>

          <h2 className="section-h">Code de secours</h2>
          <div className="card">
            <div className="hstack">
              <span className="itile">
                <KeyRound strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <b>Pour retrouver ton compte sur un autre téléphone</b>
                <div className="sub">
                  Pour l'instant, il n'y a pas de connexion par SMS : ce code est la seule façon de te reconnecter.
                  Un nouveau code remplace l'ancien.
                </div>
              </div>
            </div>
            {code && (
              <>
                <div className="recovery-code">{code}</div>
                <p className="sub center m-0">
                  Note-le maintenant : il ne sera plus affiché.
                </p>
              </>
            )}
            <FormError error={codeError} />
            <div className="btn-row">
              {code ? (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(code);
                      toast('Code copié.', Copy);
                    } catch {
                      toast('Copie impossible : recopie-le à la main.', Copy);
                    }
                  }}
                >
                  <Copy strokeWidth={1.9} aria-hidden />
                  Copier le code
                </button>
              ) : (
                <button type="button" className="btn ghost" onClick={newCode} disabled={codeBusy}>
                  {codeBusy ? <Spinner /> : <KeyRound strokeWidth={1.9} aria-hidden />}
                  Générer un nouveau code
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
