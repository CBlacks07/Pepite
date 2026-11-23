import Link from 'next/link';

import { Check, X } from '@/components/icons';
import { fcfa } from '@/lib/format';
import { drawTime, maxTicketsText } from '@/lib/rules';

// Exemple de la page d'accueil : le carnet d'un vrai cercle, tel que Pépite le tient.
// 10 cousins, 25 000 F CFA par mois ; ce mois-ci, c'est le tour de Komlan.
const LEDGER: { n: number; name: string; date: string; state: 'done' | 'now' | 'next' }[] = [
  { n: 1, name: 'Abla', date: '30 août', state: 'done' },
  { n: 2, name: 'Yao', date: '30 sept.', state: 'done' },
  { n: 3, name: 'Essi', date: '30 oct.', state: 'done' },
  { n: 4, name: 'Komlan', date: '30 nov.', state: 'now' },
  { n: 5, name: 'Afi', date: '30 déc.', state: 'next' },
  { n: 6, name: 'Kossi', date: '30 janv.', state: 'next' },
];

const STEPS = [
  {
    title: 'Crée ton cercle',
    text: 'Montant en francs CFA, rythme, nombre de membres et règles. Le résumé se calcule pendant que tu remplis.',
  },
  {
    title: 'Invite tes proches',
    text: 'Un code ou un lien à partager sur WhatsApp. Chacun s’inscrit avec son prénom.',
  },
  {
    title: "Tirez l'ordre ensemble",
    text: 'Le serveur tire au sort qui reçoit en premier. Un code de vérification permet à chacun de refaire le calcul.',
  },
  {
    title: 'Versez et validez',
    text: 'Chacun déclare son versement, et celui qui reçoit le valide dès qu’il voit l’argent arriver.',
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

const STATE_LABEL = { done: 'Reçu', now: 'En cours', next: 'À venir' } as const;

export default function Home() {
  return (
    <>
      <div className="wrap">
        <section className="hero-site">
          <div className="hero-copy">
            <h1>La tontine entre proches, sans cahier ni oubli</h1>
            <p className="lede">
              Pépite tient le carnet à ta place : l'ordre des tours, les dates, qui a versé et qui doit encore le faire.
              Chacun reçoit la cagnotte à son tour.
            </p>
            <div className="hero-actions">
              <Link href="/connexion" className="btn">
                Créer mon compte
              </Link>
              <Link href="/rejoindre" className="btn ghost">
                J'ai un code d'invitation
              </Link>
            </div>
            <p className="hero-note">Gratuit. L'argent passe directement entre vous : Pépite ne le touche jamais.</p>
          </div>

          <figure className="ledger" aria-label="Exemple : le carnet du cercle Les cousins">
            <header className="ledger-head">
              <div>
                <div className="ledger-name">Les cousins</div>
                <div className="sub">{fcfa(25_000)} par mois, 10 membres</div>
              </div>
              <span className="ledger-turn">Tour 4 sur 10</span>
            </header>

            <div className="ledger-pot">
              <div className="sub">Cagnotte de Komlan, à verser avant le 30 novembre</div>
              <div className="ledger-amount num">
                {fcfa(150_000)} <small>sur {fcfa(250_000)}</small>
              </div>
              <div className="ledger-bar" role="img" aria-label="6 parts validées sur 10, 1 à valider">
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} className={i < 6 ? 'paid' : i === 6 ? 'sent' : undefined} />
                ))}
              </div>
              <div className="ledger-legend">
                <span>
                  <i className="paid" />6 validés
                </span>
                <span>
                  <i className="sent" />1 à valider
                </span>
                <span>
                  <i />3 attendus
                </span>
              </div>
            </div>

            <table className="ledger-table">
              <thead>
                <tr>
                  <th scope="col">Tour</th>
                  <th scope="col">Reçoit</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="r">
                    État
                  </th>
                </tr>
              </thead>
              <tbody>
                {LEDGER.map((row) => (
                  <tr key={row.n} className={row.state}>
                    <td className="num">{row.n}</td>
                    <td>{row.name}</td>
                    <td className="num">{row.date}</td>
                    <td className="r">{STATE_LABEL[row.state]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <figcaption className="ledger-foot">Encore 4 tours, jusqu'en mai 2027.</figcaption>
          </figure>
        </section>
      </div>

      <section className="section" id="comment">
        <div className="wrap">
          <h2 className="section-title">Quatre étapes, puis la tontine tourne toute seule</h2>
          <p className="section-lede">
            Les mêmes règles qu'une tontine entre proches, sans les calculs ni les relances gênantes.
          </p>
          <ol className="steps">
            {STEPS.map(({ title, text }) => (
              <li key={title}>
                <b>{title}</b>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="tirage">
        <div className="wrap grid-2">
          <div>
            <h2 className="section-title">Payer à l'heure rapporte des tickets</h2>
            <p className="section-lede">
              Tous les dimanches à {drawTime}, heure de Lomé, des lots offerts par des partenaires sont tirés au sort parmi les
              tickets. Ton épargne, elle, ne dépend jamais de la chance.
            </p>
            <ul className="plain-list">
              <li>1 ticket pour chaque versement fait à l'heure et validé.</li>
              <li>1 ticket quand une personne que tu invites rejoint son premier cercle.</li>
              <li>{maxTicketsText}. Les tickets ne s'achètent pas.</li>
              <li>
                Participation gratuite possible sans versement : <Link href="/reglement">lire le règlement du jeu</Link>.
              </li>
            </ul>
          </div>
          <div className="tickets">
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
              <span className="no num">N° —</span>
              <span>
                <b>Quatrième ticket</b>
                <span className="sub">Verse ta part à l'heure pour l'obtenir.</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap does">
          <div>
            <h2 className="does-title">Ce que fait Pépite</h2>
            <ul className="does-list">
              {[
                "Tire l'ordre des tours au sort, de façon vérifiable.",
                'Envoie des rappels privés avant chaque date limite.',
                'Garde la trace de chaque versement et de sa référence Mixx ou Flooz.',
                'Calcule un score de fiabilité qui récompense la ponctualité.',
              ].map((t) => (
                <li key={t}>
                  <Check strokeWidth={2} aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="does-title">Ce que Pépite ne fait pas</h2>
            <ul className="does-list not">
              {[
                "Garder votre argent : il passe directement d'un membre à l'autre.",
                "Prêter de l'argent ou promettre des gains : une tontine n'est pas un placement.",
                'Remplacer la confiance : choisissez des personnes que vous connaissez.',
              ].map((t) => (
                <li key={t}>
                  <X strokeWidth={2} aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="questions">
        <div className="wrap faq-wrap">
          <h2 className="section-title">Ce qu'on nous demande souvent</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="wrap">
          <h2>Ton cercle peut commencer ce mois-ci</h2>
          <p>L'inscription prend dix secondes, avec ton prénom.</p>
          <Link href="/connexion" className="btn gold">
            Créer mon compte
          </Link>
        </div>
      </section>
    </>
  );
}
