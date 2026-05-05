export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const ensureSlug = (value: string, fallback = 'untitled') => slugify(value) || fallback;
