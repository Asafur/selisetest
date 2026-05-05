export type SiteStatus = 'active' | 'archived';
export type PageStatus = 'draft' | 'published';
export type BuilderRole = 'owner' | 'editor' | 'viewer';
export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export type BlockType =
  | 'navbar'
  | 'hero'
  | 'text'
  | 'stats'
  | 'featureList'
  | 'image'
  | 'gallery'
  | 'carousel'
  | 'cta'
  | 'contact'
  | 'faq'
  | 'accordion'
  | 'tabs'
  | 'timeline'
  | 'table'
  | 'codeEmbed'
  | 'blogArticle'
  | 'features'
  | 'testimonials'
  | 'footer'
  | 'pricing'
  | 'team'
  | 'location'
  | 'video';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type BlockProps = Record<string, JsonValue>;
export type BlockStyle = Record<string, JsonValue>;

export interface VibeBlock {
  id: string;
  type: BlockType;
  props: BlockProps;
  style?: BlockStyle;
  children?: VibeBlock[];
}

export interface PageLayout {
  version: number;
  pageId?: string;
  siteId?: string;
  theme?: {
    themeId?: string;
    overrides?: Record<string, JsonValue>;
  };
  blocks: VibeBlock[];
  updatedAt?: string;
}

export interface VibeSite {
  id: string;
  workspaceId?: string;
  ownerUserId: string;
  name: string;
  slug: string;
  description?: string;
  logoAssetId?: string;
  logoUrl?: string;
  themeId?: string;
  themeJson?: string;
  mediaAssets?: VibeAsset[];
  status: SiteStatus;
  isPublished?: boolean;
  homepagePageId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VibePage {
  id: string;
  workspaceId?: string;
  siteId: string;
  ownerUserId: string;
  title: string;
  slug: string;
  status: PageStatus;
  layoutJson?: string;
  draftLayoutJson?: string;
  publishedLayoutJson?: string;
  themeOverrideJson?: string;
  sortOrder?: number;
  isHomePage?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface VibeTheme {
  id: string;
  workspaceId?: string;
  siteId: string;
  name: string;
  templateType?: string;
  colorsJson?: string;
  typographyJson?: string;
  spacingJson?: string;
  buttonStyleJson?: string;
  sectionStyleJson?: string;
  headerStyleJson?: string;
  footerStyleJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VibeAsset {
  id: string;
  workspaceId?: string;
  siteId: string;
  ownerUserId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  mediaBlockId?: string;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VibeContactSubmission {
  id?: string;
  workspaceId?: string;
  siteId: string;
  pageId: string;
  blockId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt?: string;
}

export interface CurrentBuilderUser {
  userId: string;
  workspaceId?: string;
  email?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNo?: number;
  pageSize?: number;
}

export interface DataGatewayWriteResult {
  itemId?: string;
  totalImpactedData?: number;
  acknowledged?: boolean;
}

export interface SiteCreateInput {
  ownerUserId: string;
  workspaceId?: string;
  name: string;
  slug: string;
  description?: string;
}

export interface SiteUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  logoAssetId?: string;
  logoUrl?: string;
  themeId?: string;
  themeJson?: string;
  mediaAssets?: VibeAsset[];
  status?: SiteStatus;
  isPublished?: boolean;
  homepagePageId?: string;
}

export interface PageCreateInput {
  ownerUserId: string;
  workspaceId?: string;
  siteId: string;
  title: string;
  slug: string;
  isHomePage?: boolean;
  sortOrder?: number;
  layout?: PageLayout;
}

export interface PageUpdateInput {
  title?: string;
  slug?: string;
  status?: PageStatus;
  layoutJson?: string;
  draftLayoutJson?: string;
  publishedLayoutJson?: string;
  themeOverrideJson?: string;
  sortOrder?: number;
  isHomePage?: boolean;
  publishedAt?: string;
}
