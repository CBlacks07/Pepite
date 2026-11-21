import { useState, type ReactNode } from 'react';

import { A } from '@/components/A';
import { HeroRings } from '@/components/HeroRings';
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  CirclePlus,
  Clock,
  Dices,
  HandCoins,
  Hourglass,
  PiggyBank,
  Receipt,
  UserPlus,
  Users,
} from '@/components/icons';
import { InstallBanner } from '@/components/InstallBanner';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { ErrorNotice, PageSkeleton, Track } from '@/components/ui';
import { countdown, dateLong, dayOfMonth, fcfa, initial, num, per, relative } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useHome, useMarkRemindersRead } from '@/lib/queries';
import type { HomeData } from '@/lib/types';

type CircleItem = HomeData['circles'][number];
type FeedItem = HomeData['feed'][number];

function circleMeta(c: CircleItem): string {
  const base = `${fcfa(c.amount)} ${per(c.frequency)}`;
  if (c.status === 'forming') return `${base} · ${c.members} sur ${c.size} membres`;
  if (c.status === 'completed') return `${base} · ${c.size} membres · terminé`;
  return `${base} · ${c.size} membres · tour ${c.currentNumber} sur ${c.size}`;
}

function CirclePill({ c }: { c: CircleItem }) {
  if (c.status === 'completed')
    return (
      <span className="pill p-paid">
        <BadgeCheck strokeWidth={2.4} aria-hidden />
        Terminé
      </span>
    );
  if (c.status === 'forming')
    return c.members >= c.size ? (
      <span className="pill p-gold">
        <Dices strokeWidth={2.4} aria-hidden />
        Tirage de l'ordre
      </span>
    ) : (
      <span className="pill p-muted">
        <Users strokeWidth={2.4} aria-hidden />
        {c.members}/{c.size}
      </span>
    );
  if (c.iReceive)
    return (
      <span className="pill p-gold">
        <HandCoins strokeWidth={2.4} aria-hidden />
        Tu reçois
      </span>
    );
  if (c.myStatus === 'sent')
    return (
      <span className="pill p-sent">
        <Hourglass strokeWidth={2.4} aria-hidden />
        Reçu envoyé
      </span>
    );
  if (c.myStatus === 'paid')
    return (
      <span className="pill p-paid">
        <Check strokeWidth={2.4} aria-hidden />
        Payé
      </span>
    );
  return (
    <span className="pill p-due">
      <Clock strokeWidth={2.4} aria-hidden />
      Ta part : avant le {c.currentDue ? dayOfMonth(c.currentDue) : '?'}
    </span>
  );
}

function feedLine(e: FeedItem): { icon: ReactNode; text: ReactNode; gold?: boolean } {
  const amount = e.amount ? <b>{fcfa(e.amount)}</b> : null;
  switch (e.kind) {
    case 'joined':
      return { icon: <UserPlus strokeWidth={1.9} aria-hidden />, text: e.actorIsMe ? 'Tu as rejoint le cercle.' : `${e.actor} a rejoint le cercle.` };
    case 'order_drawn':
      return { icon: <Dices strokeWidth={1.9} aria-hidden />, text: "L'ordre des tours a été tiré.", gold: true };
    case 'contribution_sent':
      return {
        icon: <Receipt strokeWidth={1.9} aria-hidden />,
        text: e.actorIsMe ? (
          <>Tu as envoyé ton reçu à {e.target}.</>
        ) : e.targetIsMe ? (
          <>
            {e.actor} t'a envoyé son reçu de {amount}.
          </>
        ) : (
          <>
            {e.actor} a envoyé son reçu à {e.target}.
          </>
        ),
      };
    case 'contribution_validated':
      return {
        icon: <CircleCheck strokeWidth={1.9} aria-hidden />,
        text: e.actorIsMe ? (
          <>Tu as validé le versement de {e.target}.</>
        ) : e.targetIsMe ? (
          <>
            {e.actor} a validé ton versement de {amount}.
          </>
        ) : (
          <>
            {e.actor} a validé le versement de {e.target}.
          </>
        ),
      };
  }
}

export default function Accueil() {
  const home = useHome();
  const now = useNow();
  const toast = useToast();
  const markRead = useMarkRemindersRead();
  const [bell, setBell] = useState<HomeData['reminders'] | null>(null);

  if (home.isPending) return <PageSkeleton />;
  if (home.isError)
    return (
      <div className="view">
        <ErrorNotice error={home.error} onRetry={() => home.refetch()} />
      </div>
    );

  const d = home.data;
  const name = d.user.displayName;
  const unread = d.reminders.length;

  const openBell = () => {
    if (!unread) {
      toast('Aucune nouvelle notification.', Bell);
      return;
    }
    setBell(d.reminders);
    markRead.mutate();
  };

  return (
    <div className="view">
      <div className="top">
        <div className="hello">
          <div className="av">{initial(name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="sub">Bonjour</div>
            <div className="h-app" style={{ fontSize: 22 }}>
              {name}
            </div>
          </div>
        </div>
        <button type="button" className="iconbtn" onClick={openBell} aria-label={unread ? `${unread} rappel(s) non lu(s)` : 'Notifications'}>
          <Bell strokeWidth={1.9} aria-hidden />
          {unread > 0 && <span className="bdot" />}
        </button>
      </div>

      <InstallBanner />

      <div className="hero">
        <HeroRings />
        <div className="k">
          <PiggyBank strokeWidth={1.9} aria-hidden />
          Mis de côté en {d.year}
        </div>
        <div className="big num">
          {num(d.saved)} <small>F&nbsp;CFA</small>
        </div>
        <div className="next">
          <CalendarDays strokeWidth={1.9} aria-hidden />
          <span>
            {d.nextTurn ? (
              <>
                Ton prochain tour : <strong>{fcfa(d.nextTurn.pot)} le {dateLong(d.nextTurn.dueOn)}</strong>, avec{' '}
                {d.nextTurn.circleName}.
              </>
            ) : d.circles.length ? (
              'Ton tour sera fixé au tirage de l’ordre de ton prochain cercle.'
            ) : (
              'Crée un cercle ou rejoins celui de tes proches pour commencer.'
            )}
          </span>
        </div>
      </div>

      <A href="/tirage" className="tk">
        <span className="count num">{d.tickets.count}</span>
        <span className="txt">
          <b>{d.tickets.count > 1 ? 'tickets pour dimanche' : 'ticket pour dimanche'}</b>
          <span className="sub">{now ? countdown(d.tickets.drawOn, now).short : 'Tirage dimanche à 20 h'}</span>
        </span>
        <ChevronRight strokeWidth={1.9} aria-hidden />
      </A>

      <h2 className="section-h">Mes cercles</h2>
      {d.circles.length === 0 ? (
        <div className="card empty-state">
          <Users strokeWidth={1.9} aria-hidden />
          <b>Pas encore de cercle</b>
          <span className="sub">Crée le tien et invite tes proches, ou entre le code qu'on t'a donné.</span>
          <div className="btn-row" style={{ width: '100%' }}>
            <A href="/creer" className="btn">
              <CirclePlus strokeWidth={1.9} aria-hidden />
              Créer un cercle
            </A>
            <A href="/rejoindre" className="btn ghost">
              Rejoindre avec un code
            </A>
          </div>
        </div>
      ) : (
        <>
          <div className="circles">
            {d.circles.map((c) => {
              const done = c.status === 'completed' ? c.size : c.currentNumber ? c.currentNumber - 1 : 0;
              const cur = c.status === 'active' && c.currentNumber ? c.currentNumber - 1 : -1;
              return (
                <A key={c.id} href={`/cercle/${c.id}`} className="cc">
                  <span className="row">
                    <span className={`itile${c.status === 'forming' ? ' gold' : ''}`}>
                      <Users strokeWidth={1.9} aria-hidden />
                    </span>
                    <span className="main">
                      <span className="name">{c.name}</span>
                      <span className="meta">{circleMeta(c)}</span>
                    </span>
                  </span>
                  <span className="foot2">
                    <Track n={c.size} done={done} cur={cur} />
                    <CirclePill c={c} />
                  </span>
                </A>
              );
            })}
          </div>
          <A href="/rejoindre" className="linkbtn" style={{ marginTop: 6 }}>
            <UserPlus strokeWidth={1.9} aria-hidden />
            Rejoindre un cercle avec un code
          </A>
        </>
      )}

      {d.feed.length > 0 && (
        <>
          <h2 className="section-h">Dernières nouvelles</h2>
          <ul className="feed">
            {d.feed.map((e, i) => {
              const line = feedLine(e);
              return (
                <li key={i}>
                  <span className={`itile sm${line.gold ? ' gold' : ''}`}>{line.icon}</span>
                  <div>
                    <div>{line.text}</div>
                    <div className="when">
                      {e.circle}, {relative(e.createdAt)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Sheet open={!!bell} onClose={() => setBell(null)} label="Rappels">
        <h2 className="sheet-h">Rappels</h2>
        <p className="sub" style={{ margin: '0 0 8px' }}>
          Envoyés en privé par les membres de tes cercles.
        </p>
        <ul className="feed">
          {(bell ?? []).map((r) => (
            <li key={r.id}>
              <span className="itile sm pend">
                <Bell strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <div>{r.message}</div>
                <div className="when">
                  {r.fromName}, {r.circle}, {relative(r.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
