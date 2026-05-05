import { VibeAsset, VibePage, VibeSite } from '../types';
import { parseStoredPageEnvelope, serializeLayout } from './layout';

const META_TAG_PREFIX = 'vibebuilder:meta:';

const field = <T,>(record: Record<string, any>, ...keys: string[]): T | undefined => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key] as T;
  }
  return undefined;
};

export const recordId = (record: Record<string, any>) =>
  field<string>(record, 'ItemId', 'itemId', 'Id', 'id') || '';

export const readSiteMeta = (tags?: string[]) => {
  const metaTag = (tags || []).find((tag) => tag.startsWith(META_TAG_PREFIX));
  if (!metaTag) return {};

  try {
    return JSON.parse(decodeURIComponent(metaTag.slice(META_TAG_PREFIX.length))) as Record<string, any>;
  } catch {
    return {};
  }
};

export const writeSiteMetaTags = (meta: Record<string, any>) => [
  `${META_TAG_PREFIX}${encodeURIComponent(JSON.stringify(meta))}`,
];

export const normalizeSite = (record: Record<string, any>): VibeSite => {
  const tags = field<string[]>(record, 'Tags', 'tags') || [];
  const meta = readSiteMeta(tags);
  const isPublished = Boolean(field<boolean>(record, 'IsPublished', 'isPublished'));

  return {
    id: recordId(record),
    workspaceId: field(record, 'WorkspaceId', 'workspaceId'),
    ownerUserId: field(record, 'OwnerId', 'ownerId', 'OwnerUserId', 'ownerUserId') || '',
    name: field(record, 'Title', 'title', 'Name', 'name') || 'Untitled site',
    slug: field(record, 'Slug', 'slug') || recordId(record),
    description: meta.description || field(record, 'Description', 'description'),
    logoAssetId: meta.logoAssetId || field(record, 'LogoAssetId', 'logoAssetId'),
    logoUrl: meta.logoUrl || field(record, 'LogoUrl', 'logoUrl'),
    themeId: meta.themeId || field(record, 'ThemeId', 'themeId'),
    themeJson: meta.themeJson,
    mediaAssets: Array.isArray(meta.mediaAssets) ? meta.mediaAssets : [],
    status: meta.status || 'active',
    isPublished,
    homepagePageId: meta.homepagePageId,
    createdAt: field(record, 'CreatedDate', 'createdAt'),
    updatedAt: field(record, 'LastUpdatedDate', 'updatedAt'),
  };
};

export const normalizePage = (record: Record<string, any>): VibePage => {
  const id = recordId(record);
  const siteId = field<string>(record, 'ProjectId', 'projectId', 'SiteId', 'siteId') || '';
  const envelope = parseStoredPageEnvelope(
    field<string>(record, 'Layout', 'layout', 'LayoutJson', 'layoutJson'),
    siteId,
    id
  );
  const draftLayout = envelope.draftLayout;
  const publishedLayout = envelope.publishedLayout;

  return {
    id,
    workspaceId: field(record, 'WorkspaceId', 'workspaceId'),
    siteId,
    ownerUserId: field(record, 'OwnerUserId', 'ownerUserId') || '',
    title: field(record, 'Title', 'title') || 'Untitled page',
    slug: field(record, 'Slug', 'slug') || id,
    status: envelope.status || (publishedLayout ? 'published' : 'draft'),
    layoutJson: draftLayout ? serializeLayout(draftLayout) : undefined,
    draftLayoutJson: draftLayout ? serializeLayout(draftLayout) : undefined,
    publishedLayoutJson: publishedLayout ? serializeLayout(publishedLayout) : '',
    themeOverrideJson: envelope.themeOverrideJson || '{}',
    sortOrder: field(record, 'PageOrder', 'pageOrder', 'SortOrder', 'sortOrder') || 0,
    isHomePage: envelope.isHomePage || field(record, 'IsHomePage', 'isHomePage') || false,
    createdAt: field(record, 'CreatedDate', 'createdAt'),
    updatedAt: field(record, 'LastUpdatedDate', 'updatedAt'),
    publishedAt: envelope.publishedAt,
  };
};

export const normalizeAsset = (record: Record<string, any>): VibeAsset => ({
  id: recordId(record),
  workspaceId: field(record, 'WorkspaceId', 'workspaceId'),
  siteId: field(record, 'SiteId', 'siteId') || '',
  ownerUserId: field(record, 'OwnerUserId', 'ownerUserId') || '',
  fileName: field(record, 'FileName', 'fileName') || 'Untitled file',
  fileUrl: field(record, 'FileUrl', 'fileUrl') || '',
  fileType: field(record, 'FileType', 'fileType'),
  fileSize: field(record, 'FileSize', 'fileSize') || 0,
  mediaBlockId: field(record, 'MediaBlockId', 'mediaBlockId'),
  uploadedBy: field(record, 'UploadedBy', 'uploadedBy'),
  createdAt: field(record, 'CreatedDate', 'createdAt'),
  updatedAt: field(record, 'LastUpdatedDate', 'updatedAt'),
});

export const makeOwnerFilter = (ownerUserId: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    OwnerId: ownerUserId,
    ...extra,
  });

export const makePublicFilter = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    ...extra,
  });
