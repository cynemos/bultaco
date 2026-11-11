// Formats d'affichage en français

// « 2025-08-12 » → « 12 août 2025 ». La date est lue telle quelle (sans fuseau
// horaire) pour éviter qu'un 1er du mois s'affiche la veille.
export const formatDateFr = (iso?: string | null, options: { short?: boolean } = {}) => {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: options.short ? 'short' : 'long',
    year: 'numeric'
  });
};

export const formatEuro = (amount: number, digits = 2) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(amount);
