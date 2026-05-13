# TODO

Last updated: 2026-05-13

## 2026-05-12 Google SSO Account-Specific Update

- Live production `GetLoginOptions` now returns Google with `social` enabled and audience `https://pnuasg-dzdlq.seliseblocks.com`.
- Live production signup settings now return `isEmailPasswordSignUpEnabled: true` and `isSSoSignUpEnabled: true`.
- The remaining `asafur.rahman@northsouth.edu` difference is account-specific: it is a Google Workspace account, while other accounts can complete the same SELISE Google flow.
- SELISE generates Google authorization URLs with legacy `userinfo.email` and `userinfo.profile` scopes. The client now preserves SELISE state/callback values and adds standard OIDC sign-in scopes `openid email profile` before redirecting to Google.
- Google SSO token exchange no longer sends a cached `selected-org-id` as `org_id`; that stale org/admin context could make one Google account fail differently before SELISE has issued a token.
- If the NSU account still fails after this deploy, check SELISE IAM user/role state and the North South University Google Workspace third-party app access policy for this OAuth client.

## 2026-05-12 Current Verification Pass

- Active project confirmed at `C:\Users\akkha\selisetest-local-run`; no duplicate VibeBuilder project was created.
- Local env files were inspected by key name only; no secret values were printed.
- `.gitignore` already protects `.env*`, `DATADUMP.txt`, `raw-datadump*`, `raw_datadump*`, and `dump/raw*`.
- Production build passed again with `npm run build`.
- The `vidzz` reference folder contains MP4 references; the first sampled frame shows a dark website-builder/login concept with glass panels, teal/purple accents, and a polished studio-like surface.
- Removed Table, Code / Embed, and Blog / Article from the draggable Vibe Component library so the MVP stays aligned with the final assignment and avoids deferred blog/custom-code scope.

## 2026-05-13 First-Gmail Admin Policy

- Replaced the old fixed-email admin helper with `scripts/bootstrap-first-gmail-admin.ps1`.
- `run-vibebuilder.bat admin`, `admin-token`, and `admin-browser` now apply the first-Gmail-only admin policy.
- The bootstrap selects the earliest signed-in `@gmail.com` SELISE IAM user, assigns that account the Admin role, and removes admin-like roles from other users while preserving non-admin roles.
- The deprecated `scripts/make-asafur-admin.ps1` now delegates to the first-Gmail bootstrap and ignores the old fixed email argument.
- Verified the bootstrap fails closed when `SELISE_ACCESS_TOKEN` is missing and makes no role changes.
- Tried the provided SELISE PAT as a bearer token; SELISE IAM returned `401 Unauthorized`, so no role changes were made. This helper needs a current admin bearer access token from an authenticated SELISE Cloud session unless SELISE documents a different PAT header flow.
- `npm run lint` and `npm run build` passed after the admin-policy update.

## 2026-05-13 Google SSO Callback Reachability Fix

- Investigated the login callback error: `The browser could not reach SELISE Identity`.
- Local network/CORS checks showed `https://api.seliseblocks.com/idp/v1/Authentication/Token` is reachable and allows `http://localhost:3000`, `http://127.0.0.1:3000`, and the production app domain.
- Root cause fixed in code: social-login token exchange no longer jumps to a hardcoded direct `https://api.seliseblocks.com/...` URL during local dev. It now uses the same configured auth base as the login endpoint, so local dev keeps the `/blocks-api` proxy/session-cookie path consistent.
- Local Google sign-in now defaults to the configured SELISE production audience because the current Blocks Cloud Google credential only lists the production audience/callback. A local callback can be tested only by setting `VITE_ENABLE_LOCAL_SSO_CALLBACK=true` after SELISE Identity and Google OAuth are both configured with the exact local callback.
- Removed hardcoded SELISE project-key fallbacks from source and Vite config; project keys must come from ignored `.env` files or deployment env.
- Focused SSO tests, lint, and production build passed after the fix.

## 2026-05-05 Current Integration Update

- Corrected the Data Gateway endpoint from the stale generated `/uds/v1/pnuasg/gateway` path to the working SELISE endpoint `/uds/v1/gateway`.
- Live introspection without exposing secrets confirmed Data Gateway is reachable and returns `__typename`.
- Live introspection confirmed existing Vibe schemas in this project:
  - `VibeProject`
  - `VibePage`
  - `VibeFormSubmission`
- VibeBuilder now maps website/site management to `VibeProject`, page/layout/publish data to `VibePage`, and live contact forms to `VibeFormSubmission`.
- Theme settings and media asset metadata are persisted in `VibeProject.Tags` as encoded VibeBuilder metadata because separate `VibeTheme` and `VibeAsset` schemas are not present in the current gateway.
- Media files still upload through the real SELISE Storage/Media pre-signed upload flow; the resulting file URL/ID is stored in project metadata for the MVP media library.
- `/vibe-builder` is now an authenticated Construct-shell route again so it visually matches the provided `vidzz` reference video with the left Construct navigation and top bar.
- `/vibe-builder/sites` and `/admin/sites` remain the SELISE-backed site/project list.

## Completed

- Official SELISE Blocks Construct React Vite app scaffolded.
- App build verified with `npm run build`.
- Local dev server verified at `http://127.0.0.1:3000/`.
- Project context dump folder created.
- Safe DATADUMP extraction created at `dump/DATADUMP_EXTRACTION.md`.
- Raw dump ignore patterns added to `.gitignore`.
- `.gitignore` updated so real `.env*` files are not committed.
- `.env.example` created with placeholders only.
- Existing Construct route/auth/storage/graphql integration points inspected.
- Data Gateway endpoint probe attempted for `pnuasg`; the generated project-scoped endpoint returned 404, then the correct app-wide endpoint `/uds/v1/gateway` was confirmed working on 2026-05-05.
- Google SSO frontend path inspected:
  - Google is already defined in Construct social providers.
  - Login calls SELISE `GetLoginOptions` and only shows SSO providers returned by SELISE Identity.
  - SSO button calls SELISE `GetSocialLogInEndPoint`.
  - Callback route exists at `/sso/:provider/callback`.
- Live SELISE login-options probe confirmed social login is allowed but no SSO provider is configured yet.
- Later live SELISE checks confirmed Google provider now appears in `GetLoginOptions`.
- Live signup settings initially showed signup disabled; current production checks on 2026-05-12 show both email/password signup and SSO signup enabled.
- Frontend fallback text added so missing UILM key `NO_SUCH_EMAIL_MESSAGE` no longer appears raw if localization has not been configured yet.
- VibeBuilder protected admin routes added under `/admin/sites`.
- VibeBuilder public renderer routes added under `/vibe/:siteSlug` and `/vibe/:siteSlug/:pageSlug`.
- Public `/vibe/*` routes allowed through the global auth middleware while admin/preview routes remain protected.
- SELISE-facing VibeBuilder service layer added for sites, pages, themes, assets, publishing, and contact submissions.
- Drag-and-drop builder implemented with component library, canvas reorder, selected component settings, undo/redo, manual save, autosave, preview, and publish actions.
- Vibe Component renderer implemented for Hero, Text, Image, Gallery, Contact, CTA, FAQ, Features, Testimonials, Navbar, Footer, Pricing, Team, Location, and Video.
- Media Library page added with real SELISE Storage pre-signed upload flow and VibeProject metadata persistence for uploaded asset references.
- Theme and site settings pages added with SELISE Data Gateway save operations.
- Production build re-run successfully after implementation.
- Lint now passes after removing new non-null assertions and fixing the existing SSO callback hook-order issue.
- Browser smoke check confirmed `/vibe/nonexistent` is public and shows the SELISE setup blocker instead of redirecting to login.
- Browser smoke check confirmed `/admin/sites` redirects unauthenticated users to login.
- Windows launchers created at `run-vibebuilder.bat` and `C:\Users\akkha\OneDrive\Desktop\Run VibeBuilder.bat`.
- Builder UI adjusted toward the provided video reference: Construct-style editor panels, Site/Blocks tabs, grouped block library, carded canvas sections, and right-side Properties panel.
- VibeBuilder primary route changed to `/vibe-builder` to match the provided video reference; `/admin/sites` remains as a compatibility route.
- Sidebar menu reordered/renamed so the builder appears as `VIBE_BUILDER` under Cloud Integrated, matching the reference shell more closely.
- Additional reference-style blocks added: Stat card, Feature list, Accordion, Tabs, Carousel, and Timeline. Table, Code / Embed, and Blog / Article are intentionally not exposed in the current draggable MVP library.
- Default generated VibeBuilder pages restyled toward the `vidzz` reference video: `YourBrand` navbar, dark hero card, services/features, stats, gallery, pricing, FAQ, CTA, and dark footer.
- Public block rendering polished for the reference look with custom CTA buttons, visual media placeholders, carded galleries, and cleaner live-mode sections.
- Local route check confirmed `/inventory`, `/vibe-builder`, and `/admin/sites` require login when unauthenticated; this is expected Guard behavior, not a missing route.
- Lint and production build re-run successfully after the launcher/UI update.
- Runtime check confirmed `http://localhost:3000/vibe-builder` is served by the local Vite process from the SELISE Blocks Construct project folder.
- Fixed protected deep-link login flow: opening `/vibe-builder` while logged out still goes to login, but successful email, SELISE SSO, or OIDC login now returns to the originally requested internal route instead of falling through to `/dashboard`.
- Verified the deep-link fix with `npm run lint`, `npx vitest run src/state/client-middleware.spec.tsx`, and `npm run build`.
- Changed `/vibe-builder` into a visible visual builder workbench so the drag-and-drop editor opens immediately for review.
- Moved the SELISE-backed site list to `/vibe-builder/sites`; `/admin/sites` remains available for assignment compatibility.
- Fixed the shared Construct `Button` `asChild` crash that made the VibeBuilder workbench render as a blank white page.
- Verified in the browser that `http://localhost:3000/vibe-builder` shows the builder sidebar, canvas, properties panel, and reference-style landing page blocks.
- Sampled the newer `vidzz` reference video and applied a scoped dark studio visual layer to VibeBuilder screens.
- Added animated grid/light-sweep background, glass panels, hover-lift cards, selected-block glow, drag/drop highlighting, and template picker cards.
- Updated `run-vibebuilder.bat` with default run, `setup`, `admin`, `admin-token`, and `admin-browser` modes.
- Added the original fixed-email admin helper, then superseded it with the first-Gmail-only admin bootstrap.
- Verified the admin helpers fail closed when `SELISE_ACCESS_TOKEN` is missing and make no role changes.
- Lint, production build, and focused Vitest checks passed after the visual/launcher/admin-helper update.
- Added direct double-click inline editing on the builder canvas for text-like content across the Vibe blocks.
- Added double-click media URL editing for image/media placeholders while keeping SELISE Media upload in the properties panel.
- Replaced raw JSON-only array editing in the right sidebar with repeatable item controls and kept an `Advanced JSON` fallback.
- Clarified the `/vibe-builder` workbench notice so it explains that only SELISE Sites/Pages autosave and publish persist for real.

## In Progress

- Waiting for authenticated browser verification of real CRUD through the existing `VibeProject`, `VibePage`, and `VibeFormSubmission` schemas.
- Waiting for deployment/browser verification that the account-specific Google Workspace SSO patch fixes `asafur.rahman@northsouth.edu`.
- Waiting for a current SELISE admin bearer access token before applying the first-Gmail-only Admin role policy in live SELISE IAM.

## Remaining Implementation Tasks

- Verify VibeBuilder CRUD after logging in with a SELISE account that has access to the existing Vibe schemas.
- Redeploy the current commit after configuring a non-secret build env variable for the SELISE project key; the production browser was still serving an older failed-deploy build when the Google SSO screenshots were captured.
- Verify media upload against SELISE Storage/Media from the authenticated builder.
- Verify contact form submissions after `VibeFormSubmission` has public-safe insert access if public forms are required.
- Add collaborator management after `VibeUserRole` or equivalent IAM/Access Manager permissions are configured.
- Add stronger component-specific settings panels after core persistence is working.
- Add code-splitting for the large production bundle.

## Manual SELISE Setup Tasks

- Current Data Gateway already has `VibeProject`, `VibePage`, and `VibeFormSubmission`; keep or extend these rather than creating duplicate `VibeSite` schemas.
- Optional hardening schemas still recommended: `VibeAsset`, `VibeTheme`, `VibeUserRole`, and optional `VibePublishRecord`.
- Configure Data Gateway access rules and RLS/CLS.
- Confirm JSON/object field support or approved fallback structure.
- Configure SELISE Identity roles/permissions for owner/editor/viewer.
- Configure initial owner/admin policy by running the first-Gmail bootstrap after the first Gmail login.
- To apply the policy locally, set a current non-VITE `SELISE_ACCESS_TOKEN` bearer token in the PowerShell session and run `run-vibebuilder.bat admin`, or run `run-vibebuilder.bat admin-token`.
- Configure Google SSO in SELISE Identity:
  - Create or enable the Google social/SSO credential.
  - Ensure `social` is an allowed grant type.
  - Add the correct callback URLs, including local dev `http://127.0.0.1:3000/sso/google/callback` or `http://localhost:3000/sso/google/callback` and production `https://pnuasg-dzdlq.seliseblocks.com/sso/google/callback`.
  - Keep the local browser on one origin while testing. If the app was opened at `http://127.0.0.1:3000`, the SELISE/Google callback allowlist must include that exact origin callback.
  - Keep `VITE_ENABLE_LOCAL_SSO_CALLBACK=false` until that local callback setup exists. With the current production-only credential, SELISE rejects local audiences with HTTP 400.
  - Configure Google OAuth client ID/secret in SELISE Cloud only.
  - Enable the credential and save/publish the Identity settings.
  - Confirm `GetLoginOptions` returns `ssoInfo` with provider `google` and a non-empty `audience`.
- Choose one Google SSO account policy:
  - Invite/create the specific Google email in SELISE IAM if only existing users may log in.
  - Or enable SSO signup if Google users should be able to self-register.
- Add and publish UILM auth key `NO_SUCH_EMAIL_MESSAGE` with a friendly value such as:
  - `No account exists for this email. Ask an admin to invite the user or enable SSO sign-up.`
- Configure SELISE Storage/media service.
- Confirm upload, list, delete, and URL access flow.
- Configure Blocks Cloud deployment for `Asafur/selisetest`.
- In Blocks Cloud deployment/build env, set `VITE_X_BLOCKS_KEY` or one supported alias such as `X_BLOCKS_KEY`, `SELISE_X_BLOCKS_KEY`, `VITE_SELISE_BLOCKS_KEY`, `SELISE_BLOCKS_KEY`, `VITE_SELISE_PROJECT_KEY`, `SELISE_PROJECT_KEY`, `PROJECT_KEY`, or `BLOCKS_KEY`.
- Verify route fallback for public page routes.

## Blocked Until Confirmed

- Public live read access for published pages, if unauthenticated public rendering is expected.
- True role/collaborator enforcement beyond owner filtering.
- Functional Google SSO login completion for the North South University Google Workspace account.
- Confirm the new same-origin SSO proxy/cookie fix in production after redeploy.

## Current Blocker Evidence

The generated Construct GraphQL client originally built this stale endpoint:

```text
https://api.seliseblocks.com/uds/v1/pnuasg/gateway
```

An introspection probe using the local project key returned:

```text
404 Not Found
```

This was rechecked after VibeBuilder implementation on 2026-05-02 and still returned 404. On 2026-05-05, probing `https://api.seliseblocks.com/uds/v1/gateway` returned `200` with `{"data":{"__typename":"Query"}}`, so the app now uses that endpoint. Do not switch back to the project-scoped path unless Blocks Cloud explicitly provides a different working Preview URL.

## Google SSO Blocker Evidence

The current Construct login code is ready to display Google only when SELISE Identity returns it in login options. A sanitized live probe of `GetLoginOptions` returned:

```text
allowedGrantTypes: password,social
ssoProviderCount: 0
hasGoogle: false
```

Earlier no Google provider/audience was returned, so the login screen correctly hid the Google button. Later the provider appeared after dashboard setup.

## Google SSO Signup/User Evidence

Earlier project signup settings returned:

```text
isEmailPasswordSignUpEnabled: false
isSSoSignUpEnabled: false
```

That old blocker is no longer current. Rechecking production on 2026-05-12 returned both signup flags as `true`, so a generic "new Google account cannot sign up" explanation no longer matches the latest behavior. If only `asafur.rahman@northsouth.edu` fails while other Google accounts work, treat the difference as account-specific Google Workspace policy and/or SELISE IAM user/role state.

## 2026-05-13 Bug Hunt Notes

- Fixed split project-key reads. Older modules read `import.meta.env.VITE_X_BLOCKS_KEY` directly and could send `ProjectKey=` even while newer services worked. They now use the shared SELISE config helper.
- Removed tracked hardcoded project-key fallback from source/config. Real keys must stay in ignored `.env*` files or Blocks Cloud build env variables.
- Fixed Google SSO state handling so the social token exchange uses the same `/blocks-api` proxy path as SSO start, and nginx no longer strips the state cookie on `/idp/v1/Authentication/Token`.
- Cleared stale SSO callback exchange locks whenever a fresh provider redirect is created.
- Fixed admin-only menu/route enforcement for IAM/user management. The UI now treats SELISE `cloudadmin` as an admin alias and hides/protects admin-only entries for normal users.
- Local verification passed: production build, full Vitest suite, ESLint, and Playwright login-page smoke.
