// Libellés français partagés par l'espace membre et l'administration.
export const CIRCLE_STATUS: Record<string, string> = {
  forming: 'En formation',
  active: 'Actif',
  completed: 'Terminé',
};

export const METHOD: Record<string, string> = {
  mobile_money: 'Mobile money',
  bank_transfer: 'Virement',
  cash: 'Espèces',
};

export const TICKET_SOURCE: Record<string, string> = {
  on_time: "Versement à l'heure",
  loyalty: 'Bonus régularité',
  invite: 'Invitation acceptée',
  free_entry: 'Participation gratuite',
};

export const ADMIN_ACTION: Record<string, string> = {
  block: 'Compte suspendu',
  unblock: 'Compte rétabli',
  free_ticket: 'Ticket gratuit accordé',
  resolve_paid: 'Versement validé (litige)',
  resolve_due: 'Reçu refusé (litige)',
  plan_draw: 'Tirage préparé',
  add_prize: 'Lot ajouté',
  delete_prize: 'Lot retiré',
  run_draw: 'Tirage du dimanche effectué',
  draw_witnesses: 'Témoins du tirage',
  deliver_prize: 'Lot remis',
};
