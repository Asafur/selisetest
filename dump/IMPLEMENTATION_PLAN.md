# Implementation Plan

Last updated: 2026-05-05

## 2026-05-05 Implementation Update

- GraphQL client now defaults to the verified Data Gateway URL `https://api.seliseblocks.com/uds/v1/gateway`.
- The stale generated endpoint `https://api.seliseblocks.com/uds/v1/pnuasg/gateway` should not be used unless Blocks Cloud later provides it as a working Preview URL.
- VibeBuilder is mapped to actual schemas discovered in this environment:
  - `VibeProject`
  - `VibePage`
  - `VibeFormSubmission`
- `VibePage.Layout` now stores a stringified envelope containing draft and published layouts.
- Media uploads use SELISE pre-signed Storage/Media upload and persist asset metadata through `VibeProject.Tags` until a dedicated `VibeAsset` schema is added.
- Theme settings persist through `VibeProject.Tags` until a dedicated `VibeTheme` schema is added.
- `/vibe-builder` is protected inside the Construct shell to match SELISE IAM requirements and the provided `vidzz` video reference.
- `/vibe-builder/sites` and `/admin/sites` are the real SELISE-backed management routes.

## Latest Implementation Summary

VibeBuilder has now been implemented as a feature module inside the existing Construct app. The implementation is build-valid and uses only SELISE-facing service functions for persistence/media. It does not include fake APIs, local JSON persistence, local SQL, Firebase, Supabase, or a custom backend.

Added/updated architecture:

- `src/features/site-builder/types.ts`
- `src/features/site-builder/graphql/queries.ts`
- `src/features/site-builder/graphql/mutations.ts`
- `src/features/site-builder/services/site-builder.service.ts`
- `src/features/site-builder/constants/block-registry.ts`
- `src/features/site-builder/constants/templates.ts`
- `src/features/site-builder/components/blocks/*`
- `src/features/site-builder/components/builder/BuilderWorkspace.tsx`
- `src/features/site-builder/pages/*`
- `src/routes/app-routes.tsx`
- `src/state/client-middleware.tsx`
- `src/constant/sidebar-menu.ts`

Implemented route surface:

- `/admin/sites`
- `/admin/sites/new`
- `/admin/sites/:siteId`
- `/admin/sites/:siteId/pages`
- `/admin/sites/:siteId/pages/new`
- `/admin/sites/:siteId/pages/:pageId/builder`
- `/admin/sites/:siteId/media`
- `/admin/sites/:siteId/theme`
- `/admin/sites/:siteId/settings`
- `/admin/sites/:siteId/users`
- `/preview/:siteId/:pageId`
- `/vibe/:siteSlug`
- `/vibe/:siteSlug/:pageSlug`

Verification completed:

- `npm run build` passed after implementation.
- `npm run lint` passed after the final cleanup.
- Live Data Gateway probe now confirms `/uds/v1/gateway` works; Vibe schemas exist but authenticated CRUD and public access rules still need browser verification.
- Browser smoke check: `/vibe/nonexistent` remains public and shows a setup blocker.
- Browser smoke check: `/admin/sites` redirects unauthenticated users to `/login`.

## Existing Project Inspection Summary

- Existing project found: yes.
- Folder: `C:\Users\akkha\selise-blocks-pnuasg\test`
- Framework: React + Vite.
- Language: TypeScript.
- Styling: Tailwind CSS with local UI kit.
- Routing: React Router.
- Auth: SELISE IAM via existing Construct auth services and Zustand store.
- Data integration: existing HTTP and GraphQL clients.
- Media integration: existing SELISE pre-signed upload service wrapper.
- Env files: local `.env*` files exist and are ignored.
- Raw DATADUMP: not inside repo; Desktop copy only.

## Current Architecture

The app is official SELISE Blocks Construct React Vite.

Known stack:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Radix UI components.
- React Router.
- TanStack Query.
- Existing SELISE service helpers under `src`.

Inspected files:

- `src/routes/app-routes.tsx`
- `src/layout/main-layout/main-layout.tsx`
- `src/constant/sidebar-menu.ts`
- `src/lib/graphql-client.ts`
- `src/lib/https.ts`
- `src/lib/api/services/storage.service.ts`
- `src/lib/api/hooks/use-storage.ts`
- `src/state/store/auth/guard.tsx`
- `src/state/store/auth/protected-route.tsx`
- `src/constant/sso.ts`
- `src/modules/auth/components/signin/signin.tsx`
- `src/modules/auth/components/signin-sso/signin-sso.tsx`
- `src/modules/auth/components/sso-signin-card/sso-signin-card.tsx`
- `src/modules/auth/services/sso.service.ts`
- `src/modules/auth/hooks/use-sso-activation.ts`
- `src/modules/auth/pages/sso-activation/sso-activation.tsx`

## Proposed Feature Structure

Use:

```text
src/features/site-builder/
  components/
    builder/
      BuilderCanvas
      BlockLibrary
      BlockSettingsPanel
      BuilderTopBar
      ThemePanel
      MediaPanel
    blocks/
      HeroBlock
      TextBlock
      ImageBlock
      GalleryBlock
      CtaBlock
      ContactBlock
      FaqBlock
      FeaturesBlock
      TestimonialBlock
      NavbarBlock
      FooterBlock
      PricingBlock
      TeamBlock
      MapBlock
      VideoBlock
  pages/
    AdminDashboard
    SitesList
    PagesList
    PageBuilder
    ThemeSettings
    MediaLibrary
    UserRoles
    PublicPageRenderer
  services/
    siteService
    pageService
    themeService
    assetService
    roleService
    contactSubmissionService
  utils/
    blockDefaults
    renderBlock
    permissions
    slugify
  constants/
    blockTypes
    defaultThemes
  hooks/
    useBuilderState
    useAutosave
    useRoleAccess
```

Adapt names/extensions to existing Construct conventions.

## Data Gateway Schema Plan

Site:

- `id`
- `name`
- `slug`
- `ownerId`
- `logoUrl`
- `themeId`
- `status`
- `createdAt`
- `updatedAt`

Page:

- `id`
- `siteId`
- `title`
- `slug`
- `status`
- `layoutJson`
- `themeOverrideJson`
- `createdAt`
- `updatedAt`
- `publishedAt`

Theme:

- `id`
- `name`
- `colors`
- `typography`
- `spacing`
- `buttonStyle`
- `sectionStyle`
- `templateType`
- `createdAt`
- `updatedAt`

Asset:

- `id`
- `siteId`
- `fileName`
- `fileUrl`
- `fileType`
- `uploadedBy`
- `createdAt`
- `updatedAt`

UserRole:

- `id`
- `siteId`
- `userId`
- `role`
- `createdAt`
- `updatedAt`

ContactSubmission:

- `id`
- `siteId`
- `pageId`
- `name`
- `email`
- `phone`
- `message`
- `createdAt`

Confirm in SELISE Data Gateway whether JSON/object fields are supported. If not, use SELISE-compatible string fields containing JSON only if Data Gateway validation/query behavior allows that and it is accepted as a platform-compatible structure.

## Implementation Steps

1. Create and maintain `dump/` context files.
2. Inspect existing Construct route structure and service helpers.
3. Identify Data Gateway GraphQL client conventions.
4. Create TypeScript domain types for Site, Page, Theme, Asset, UserRole, ContactSubmission, and layout blocks.
5. Create SELISE service modules that use the existing GraphQL/HTTP helpers only.
6. Add route entries for admin and public renderer.
7. Build admin pages with blocked/setup states if schemas are not available.
8. Build builder UI shell and block renderer components.
9. Add save/autosave/publish flows that call SELISE services.
10. Add media panel only after SELISE Storage upload/list/delete flow is confirmed.
11. Build public renderer that fetches only published pages.
12. Verify build and browser smoke test.

## SELISE Integration Points

- Identity: current user and auth/role guard.
- Identity Google SSO: supported by Construct frontend, blocked until SELISE Cloud has a configured Google credential returned by `GetLoginOptions`.
- Data Gateway: sites, pages, themes, roles, contact submissions, asset metadata.
- Storage/media: image upload/list/delete and public/signed file URLs.
- Deployment: public hosting of the Construct app.
- Observability: deployment/runtime logs and traces after push/deploy.

## Current Data Gateway Status

Do not implement fake persistence. Data Gateway endpoint discovery is now resolved:

- Stale generated endpoint: `https://api.seliseblocks.com/uds/v1/pnuasg/gateway`
- Stale endpoint probe result: `404 Not Found`
- Correct endpoint: `https://api.seliseblocks.com/uds/v1/gateway`
- Correct endpoint probe result: `200` for GraphQL introspection

Storage/media is also not confirmed beyond the existing Construct helper:

- `src/lib/api/services/storage.service.ts`
- Endpoint helper: `/uds/v1/Files/GetPreSignedUrlForUpload`

Google SSO is currently blocked by SELISE Identity configuration:

- Sanitized `GetLoginOptions` result: `allowedGrantTypes = password,social`, `ssoProviderCount = 0`, `hasGoogle = false`.
- Login page has no Google button because no configured provider/audience is returned.
- Do not hardcode Google in frontend; configure it in SELISE Cloud.

Update after dashboard setup:

- Google provider now appears in `GetLoginOptions`.
- Google callback can still fail with no-such-email when the Google account is not a registered SELISE user.
- Current signup settings have both email/password signup and SSO signup disabled.
- Add/publish UILM key `NO_SUCH_EMAIL_MESSAGE` in the `auth` module; local code includes a fallback message only to prevent raw key display.

Before implementation continues, copy the exact Data Gateway Preview endpoint from Blocks Cloud and confirm the required schemas/storage permissions exist.

## Manual Setup Checklist To Unblock

1. In Blocks Cloud, open project `pnuasg`.
2. Go to Data Gateway.
3. Configure a Blocks data source or approved external MongoDB-compatible source.
4. Create the schemas listed above.
5. For each schema, configure View/Create/Edit/Delete access.
6. Configure RLS/CLS:
   - Site rows restricted by owner/member role.
   - Page rows restricted by `siteId`.
   - Published pages can be read publicly only when `status = published`.
   - Draft pages are owner/editor/viewer-preview only.
   - ContactSubmission create allowed for public form submission if intended.
7. Reload/publish the schemas.
8. Open the Data Gateway Preview for each schema and copy the exact GraphQL endpoint.
9. Test CRUD in Data Playground.
10. Configure Storage/DMS and verify the upload flow for images.
11. Confirm the required IAM roles/permissions for owner/editor/viewer.
12. Configure Google SSO in Identity and verify `GetLoginOptions` returns provider `google`.
13. Enable SSO signup or invite/create the Google test user in SELISE IAM.
14. Add/publish `NO_SUCH_EMAIL_MESSAGE` in SELISE Localization.
