import Link from 'next/link';

import { Ban, BellRing, CircleCheck, Dices, Gift, HandCoins, Receipt, ShieldCheck, Users, Wallet } from '@/components/icons';
import { JarRing, type RingMember } from '@/components/JarRing';
import { fcfa } from '@/lib/format';

// Exemple affiché sur la page d'accueil : 10 cousins, 25 000 F CFA par mois.
const DEMO: RingMember[] = [
  ['Komlan', 'paid', true],
  ['Abla', 'sent'],
  ['Yao', 'paid'],
  ['Afi', 'due'],
  ['Essi', 'paid'],
  ['Kossi', 'due'],
  ['Dzifa', 'due'],
  ['Koffi', 'paid'],
  ['Ama', 'paid'],
  ['Kodjo', 'paid'],
].map(([name, status, ben]) => ({
  id: name as string,
  label: name as string,
  initial: (name as string)[0],
  status: status as RingMember['status'],
  isBeneficiary: !!ben,
}));

const STEPS = [
  {
    Icon: Users,
    title: 'Crée ton cercle',
    text: 'Montant en francs CFA, rythme, nombre de membres et règles : le résumé se calcule pendant que tu remplis.',
  },
  {
    Icon: Receipt,
    title: 'Invite tes proches',
    text: 'Un code ou un lien à partager sur WhatsApp. Chacun s’inscrit avec son prénom.',
  },
  {
    Icon: Dices,
    title: "Tirez l'ordre ensemble",
    text: 'La roue désigne qui reçoit en premier. Un code de vérification permet à chacun de refaire le calcul.',
  },
  {
    Icon: HandCoins,
    title: 'Versez et validez',
    text: 'Chacun déclare son versement, celui qui reçoit le valide dès qu’il voit l’argent. Le bocal se remplit.',
  },
];

const FAQ = [
  {
    q: 'Est-ce que Pépite garde mon argent ?',
    a: 'Non. L’argent passe directement entre les membres, par Mixx by Yas, Flooz, virement ou en espèces. Pépite organise les tours, envoie les rappels et garde les preuves (références des transactions).',
  },
  {
    q: 'Que se passe-t-il si quelqu’un ne paie pas ?',
    a: 'Les membres peuvent lui envoyer un rappel privé. Le retard est visible dans le cercle et fait baisser son score de fiabilité. En cas de désaccord, l’équipe Pépite aide à trancher à partir des preuves.',
  },
  {
    q: 'Comment est choisi l’ordre des tours ?',
    a: 'Par un tirage au sort fait par le serveur, avec un code de vérification. Personne ne choisit sa place, pas même l’organisateur. Une option met les nouveaux membres en fin d’ordre.',
  },
  {
    q: 'Pourquoi je n’ai pas besoin de mon numéro de téléphone ?',
    a: 'Pour le lancement, l’inscription se fait avec ton prénom. Garde bien ton code de secours (dans ton profil) : il permet de retrouver ton compte sur un autre téléphone.',
  },
  {
    q: 'Combien ça coûte ?',
    a: 'Pépite est gratuit pendant la phase de lancement.',
  },
];

export default function Home() {
  return (
    <>
      <div className="wrap">
        <section className="hero-site">
          <div>
            <div className="eyebrow">Tontine entre proches · Togo</div>
            <h1>
              La tontine entre proches, sans cahier ni oubli<span className="e">.</span>
            </h1>
            <p className="lede">
              Pépite organise les tours, rappelle les dates et garde les preuves de paiement. Chacun reçoit la cagnotte à
              son tour, et chaque versement fait à l'heure rapporte un ticket pour le tirage du dimanche.
            </p>
            <div className="hero-actions">
              <Link href="/connexion" className="btn">
                Créer mon compte
              </Link>
              <Link href="/rejoindre" className="btn ghost">
                J'ai un code d'invitation
              </Link>
            </div>
            <p className="sub" style={{ marginTop: 14 }}>
              Gratuit. L'argent passe directement entre vous : Pépite ne le touche jamais.
            </p>
          </div>
          <div className="card hero-visual">
            <div className="ringwrap">
              <JarRing members={DEMO} />
            </div>
            <div className="amount num">
              {fcfa(150_000)}
              <small>sur {fcfa(250_000)}</small>
            </div>
            <p className="sub center" style={{ margin: '8px 0 0' }}>
              Exemple : Les cousins, {fcfa(25_000)} par mois, 10 membres. Ce mois-ci, Komlan reçoit la cagnotte.
            </p>
          </div>
        </section>
      </div>

      <section className="section" id="comment">
        <div className="wrap">
          <div className="eyebrow">Comment ça marche</div>
          <h2 className="section-title">Quatre étapes, et la tontine tourne toute seule</h2>
          <p className="section-lede">
            Les mêmes règles qu'une tontine entre proches, sans les calculs ni les relances gênantes.
          </p>
          <div className="grid-4">
            {STEPS.map(({ Icon, title, text }, i) => (
              <div key={title} className="card step">
                <span className="itile">
                  <Icon strokeWidth={1.9} aria-hidden />
                </span>
                <span className="n">Étape {i + 1}</span>
                <b>{title}</b>
                <span className="sub" style={{ fontSize: 14 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="tirage">
        <div className="wrap grid-2">
          <div>
            <div className="eyebrow">Le tirage du dimanche</div>
            <h2 className="section-title">Payer à l'heure rapporte des tickets</h2>
            <p className="section-lede" style={{ marginBottom: 18 }}>
              Tous les dimanches à 20 h (heure de Lomé), des lots offerts par des partenaires sont tirés au sort parmi
              les tickets. Ton épargne, elle, ne dépend jamais de la chance.
            </p>
            <ul className="ilist" style={{ gap: 12 }}>
              <li>
                <CircleCheck strokeWidth={1.9} aria-hidden />
                <span>1 ticket pour chaque versement fait à l'heure et validé.</span>
              </li>
              <li>
                <Gift strokeWidth={1.9} aria-hidden />
                <span>1 ticket quand une personne que tu invites rejoint son premier cercle.</span>
              </li>
              <li>
                <Ban strokeWidth={1.9} aria-hidden />
                <span>4 tickets maximum par tirage. Les tickets ne s'achètent pas.</span>
              </li>
              <li>
                <ShieldCheck strokeWidth={1.9} aria-hidden />
                <span>
                  Participation gratuite possible sans versement :{' '}
                  <Link href="/reglement" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    voir le règlement du jeu
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </div>
          <div className="tickets" style={{ alignContent: 'center' }}>
            {[
              ['48 213', "Versement à l'heure", 'Les cousins, tour 4'],
              ['48 214', "Versement à l'heure", 'Collègues du bureau, tour 2'],
              ['51 902', 'Invitation acceptée', 'Edem a rejoint Projet moto'],
            ].map(([no, src, det]) => (
              <div key={no} className="ticket">
                <span className="no num">N° {no}</span>
                <span>
                  <b>{src}</b>
                  <span className="sub">{det}</span>
                </span>
              </div>
            ))}
            <div className="ticket empty">
              <span className="no num">N° ——</span>
              <span>
                <b>Ticket libre</b>
                <span className="sub">Paie ta part à l'heure pour l'obtenir.</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid-2 even">
          <div className="card">
            <div className="eyebrow">Ce que fait Pépite</div>
            <ul className="ilist" style={{ marginTop: 12, gap: 12 }}>
              <li>
                <Dices strokeWidth={1.9} aria-hidden />
                <span>Tire l'ordre des tours au sort, de façon vérifiable.</span>
              </li>
              <li>
                <BellRing strokeWidth={1.9} aria-hidden />
                <span>Envoie des rappels privés avant chaque date limite.</span>
              </li>
              <li>
                <Receipt strokeWidth={1.9} aria-hidden />
                <span>Garde la trace de chaque versement et de sa référence Mixx ou Flooz.</span>
              </li>
              <li>
                <CircleCheck strokeWidth={1.9} aria-hidden />
                <span>Calcule un score de fiabilité qui récompense la ponctualité.</span>
              </li>
            </ul>
          </div>
          <div className="card">
            <div className="eyebrow">Ce que Pépite ne fait pas</div>
            <ul className="ilist" style={{ marginTop: 12, gap: 12 }}>
              <li>
                <Wallet strokeWidth={1.9} aria-hidden />
                <span>Garder votre argent : il passe directement d'un membre à l'autre.</span>
              </li>
              <li>
                <Ban strokeWidth={1.9} aria-hidden />
                <span>Prêter de l'argent ou promettre des gains : une tontine n'est pas un placement.</span>
              </li>
              <li>
                <ShieldCheck strokeWidth={1.9} aria-hidden />
                <span>Remplacer la confiance : choisissez des personnes que vous connaissez.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="questions">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="eyebrow">Questions</div>
          <h2 className="section-title">Ce qu'on nous demande souvent</h2>
          <div className="faq" style={{ marginTop: 22 }}>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className="card" style={{ marginTop: 32, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <b style={{ fontSize: 18 }}>Prêt à lancer ton cercle ?</b>
              <div className="sub">Inscription en dix secondes, avec ton prénom.</div>
            </div>
            <Link href="/connexion" className="btn">
              Créer mon compte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
