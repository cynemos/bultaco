// Adresse lisible pour une étape : « 2025-09-04-reservoir »
export const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const stepSlug = (step: { date: string; title: string }) => `${step.date}-${slugify(step.title)}`;
