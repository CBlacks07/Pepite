// Couleurs dont le navigateur a besoin hors CSS (manifeste PWA, barre d'adresse).
// Elles reprennent les jetons --screen et --brand de src/app/globals.css.
export const THEME = {
  light: { screen: '#f3f4f7', brand: '#22306b' },
  dark: { screen: '#12141c', brand: '#aebcf2' },
} as const;
