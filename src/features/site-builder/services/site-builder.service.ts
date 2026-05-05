import { graphqlClient } from '@/lib/graphql-client';
import { getPreSignedUrlForUpload } from '@/lib/api/services/storage.service';
import { ModuleName } from '@/constant/modules.constants';
import {
  DataGatewayWriteResult,
  PageCreateInput,
  PageLayout,
  PageUpdateInput,
  PaginatedResult,
  SiteCreateInput,
  SiteUpdateInput,
  VibeAsset,
  VibeContactSubmission,
  VibePage,
  VibeSite,
} from '../types';
import {
  DELETE_VIBE_PAGE_MUTATION,
  DELETE_VIBE_SITE_MUTATION,
  INSERT_VIBE_CONTACT_SUBMISSION_MUTATION,
  INSERT_VIBE_PAGE_MUTATION,
  INSERT_VIBE_SITE_MUTATION,
  UPDATE_VIBE_PAGE_MUTATION,
  UPDATE_VIBE_SITE_MUTATION,
} from '../graphql/mutations';
import { GET_VIBE_PAGES_QUERY, GET_VIBE_SITES_QUERY } from '../graphql/queries';
import {
  emptyLayout,
  parseLayout,
  parseStoredPageEnvelope,
  serializeLayout,
  serializeStoredPageEnvelope,
} from '../utils/layout';
import {
  makeOwnerFilter,
  makePublicFilter,
  normalizeAsset,
  normalizePage,
  normalizeSite,
  writeSiteMetaTags,
} from '../utils/record-mappers';

const PAGE_SIZE = 100;

const now = () => new Date().toISOString();

const listInput = (filter: string, sort = '{"LastUpdatedDate":-1}') => ({
  input: {
    filter,
    sort,
    pageNo: 1,
    pageSize: PAGE_SIZE,
  },
});

const writeFilter = (id: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    _id: id,
    ...extra,
  });

const mapResult = <T,>(response: any, key: string, mapper: (record: Record<string, any>) => T) => {
  const bucket = response?.[key] || {};
  return {
    items: Array.isArray(bucket.items) ? bucket.items.map(mapper) : [],
    totalCount: bucket.totalCount || 0,
    pageNo: bucket.pageNo,
    pageSize: bucket.pageSize,
  } satisfies PaginatedResult<T>;
};

export const listSites = async (ownerUserId: string) => {
  const response = await graphqlClient.query({
    query: GET_VIBE_SITES_QUERY,
    variables: listInput(makeOwnerFilter(ownerUserId)),
  });
  return mapResult<VibeSite>(response, 'getVibeProjects', normalizeSite);
};

export const getSiteById = async (siteId: string, ownerUserId: string) => {
  const response = await graphqlClient.query({
    query: GET_VIBE_SITES_QUERY,
    variables: listInput(makeOwnerFilter(ownerUserId, { _id: siteId })),
  });
  return mapResult<VibeSite>(response, 'getVibeProjects', normalizeSite).items[0] || null;
};

export const getPublishedSiteBySlug = async (slug: string) => {
  const response = await graphqlClient.query({
    query: GET_VIBE_SITES_QUERY,
    variables: listInput(makePublicFilter({ Slug: slug, IsPublished: true })),
  });
  return mapResult<VibeSite>(response, 'getVibeProjects', normalizeSite).items[0] || null;
};

export const createSite = async (payload: SiteCreateInput) => {
  const input = {
    OrganizationIds: payload.workspaceId ? [payload.workspaceId] : [],
    Tags: writeSiteMetaTags({ description: payload.description || '', mediaAssets: [] }),
    OwnerId: payload.ownerUserId,
    Title: payload.name,
    Slug: payload.slug,
    IsPublished: false,
  };

  const response = await graphqlClient.mutate<{ insertVibeProject: DataGatewayWriteResult }>({
    query: INSERT_VIBE_SITE_MUTATION,
    variables: { input },
  });

  return response.insertVibeProject;
};

export const updateSite = async (siteId: string, ownerUserId: string, payload: SiteUpdateInput) => {
  const currentSite = await getSiteById(siteId, ownerUserId);
  const meta = {
    description: payload.description ?? currentSite?.description ?? '',
    logoAssetId: payload.logoAssetId ?? currentSite?.logoAssetId ?? '',
    logoUrl: payload.logoUrl ?? currentSite?.logoUrl ?? '',
    themeId: payload.themeId ?? currentSite?.themeId ?? '',
    themeJson: payload.themeJson ?? currentSite?.themeJson ?? '',
    mediaAssets: payload.mediaAssets ?? currentSite?.mediaAssets ?? [],
    status: payload.status ?? currentSite?.status ?? 'active',
    homepagePageId: payload.homepagePageId ?? currentSite?.homepagePageId ?? '',
  };

  const input = {
    ...(payload.name !== undefined ? { Title: payload.name } : {}),
    ...(payload.slug !== undefined ? { Slug: payload.slug } : {}),
    ...(payload.isPublished !== undefined ? { IsPublished: payload.isPublished } : {}),
    Tags: writeSiteMetaTags(meta),
  };

  const response = await graphqlClient.mutate<{ updateVibeProject: DataGatewayWriteResult }>({
    query: UPDATE_VIBE_SITE_MUTATION,
    variables: { filter: writeFilter(siteId, { OwnerId: ownerUserId }), input },
  });

  return response.updateVibeProject;
};

export const deleteSite = async (siteId: string, ownerUserId: string) => {
  const response = await graphqlClient.mutate<{ deleteVibeProject: DataGatewayWriteResult }>({
    query: DELETE_VIBE_SITE_MUTATION,
    variables: {
      filter: writeFilter(siteId, { OwnerId: ownerUserId }),
      input: { isHardDelete: false },
    },
  });
  return response.deleteVibeProject;
};

export const listPages = async (siteId: string, ownerUserId: string) => {
  const site = await getSiteById(siteId, ownerUserId);
  if (!site) return { items: [], totalCount: 0, pageNo: 1, pageSize: PAGE_SIZE };

  const response = await graphqlClient.query({
    query: GET_VIBE_PAGES_QUERY,
    variables: listInput(makePublicFilter({ ProjectId: siteId }), '{"PageOrder":1}'),
  });
  return mapResult<VibePage>(response, 'getVibePages', normalizePage);
};

export const getPageById = async (pageId: string, ownerUserId: string, siteId?: string) => {
  if (siteId) {
    const site = await getSiteById(siteId, ownerUserId);
    if (!site) return null;
  }

  const response = await graphqlClient.query({
    query: GET_VIBE_PAGES_QUERY,
    variables: listInput(makePublicFilter({ _id: pageId, ...(siteId ? { ProjectId: siteId } : {}) })),
  });
  const page = mapResult<VibePage>(response, 'getVibePages', normalizePage).items[0] || null;
  if (!page || siteId) return page;
  const site = await getSiteById(page.siteId, ownerUserId);
  return site ? page : null;
};

export const getPublishedPage = async (siteId: string, pageSlug?: string) => {
  const filter = pageSlug
    ? makePublicFilter({ ProjectId: siteId, Slug: pageSlug })
    : makePublicFilter({ ProjectId: siteId });

  const response = await graphqlClient.query({
    query: GET_VIBE_PAGES_QUERY,
    variables: listInput(filter, '{"PageOrder":1}'),
  });
  const pages = mapResult<VibePage>(response, 'getVibePages', normalizePage).items;
  const publishedPages = pages.filter((page) => page.status === 'published' && page.publishedLayoutJson);
  if (pageSlug) return publishedPages[0] || null;
  return publishedPages.find((page) => page.isHomePage) || publishedPages[0] || null;
};

export const createPage = async (payload: PageCreateInput) => {
  const site = await getSiteById(payload.siteId, payload.ownerUserId);
  if (!site) throw new Error('Site not found or current user does not own it.');

  const layout = payload.layout || emptyLayout(payload.siteId);
  const draftLayout = {
    ...layout,
    siteId: payload.siteId,
  };
  const serializedLayout = serializeStoredPageEnvelope({
    draftLayout,
    status: 'draft',
    isHomePage: payload.isHomePage || false,
  });

  const input = {
    OrganizationIds: payload.workspaceId ? [payload.workspaceId] : [],
    Tags: [],
    ProjectId: payload.siteId,
    Title: payload.title,
    Slug: payload.slug,
    Layout: serializedLayout,
    PageOrder: payload.sortOrder || 0,
    SeoTitle: payload.title,
    SeoDescription: '',
  };

  const response = await graphqlClient.mutate<{ insertVibePage: DataGatewayWriteResult }>({
    query: INSERT_VIBE_PAGE_MUTATION,
    variables: { input },
  });

  return response.insertVibePage;
};

export const updatePage = async (pageId: string, ownerUserId: string, payload: PageUpdateInput) => {
  const currentPage = await getPageById(pageId, ownerUserId);
  if (!currentPage) throw new Error('Page not found or current user does not own the parent project.');
  const currentEnvelope = parseStoredPageEnvelope(
    currentPage.layoutJson
      ? serializeStoredPageEnvelope({
          draftLayout: parseLayout(currentPage.draftLayoutJson || currentPage.layoutJson, currentPage.siteId, pageId),
          publishedLayout: currentPage.publishedLayoutJson
            ? parseLayout(currentPage.publishedLayoutJson, currentPage.siteId, pageId)
            : undefined,
          status: currentPage.status,
          isHomePage: currentPage.isHomePage,
          publishedAt: currentPage.publishedAt,
          themeOverrideJson: currentPage.themeOverrideJson,
        })
      : undefined,
    currentPage.siteId,
    pageId
  );
  const draftLayout = payload.draftLayoutJson || payload.layoutJson
    ? parseLayout(payload.draftLayoutJson || payload.layoutJson, currentPage.siteId, pageId)
    : currentEnvelope.draftLayout || emptyLayout(currentPage.siteId, pageId);
  const publishedLayout = payload.publishedLayoutJson !== undefined
    ? payload.publishedLayoutJson
      ? parseLayout(payload.publishedLayoutJson, currentPage.siteId, pageId)
      : undefined
    : currentEnvelope.publishedLayout;

  const input = {
    ...(payload.title !== undefined ? { Title: payload.title } : {}),
    ...(payload.slug !== undefined ? { Slug: payload.slug } : {}),
    ...(payload.sortOrder !== undefined ? { PageOrder: payload.sortOrder } : {}),
    ...(payload.title !== undefined ? { SeoTitle: payload.title } : {}),
    ...(payload.layoutJson !== undefined ||
    payload.draftLayoutJson !== undefined ||
    payload.publishedLayoutJson !== undefined ||
    payload.status !== undefined ||
    payload.isHomePage !== undefined ||
    payload.publishedAt !== undefined ||
    payload.themeOverrideJson !== undefined
      ? {
          Layout: serializeStoredPageEnvelope({
            draftLayout,
            publishedLayout,
            status: payload.status || currentEnvelope.status || 'draft',
            isHomePage: payload.isHomePage ?? currentEnvelope.isHomePage,
            publishedAt: payload.publishedAt ?? currentEnvelope.publishedAt,
            themeOverrideJson: payload.themeOverrideJson ?? currentEnvelope.themeOverrideJson,
          }),
        }
      : {}),
  };

  const response = await graphqlClient.mutate<{ updateVibePage: DataGatewayWriteResult }>({
    query: UPDATE_VIBE_PAGE_MUTATION,
    variables: { filter: writeFilter(pageId, { ProjectId: currentPage.siteId }), input },
  });

  return response.updateVibePage;
};

export const publishPage = async (page: VibePage, ownerUserId: string, layout: PageLayout) => {
  const serialized = serializeLayout(layout);
  const result = await updatePage(page.id, ownerUserId, {
    status: 'published',
    layoutJson: serialized,
    draftLayoutJson: serialized,
    publishedLayoutJson: serialized,
    publishedAt: now(),
  });
  await updateSite(page.siteId, ownerUserId, { isPublished: true });
  return result;
};

export const deletePage = async (pageId: string, ownerUserId: string) => {
  const page = await getPageById(pageId, ownerUserId);
  if (!page) throw new Error('Page not found or current user does not own the parent project.');

  const response = await graphqlClient.mutate<{ deleteVibePage: DataGatewayWriteResult }>({
    query: DELETE_VIBE_PAGE_MUTATION,
    variables: {
      filter: writeFilter(pageId, { ProjectId: page.siteId }),
      input: { isHardDelete: false },
    },
  });
  return response.deleteVibePage;
};

export const listAssets = async (siteId: string, ownerUserId: string) => {
  const site = await getSiteById(siteId, ownerUserId);
  return {
    items: site?.mediaAssets || [],
    totalCount: site?.mediaAssets?.length || 0,
    pageNo: 1,
    pageSize: PAGE_SIZE,
  } satisfies PaginatedResult<VibeAsset>;
};

const uploadMediaFile = async (params: {
  siteId: string;
  ownerUserId: string;
  workspaceId?: string;
  file: File;
}) => {
  const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
  if (!projectKey) {
    throw new Error('Missing VITE_X_BLOCKS_KEY. Configure SELISE project key in a local .env file.');
  }

  const preSigned = await getPreSignedUrlForUpload({
    name: params.file.name,
    projectKey,
    moduleName: ModuleName.Construct,
    accessModifier: 'private',
    tags: 'vibebuilder',
    metaData: JSON.stringify({ siteId: params.siteId }),
  });

  if (!preSigned.isSuccess || !preSigned.uploadUrl || !preSigned.fileId) {
    throw new Error('SELISE Storage did not return an upload URL. Configure Storage/Media first.');
  }

  const uploadResponse = await fetch(preSigned.uploadUrl, {
    method: 'PUT',
    body: params.file,
    headers: {
      'Content-Type': params.file.type || 'application/octet-stream',
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`SELISE Media upload failed with status ${uploadResponse.status}.`);
  }

  return normalizeAsset({
    ItemId: preSigned.fileId,
    WorkspaceId: params.workspaceId || '',
    SiteId: params.siteId,
    OwnerUserId: params.ownerUserId,
    FileName: params.file.name,
    FileUrl: preSigned.uploadUrl.split('?')[0],
    FileType: params.file.type,
    FileSize: params.file.size,
    MediaBlockId: preSigned.fileId,
    UploadedBy: params.ownerUserId,
    CreatedDate: now(),
    LastUpdatedDate: now(),
  });
};

export const uploadAsset = async (params: {
  siteId: string;
  ownerUserId: string;
  workspaceId?: string;
  file: File;
}) => {
  const uploadedAsset = await uploadMediaFile(params);
  const site = await getSiteById(params.siteId, params.ownerUserId);
  if (!site) throw new Error('Site not found or current user does not own it.');
  const mediaAssets = [
    uploadedAsset,
    ...(site.mediaAssets || []).filter((asset) => asset.id !== uploadedAsset.id),
  ].slice(0, 80);

  await updateSite(params.siteId, params.ownerUserId, { mediaAssets });
  return {
    itemId: uploadedAsset.id,
    totalImpactedData: 1,
    acknowledged: true,
  };
};

export const uploadAssetAndReturnUrl = async (params: {
  siteId: string;
  ownerUserId: string;
  workspaceId?: string;
  file: File;
}) => {
  const uploadedAsset = await uploadMediaFile(params);
  const site = await getSiteById(params.siteId, params.ownerUserId);
  if (site) {
    const mediaAssets = [
      uploadedAsset,
      ...(site.mediaAssets || []).filter((asset) => asset.id !== uploadedAsset.id),
    ].slice(0, 80);
    await updateSite(params.siteId, params.ownerUserId, { mediaAssets });
  }
  return uploadedAsset.fileUrl;
};

export const deleteAsset = async (siteId: string, assetId: string, ownerUserId: string) => {
  const site = await getSiteById(siteId, ownerUserId);
  if (!site) throw new Error('Site not found or current user does not own it.');
  const mediaAssets = (site.mediaAssets || []).filter((asset) => asset.id !== assetId);
  await updateSite(siteId, ownerUserId, { mediaAssets });
  return {
    itemId: assetId,
    totalImpactedData: 1,
    acknowledged: true,
  };
};

export const saveSiteTheme = async (params: {
  siteId: string;
  ownerUserId: string;
  workspaceId?: string;
  name: string;
  templateType: string;
  colorsJson: string;
  typographyJson: string;
  spacingJson: string;
  buttonStyleJson: string;
  sectionStyleJson: string;
  headerStyleJson: string;
  footerStyleJson: string;
}) => {
  return updateSite(params.siteId, params.ownerUserId, {
    themeJson: JSON.stringify({
      name: params.name,
      templateType: params.templateType,
      colorsJson: params.colorsJson,
      typographyJson: params.typographyJson,
      spacingJson: params.spacingJson,
      buttonStyleJson: params.buttonStyleJson,
      sectionStyleJson: params.sectionStyleJson,
      headerStyleJson: params.headerStyleJson,
      footerStyleJson: params.footerStyleJson,
      updatedAt: now(),
    }),
  });
};

export const createContactSubmission = async (payload: VibeContactSubmission) => {
  const input = {
    OrganizationIds: payload.workspaceId ? [payload.workspaceId] : [],
    Tags: [],
    ProjectId: payload.siteId,
    PageId: payload.pageId,
    PageSlug: payload.blockId,
    FormData: JSON.stringify({
      blockId: payload.blockId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      message: payload.message,
    }),
    SubmittedAt: now(),
  };

  const response = await graphqlClient.mutate<{
    insertVibeFormSubmission: DataGatewayWriteResult;
  }>({
    query: INSERT_VIBE_CONTACT_SUBMISSION_MUTATION,
    variables: { input },
  });

  return response.insertVibeFormSubmission;
};
