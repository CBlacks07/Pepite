// Règles de Pépite : une seule source pour l'API (validation), les écrans (limites
// des champs) et les textes affichés. Importable côté client comme côté serveur.
//
// Les fonctions SQL (db/migrations) appliquent aussi certaines de ces règles
// (4 tickets par tirage, tirage le dimanche à 20 h). Si tu en changes une ici,
// écris la migration qui la change aussi en base.

/** Fuseau de Lomé : UTC toute l'année, sans heure d'été. */
export const TIMEZONE = 'Africa/Lome';

export const CIRCLE = {
  nameMax: 40,
  /** Montant d'une part, en francs CFA. */
  amountMin: 1_000,
  amountMax: 1_000_000,
  amountDefault: 25_000,
  sizeMin: 3,
  sizeMax: 20,
  sizeDefault: 8,
  inviteCodeLength: 6,
} as const;

export const DRAW = {
  /** Heure du tirage du dimanche, à Lomé. */
  hour: 20,
  maxTicketsPerPerson: 4,
  prizeLabelMax: 80,
  prizeValueMax: 100_000_000,
  prizeQuantityMax: 1_000,
  sponsorNameMax: 80,
  sponsorContactMax: 120,
} as const;

export const TEXT = {
  displayNameMax: 40,
  paymentReferenceMax: 80,
  reminderMax: 500,
  adminNoteMin: 3,
  adminNoteMax: 300,
} as const;

/** Un reçu déclaré mais pas validé au-delà de ce délai remonte dans les litiges. */
export const STALE_RECEIPT_DAYS = 3;

/** « 20 h » */
export const drawTime = `${DRAW.hour} h`;
/** « dimanche à 20 h (heure de Lomé) » */
export const drawWhen = `dimanche à ${drawTime} (heure de Lomé)`;
export const maxTicketsText = `${DRAW.maxTicketsPerPerson} tickets au maximum par tirage`;

/** Délai minimum entre deux rappels d'un membre à un autre, pour un même tour. */
export const REMINDER_COOLDOWN_HOURS = 24;

/** Poids du score de fiabilité, en pourcentage (total 100). */
export const SCORE_WEIGHTS = { punctuality: 70, seniority: 20, completed: 10 } as const;

/** Limites par adresse IP. Larges, car beaucoup d'abonnés mobiles partagent la même adresse. */
export const RATE_LIMITS = {
  /** Comptes créés. */
  signup: { max: 20, windowSeconds: 60 * 60 },
  /** Codes de secours faux : au-delà, plus aucun essai jusqu'à la fenêtre suivante. */
  recoverFailures: { max: 10, windowSeconds: 15 * 60 },
} as const;
