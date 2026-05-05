import { createBlock } from './block-registry';
import { PageLayout } from '../types';

export const templateOptions = [
  'Blank',
  'Business',
  'Portfolio',
  'Personal',
  'Agency',
  'Education',
  'Restaurant',
] as const;

export type TemplateOption = (typeof templateOptions)[number];

export const createTemplateLayout = (
  template: TemplateOption,
  siteId?: string,
  pageId?: string
): PageLayout => {
  const base: PageLayout = {
    version: 1,
    siteId,
    pageId,
    theme: { overrides: {} },
    blocks: [],
    updatedAt: new Date().toISOString(),
  };

  if (template === 'Blank') return base;

  const blocks =
    template === 'Portfolio'
      ? ['navbar', 'hero', 'gallery', 'carousel', 'testimonials', 'contact', 'footer']
      : template === 'Restaurant'
        ? ['navbar', 'hero', 'features', 'gallery', 'pricing', 'location', 'contact', 'footer']
        : template === 'Education'
          ? ['navbar', 'hero', 'featureList', 'stats', 'team', 'faq', 'contact', 'footer']
          : ['navbar', 'hero', 'features', 'stats', 'gallery', 'pricing', 'faq', 'cta', 'footer'];

  return {
    ...base,
    blocks: blocks.map((type) => createBlock(type as any)),
  };
};
