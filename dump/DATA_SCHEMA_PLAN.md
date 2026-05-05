# Data Schema Plan

Last updated: 2026-05-02

## Current Decision

Use the SELISE Blocks Data Gateway schemas that already exist in the current project. A 2026-05-05 introspection probe confirmed these schema names are available:

- `VibeProject`
- `VibePage`
- `VibeFormSubmission`

The frontend now calls generated operations such as `getVibeProjects`, `insertVibeProject`, `getVibePages`, `updateVibePage`, and `insertVibeFormSubmission`.

Do not create duplicate schemas with older names unless the current schemas are intentionally retired.

## Existing Schema: VibeProject

Fields discovered:

- `ItemId`
- `CreatedDate`
- `LastUpdatedDate`
- `CreatedBy`
- `Language`
- `LastUpdatedBy`
- `OrganizationIds`
- `Tags`
- `Title`
- `Slug`
- `OwnerId`
- `IsPublished`

Usage:

- Maps to VibeBuilder Website/Site.
- `Title` is the site name.
- `OwnerId` is the SELISE user id used for owner isolation.
- `IsPublished` gates public site rendering.
- `Tags` stores encoded VibeBuilder metadata for MVP-only fields not present as first-class columns:
  - description
  - logo fields
  - homepage page id
  - theme JSON
  - media asset index

## Existing Schema: VibePage

Fields discovered:

- `ItemId`
- `CreatedDate`
- `LastUpdatedDate`
- `CreatedBy`
- `Language`
- `LastUpdatedBy`
- `OrganizationIds`
- `Tags`
- `ProjectId`
- `Title`
- `Slug`
- `Layout`
- `PageOrder`
- `SeoTitle`
- `SeoDescription`

Usage:

- Maps to VibeBuilder Page.
- `ProjectId` links to `VibeProject.ItemId`.
- `Layout` is a string field containing the VibeBuilder page envelope:

```json
{
  "version": 1,
  "status": "draft",
  "draftLayout": {},
  "publishedLayout": {},
  "isHomePage": true,
  "publishedAt": "ISO_DATE"
}
```

The nested `draftLayout` and `publishedLayout` values contain the versioned block layout with `blocks[]`.

## Existing Schema: VibeFormSubmission

Fields discovered:

- `ItemId`
- `CreatedDate`
- `LastUpdatedDate`
- `CreatedBy`
- `Language`
- `LastUpdatedBy`
- `OrganizationIds`
- `Tags`
- `ProjectId`
- `PageId`
- `PageSlug`
- `FormData`
- `SubmittedAt`

Usage:

- Contact form submissions write to this schema.
- `FormData` is stringified JSON containing `blockId`, `name`, `email`, `phone`, and `message`.

## Optional Hardening Schemas

These are still good schema additions if the assignment reviewer expects first-class records instead of metadata fields:

- `VibeAsset`
- `VibeUserRole`
- `VibeTheme`
- `VibePublishRecord`

For now, media asset metadata and theme settings persist through `VibeProject.Tags` so the app does not invent fake APIs or require duplicate schemas.

## Older Full Schema Target: VibeSite

The following older full schema target remains useful as a long-term normalized design, but the current implementation does not require `VibeSite` because `VibeProject` already exists.

- `WorkspaceId`: String
- `OwnerUserId`: String
- `Name`: String
- `Slug`: String, unique if SELISE validation supports it
- `Description`: String
- `LogoAssetId`: String
- `LogoUrl`: String
- `ThemeId`: String
- `Status`: String, values `active` or `archived`
- `HomepagePageId`: String
- `CreatedDate`: Date/String
- `LastUpdatedDate`: Date/String
- `IsDeleted`: Boolean

Access:

- Owner/editor create/edit/delete by `OwnerUserId` or matching `VibeUserRole`.
- Public read only for active published site routing fields if required by `/vibe/:siteSlug`.

## Older Full Schema Target: VibePage

The current `VibePage` schema exists with fewer fields. Draft/publish metadata is stored in `Layout`.

- `WorkspaceId`: String
- `SiteId`: String
- `OwnerUserId`: String
- `Title`: String
- `Slug`: String
- `Status`: String, values `draft` or `published`
- `LayoutJson`: Long String or JSON/object
- `DraftLayoutJson`: Long String or JSON/object
- `PublishedLayoutJson`: Long String or JSON/object
- `ThemeOverrideJson`: Long String or JSON/object
- `SortOrder`: Number
- `IsHomePage`: Boolean
- `CreatedDate`: Date/String
- `LastUpdatedDate`: Date/String
- `PublishedAt`: Date/String
- `IsDeleted`: Boolean

Access:

- Authenticated owner/editor can read/write drafts.
- Public users can read only pages where `Status` is `published`, preferably only `PublishedLayoutJson` and safe display fields.

## Optional Schema: VibeTheme

- `WorkspaceId`: String
- `SiteId`: String
- `Name`: String
- `TemplateType`: String
- `ColorsJson`: Long String or JSON/object
- `TypographyJson`: Long String or JSON/object
- `SpacingJson`: Long String or JSON/object
- `ButtonStyleJson`: Long String or JSON/object
- `SectionStyleJson`: Long String or JSON/object
- `HeaderStyleJson`: Long String or JSON/object
- `FooterStyleJson`: Long String or JSON/object
- `CreatedDate`: Date/String
- `LastUpdatedDate`: Date/String
- `IsDeleted`: Boolean

## Optional Schema: VibeAsset

- `WorkspaceId`: String
- `SiteId`: String
- `OwnerUserId`: String
- `FileName`: String
- `FileUrl`: String
- `FileType`: String
- `FileSize`: Number
- `MediaBlockId`: String
- `UploadedBy`: String
- `CreatedDate`: Date/String
- `LastUpdatedDate`: Date/String
- `IsDeleted`: Boolean

Storage/Media requirement:

- Configure SELISE Storage/Media so `/uds/v1/Files/GetPreSignedUrlForUpload` returns a usable upload URL and file ID.
- The app then inserts a `VibeAsset` record pointing to that SELISE media object.

## Optional Schema: VibeUserRole

- `WorkspaceId`: String
- `SiteId`: String
- `UserId`: String
- `Role`: String, values `owner`, `editor`, `viewer`
- `CreatedDate`: Date/String
- `LastUpdatedDate`: Date/String
- `IsDeleted`: Boolean

MVP state:

- Frontend enforces owner filtering first.
- Collaborator UI is intentionally blocked until this schema and SELISE IAM permissions are configured.

## Older Full Schema Target: VibeContactSubmission

The current implementation uses existing `VibeFormSubmission` instead.

- `WorkspaceId`: String
- `SiteId`: String
- `PageId`: String
- `BlockId`: String
- `Name`: String
- `Email`: String
- `Phone`: String
- `Message`: String
- `CreatedDate`: Date/String
- `IsDeleted`: Boolean

Access:

- Public insert may be needed for live contact forms.
- Read access should be owner/editor only.

## Layout JSON Strategy

Preferred: store a versioned layout object directly if SELISE JSON/object fields are available.

Fallback currently implemented in code: stringified JSON in `LayoutJson`, `DraftLayoutJson`, and `PublishedLayoutJson`.

The frontend serializes layouts as:

```json
{
  "version": 1,
  "siteId": "site_id",
  "pageId": "page_id",
  "theme": {
    "themeId": "theme_id",
    "overrides": {}
  },
  "blocks": [
    {
      "id": "block_hero_abc",
      "type": "hero",
      "props": {},
      "style": {}
    }
  ],
  "updatedAt": "ISO_DATE"
}
```

## Manual Setup Blocker

A live probe of the generated gateway URL still returned `404` on 2026-05-02. This means the app cannot persist VibeBuilder data until the Data Gateway endpoint/schemas are created, activated, published, and the exact Preview URL is confirmed.
