import { PageLayout, VibeBlock } from '../types';

export interface StoredPageLayoutEnvelope {
  version: 1;
  status?: 'draft' | 'published';
  draftLayout?: PageLayout;
  publishedLayout?: PageLayout;
  isHomePage?: boolean;
  publishedAt?: string;
  themeOverrideJson?: string;
}

export const emptyLayout = (siteId?: string, pageId?: string): PageLayout => ({
  version: 1,
  siteId,
  pageId,
  theme: {
    overrides: {},
  },
  blocks: [],
  updatedAt: new Date().toISOString(),
});

const isPageLayout = (value: unknown): value is PageLayout =>
  Boolean(value && typeof value === 'object' && Array.isArray((value as PageLayout).blocks));

export const parseStoredPageEnvelope = (
  raw?: string | null,
  fallbackSiteId?: string,
  fallbackPageId?: string
): StoredPageLayoutEnvelope => {
  if (!raw) {
    return {
      version: 1,
      status: 'draft',
      draftLayout: emptyLayout(fallbackSiteId, fallbackPageId),
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredPageLayoutEnvelope | PageLayout | VibeBlock[];

    if (Array.isArray(parsed) || isPageLayout(parsed)) {
      return {
        version: 1,
        status: 'draft',
        draftLayout: parseLayout(raw, fallbackSiteId, fallbackPageId),
      };
    }

    const draftLayout = parsed.draftLayout
      ? parseLayout(JSON.stringify(parsed.draftLayout), fallbackSiteId, fallbackPageId)
      : emptyLayout(fallbackSiteId, fallbackPageId);
    const publishedLayout = parsed.publishedLayout
      ? parseLayout(JSON.stringify(parsed.publishedLayout), fallbackSiteId, fallbackPageId)
      : undefined;

    return {
      version: 1,
      status: parsed.status || (publishedLayout ? 'published' : 'draft'),
      draftLayout,
      publishedLayout,
      isHomePage: parsed.isHomePage,
      publishedAt: parsed.publishedAt,
      themeOverrideJson: parsed.themeOverrideJson,
    };
  } catch {
    return {
      version: 1,
      status: 'draft',
      draftLayout: emptyLayout(fallbackSiteId, fallbackPageId),
    };
  }
};

export const parseLayout = (
  raw?: string | null,
  fallbackSiteId?: string,
  fallbackPageId?: string
): PageLayout => {
  if (!raw) return emptyLayout(fallbackSiteId, fallbackPageId);

  try {
    const parsed = JSON.parse(raw) as PageLayout | VibeBlock[];
    if (Array.isArray(parsed)) {
      return {
        ...emptyLayout(fallbackSiteId, fallbackPageId),
        blocks: parsed,
      };
    }

    return {
      ...emptyLayout(fallbackSiteId, fallbackPageId),
      ...parsed,
      blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
    };
  } catch {
    return emptyLayout(fallbackSiteId, fallbackPageId);
  }
};

export const serializeLayout = (layout: PageLayout) =>
  JSON.stringify(
    {
      ...layout,
      updatedAt: new Date().toISOString(),
    },
    null,
    2
  );

export const serializeStoredPageEnvelope = (params: {
  draftLayout: PageLayout;
  publishedLayout?: PageLayout;
  status?: 'draft' | 'published';
  isHomePage?: boolean;
  publishedAt?: string;
  themeOverrideJson?: string;
}) =>
  JSON.stringify(
    {
      version: 1,
      status: params.status || (params.publishedLayout ? 'published' : 'draft'),
      draftLayout: {
        ...params.draftLayout,
        updatedAt: new Date().toISOString(),
      },
      ...(params.publishedLayout
        ? {
            publishedLayout: {
              ...params.publishedLayout,
              updatedAt: new Date().toISOString(),
            },
          }
        : {}),
      ...(params.isHomePage !== undefined ? { isHomePage: params.isHomePage } : {}),
      ...(params.publishedAt ? { publishedAt: params.publishedAt } : {}),
      ...(params.themeOverrideJson ? { themeOverrideJson: params.themeOverrideJson } : {}),
    },
    null,
    2
  );

export const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
};
