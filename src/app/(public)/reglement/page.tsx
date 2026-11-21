import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Règlement du jeu' };

export default function Reglement() {
  return (
    <LegalPage eyebrow="Tirage du dimanche" title="Règlement du jeu" updated="21 novembre 2026">
      <h2>1. Organisateur</h2>
      <p>
        Le jeu « Tirage du dimanche » est organisé par [raison sociale], [adresse], Lomé, Togo (ci-après
        « l'Organisateur »), éditeur du service Pépite.
      </p>

      <h2>2. Principe</h2>
      <p>
        Le Tirage du dimanche est un jeu gratuit, sans obligation d'achat. Il récompense la régularité des membres de
        Pépite par des lots offerts par des partenaires. Aucun lot n'est financé par les cagnottes des cercles.
      </p>

      <h2>3. Qui peut participer</h2>
      <p>
        Toute personne physique majeure titulaire d'un compte Pépite non suspendu. Les membres de l'équipe Pépite et
        les représentants du partenaire de la semaine ne peuvent pas gagner les lots de ce partenaire.
      </p>

      <h2>4. Les tickets</h2>
      <ul>
        <li>1 ticket pour chaque versement fait au plus tard à la date limite et validé par le bénéficiaire du tour.</li>
        <li>1 ticket quand une personne invitée rejoint son premier cercle (pour l'organisateur de ce cercle).</li>
        <li>4 tickets au maximum par personne et par tirage.</li>
        <li>
          Les tickets ne s'achètent pas, ne se cèdent pas et n'ont aucune valeur en argent. Un ticket vaut pour le
          tirage qui suit son obtention.
        </li>
      </ul>

      <h2>5. Participation gratuite sans versement</h2>
      <p>
        Toute personne peut obtenir un ticket par tirage sans faire de versement, sur simple demande adressée à
        l'Organisateur ([contact]) au plus tard le dimanche à 18 h, heure de Lomé. Le ticket est ajouté à son compte
        avant le tirage.
      </p>

      <h2>6. Déroulement du tirage</h2>
      <p>
        Le tirage a lieu chaque dimanche à 20 h, heure de Lomé. Au moment du tirage, un code aléatoire est généré. Les
        tickets sont classés selon l'empreinte md5 de ce code suivi de leur numéro, puis les lots sont attribués dans
        cet ordre, du lot le plus élevé au plus faible. Le code est conservé et communiqué à toute personne qui le
        demande, ce qui permet de vérifier le résultat.
      </p>

      <h2>7. Les lots</h2>
      <p>
        Les lots et le nom du partenaire sont annoncés dans l'application avant le tirage. Ils ne peuvent pas être
        échangés contre de l'argent, sauf mention contraire.
      </p>

      <h2>8. Gagnants et remise des lots</h2>
      <p>
        Les gagnants sont informés dans l'application. L'Organisateur les contacte pour organiser la remise, dans un
        délai de 30 jours. Un lot non réclamé dans les 60 jours suivant le tirage est perdu.
      </p>

      <h2>9. Fraude</h2>
      <p>
        Les comptes multiples, les fausses déclarations de versement et toute tentative de manipulation entraînent
        l'annulation des tickets concernés et peuvent entraîner la suspension du compte.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Les données utilisées pour le jeu sont décrites dans la{' '}
        <a href="/confidentialite" style={{ color: 'var(--brand)', fontWeight: 600 }}>
          politique de confidentialité
        </a>
        .
      </p>

      <h2>11. Modification et réclamations</h2>
      <p>
        L'Organisateur peut modifier ou suspendre le jeu en cas de nécessité ; les membres en sont informés dans
        l'application. Toute réclamation est à adresser par écrit à l'Organisateur ([contact]). Le présent règlement est
        soumis au droit togolais.
      </p>
    </LegalPage>
  );
}
