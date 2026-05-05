# SELISE Blocks Notes

Last updated: 2026-05-02

## Current Source-Grounded Notes

- Official Getting Started docs show Blocks Cloud project creation, repository connection, environment selection, and branch/environment mapping.
- Official Data Gateway docs state schemas must be configured and published before generated GraphQL CRUD APIs are available.
- The Data Gateway Preview section provides the request URL and `x-blocks-key`; this exact URL should be copied into local config if the generic generated endpoint is wrong.
- Official deployment docs should be treated as Construct-centered for this project.
- The local app is already a Construct React project, which matches the required foundation.

## Current VibeBuilder Integration Status

- IAM: existing Construct auth and profile/account flow is reused.
- Data Gateway: VibeBuilder service layer is implemented, but the live gateway still returns `404`.
- Storage/Media: VibeBuilder calls SELISE pre-signed upload flow and then records assets in Data Gateway; full verification is blocked until Storage/Media and `VibeAsset` are configured.
- Deployment/Web: public renderer routes exist locally under `/vibe/*`; Blocks Cloud deployment still needs repository/build verification.
- Security: real env values remain only in ignored `.env*` files. Docs contain masked values only.

## Construct

Construct is the official SELISE Blocks application foundation. This project was generated using the SELISE Blocks CLI and the React Vite Construct template. It should remain the base app structure.

Construct provides:

- React application shell.
- SELISE service integration conventions.
- Auth-related UI and service patterns.
- Localization support.
- Data/GraphQL client patterns.
- Deployment/build files.

## Data Gateway

Use SELISE Data Gateway for all persistence.

The Data Gateway is GraphQL-centered and should store:

- Sites.
- Pages.
- Themes.
- Assets metadata.
- User roles.
- Contact submissions.

The whole SELISE platform is not GraphQL-only, but page/site persistence should go through Data Gateway unless official SELISE docs/configuration require another SELISE service.

Manual setup likely needed:

- Create required schemas.
- Configure fields/types.
- Confirm JSON/object field support for `layoutJson`, `themeOverrideJson`, and theme style objects.
- Configure schema-level permissions.
- Configure row-level security so users only manage allowed sites/pages.
- Publish/reload schema changes.
- Test CRUD in the Data Playground.

## Identity and Access Manager

Use SELISE Identity/Access Manager for authentication, users, and role/permission enforcement.

Target product roles:

- Owner.
- Editor.
- Viewer.

Manual setup likely needed:

- Confirm initial admin/owner user.
- Create role/permission model in SELISE.
- Map app-level site roles to SELISE users/permissions.
- Confirm token contains needed user ID, email, roles, and permissions.
- Decide whether user roles live only in SELISE IAM, in the `UserRole` Data Gateway schema, or both.

### Google SSO

Construct already includes the frontend Google SSO integration surface:

- Provider definition: `src/constant/sso.ts`
- Login UI: `src/modules/auth/components/signin-sso/signin-sso.tsx`
- Provider redirect request: `src/modules/auth/components/sso-signin-card/sso-signin-card.tsx`
- SELISE endpoint call: `src/modules/auth/services/sso.service.ts`
- Callback route: `/sso/:provider/callback`

The login page intentionally shows only SELISE-configured providers. The current live project response allows social grant type but returns no configured SSO providers, so Google does not appear yet.

Manual setup needed in SELISE Cloud:

- Add/configure Google OAuth/SSO credential.
- Store Google client ID and secret in SELISE Cloud, not in frontend env files.
- Configure callback URLs:
  - `http://127.0.0.1:3000/sso/google/callback` or `http://localhost:3000/sso/google/callback` for local development.
  - `https://pnuasg-dzdlq.seliseblocks.com/sso/google/callback` for production.
- Ensure the credential is enabled and Identity settings are saved/published.
- Verify `GetLoginOptions` returns provider `google` in `ssoInfo`.

After Google starts appearing, Google SSO can still fail with the app's no-such-email branch if the Google email is not an existing SELISE user and SSO signup is disabled. The current live signup settings are:

- `isEmailPasswordSignUpEnabled = false`
- `isSSoSignUpEnabled = false`

Fix this in one of two SELISE-native ways:

- Invite/create the Google email as a user in IAM if the app should be invite-only.
- Enable SSO signup if users should be able to self-register through Google.

The raw `NO_SUCH_EMAIL_MESSAGE` display means the UILM/localization key is missing or unpublished. Add it in Localization under the `auth` module and publish changes. The local frontend now has a fallback message so the raw key is not shown while UILM is being fixed.

## Storage / Media

Use SELISE Storage/media only.

Do not implement fake upload, local-only upload, file-to-base64 storage, or third-party storage. If SELISE upload/storage is not configured, media UI must show a real blocked/setup state.

Manual setup likely needed:

- Confirm Storage service availability for this project.
- Confirm upload flow: presigned URL, GraphQL mutation, or official API endpoint.
- Confirm required request headers and permissions.
- Confirm delete/list behavior.
- Confirm public or signed file URL behavior for published pages.

## Deployment / Publishing

MVP publishing model:

- `Page.status = draft | published`.
- Draft pages are hidden from public visitors.
- Publishing requires confirmation.
- Track `updatedAt` and `publishedAt`.

Use SELISE Web/deployment for hosting the Construct app. For MVP, public page rendering can happen inside the deployed Construct app routes once Data Gateway persistence is ready.

Manual setup likely needed:

- Push generated app to `https://github.com/Asafur/selisetest`.
- Trigger Blocks Cloud deployment.
- Confirm route fallback supports public page routes.
- Confirm published pages can be read by public visitors without exposing private drafts.

## CLI / GUI Limitations

The CLI can scaffold Construct and write local env files. The dashboard/GUI is still required for project/service configuration such as schemas, permissions, storage setup, users, deployment, and observability.

Current CLI:

- `@seliseblocks/cli@0.0.35`
- `blocks version` works.
- The older README command `blocks v` does not work in this CLI version.
