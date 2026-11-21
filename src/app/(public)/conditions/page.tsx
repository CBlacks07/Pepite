import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function Conditions() {
  return (
    <LegalPage eyebrow="Informations légales" title="Conditions d'utilisation" updated="21 novembre 2026">
      <h2>1. Le service</h2>
      <p>
        Pépite, édité par [raison sociale], [adresse], Lomé, Togo, aide des proches à organiser une tontine : tirage de
        l'ordre des tours, suivi des versements, rappels, preuves de paiement, score de fiabilité et Tirage du dimanche.
      </p>

      <h2>2. Pépite ne détient pas votre argent</h2>
      <p>
        Les versements se font directement entre les membres (Mixx by Yas, Flooz, virement ou espèces). Pépite n'est ni
        une banque, ni un établissement de paiement, ni un organisme de crédit. Pépite ne garantit pas qu'un membre
        paiera sa part et ne donne aucun conseil financier.
      </p>

      <h2>3. Compte</h2>
      <p>
        L'inscription se fait avec un prénom. Un code de secours est affiché à l'inscription : il permet de retrouver
        son compte sur un autre appareil. Chacun est responsable de garder ce code pour lui. Une personne ne doit avoir
        qu'un seul compte.
      </p>

      <h2>4. Engagements des membres</h2>
      <ul>
        <li>Verser sa part à temps, selon les règles acceptées par le cercle.</li>
        <li>Déclarer uniquement des versements réellement effectués, avec leur vraie référence.</li>
        <li>Valider un versement seulement après avoir reçu l'argent.</li>
        <li>Rester respectueux dans les rappels et les échanges.</li>
      </ul>

      <h2>5. Litiges entre membres</h2>
      <p>
        En cas de désaccord sur un versement, l'équipe Pépite peut examiner les preuves disponibles et corriger le
        statut d'un versement. Cette aide ne remplace pas un accord entre les membres ni une décision de justice.
      </p>

      <h2>6. Suspension</h2>
      <p>
        Pépite peut suspendre un compte en cas de fraude, de fausses déclarations, de comptes multiples ou de
        comportement abusif. La personne concernée peut demander des explications à [contact].
      </p>

      <h2>7. Prix</h2>
      <p>Pépite est gratuit pendant la phase de lancement. Tout changement sera annoncé à l'avance dans l'application.</p>

      <h2>8. Responsabilité</h2>
      <p>
        Pépite fait de son mieux pour que le service soit disponible et exact, sans pouvoir le garantir à tout moment.
        Pépite n'est pas responsable des sommes non versées par un membre.
      </p>

      <h2>9. Modifications et droit applicable</h2>
      <p>
        Ces conditions peuvent évoluer ; la version en vigueur est toujours disponible sur cette page. Elles sont
        soumises au droit togolais.
      </p>
    </LegalPage>
  );
}
