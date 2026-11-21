import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Confidentialité' };

export default function Confidentialite() {
  return (
    <LegalPage eyebrow="Informations légales" title="Politique de confidentialité" updated="21 novembre 2026">
      <h2>1. Responsable</h2>
      <p>[Raison sociale], [adresse], Lomé, Togo. Contact pour toute question sur vos données : [contact].</p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Votre prénom.</li>
        <li>
          L'empreinte de votre code de secours (le code lui-même n'est jamais conservé) et un cookie de session pour
          rester connecté.
        </li>
        <li>Vos cercles, vos versements déclarés (moyen de paiement, référence, dates) et leurs validations.</li>
        <li>Les rappels envoyés et reçus, vos tickets et vos éventuels gains au Tirage du dimanche.</li>
      </ul>
      <p>Pour l'instant, Pépite ne demande ni numéro de téléphone, ni adresse, ni pièce d'identité.</p>

      <h2>3. Pourquoi</h2>
      <p>
        Uniquement pour faire fonctionner le service : organiser les cercles, suivre les versements, calculer le score
        de fiabilité, organiser le Tirage du dimanche et aider en cas de litige. Aucune donnée n'est vendue ni utilisée
        pour de la publicité.
      </p>

      <h2>4. Qui voit quoi</h2>
      <ul>
        <li>Les membres d'un cercle voient les prénoms des autres membres et l'état de leurs versements dans ce cercle.</li>
        <li>Un rappel n'est visible que par la personne qui l'envoie et celle qui le reçoit.</li>
        <li>L'équipe Pépite peut consulter les données pour aider les membres, régler un litige ou lutter contre la fraude.</li>
      </ul>

      <h2>5. Hébergement</h2>
      <p>
        L'application est hébergée par Vercel et la base de données par Neon, sur des serveurs situés aux États-Unis.
        Vos données sont donc stockées hors du Togo, chez ces prestataires techniques.
      </p>

      <h2>6. Durée de conservation</h2>
      <p>
        Les données sont conservées tant que le compte est actif, puis supprimées ou anonymisées dans un délai de [durée]
        après la fermeture du compte, sauf obligation légale de les garder plus longtemps.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Vous pouvez demander à consulter, corriger ou supprimer vos données en écrivant à [contact]. Vous pouvez aussi
        saisir l'autorité togolaise chargée de la protection des données personnelles.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Pépite utilise un seul cookie, nécessaire pour rester connecté. Il n'y a ni cookie publicitaire, ni outil de
        mesure d'audience tiers.
      </p>
    </LegalPage>
  );
}
