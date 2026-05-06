# Decisions

Last updated: 2026-05-05

## 2026-05-05 Updated Decisions

- Use `https://api.seliseblocks.com/uds/v1/gateway` as the default Data Gateway URL, with `VITE_DATA_GATEWAY_URL` / `VITE_GRAPHQL_ENDPOINT` overrides available in env.
- Use the actual published project schemas discovered by introspection:
  - `VibeProject` for sites/websites.
  - `VibePage` for pages and versioned layout envelopes.
  - `VibeFormSubmission` for contact form submissions.
- Do not create duplicate `VibeSite`/`VibeContactSubmission` dependencies when the project already has `VibeProject`/`VibeFormSubmission`.
- Persist theme settings and media asset index in encoded `VibeProject.Tags` metadata for this MVP because separate `VibeTheme` and `VibeAsset` schemas are not present.
- Store draft/published page state inside the string `VibePage.Layout` envelope. The envelope contains `draftLayout`, optional `publishedLayout`, `status`, `isHomePage`, and `publishedAt`.
- Keep `/vibe-builder` protected inside the Construct shell to satisfy the SELISE IAM requirement and match the `vidzz` reference video. Logged-out users are redirected to `/login` and then returned to `/vibe-builder` after successful login.
- Keep `/vibe-builder/sites` and `/admin/sites` as the real SELISE-backed site/project management routes.
- Apply the newer `vidzz` reference as a style direction only: dark studio surface, glass panels, neon teal/purple/coral accents, animated grid/light sweep, and lifted cards. Do not copy the video 1:1 and do not hardcode video-derived media as production assets.
- Scope the visual treatment under VibeBuilder classes so Construct navigation, login, and unrelated modules remain intact.
- `run-vibebuilder.bat` now has three modes: default dev launch, `setup` for install/lint/build, and `admin` for the SELISE IAM admin helper.
- Admin assignment for `asafur.rahman@northsouth.edu` must use a current SELISE admin access token in `SELISE_ACCESS_TOKEN`. The helper must fetch current roles first because SELISE `SetRoles` replaces role assignments.
- The visible `/vibe-builder` workbench may be interactive but remains temporary; real persistence means creating a SELISE Data Gateway `VibeProject` and `VibePage` through `/vibe-builder/sites` or `/admin/sites`, then editing that page so autosave/publish writes to SELISE.
- Canvas editing should support direct manipulation: double-click text in the canvas to edit it in place, and use the right sidebar for deeper settings. JSON remains available only as an advanced escape hatch.

## VibeBuilder Implementation Decisions

- Continue in the existing Construct project at `C:\Users\akkha\selise-blocks-pnuasg\test`; no duplicate project was created.
- Use the existing React + Vite + TypeScript + Tailwind/shadcn-style Construct stack.
- Use the existing Zustand auth store and SELISE `GetAccount` flow for current-user identity.
- Add VibeBuilder under `src/features/site-builder` because that folder already existed as the intended feature boundary.
- Use `/admin/sites` for protected admin routes. Add `/admin/websites` compatibility redirects only.
- Use `/vibe/:siteSlug` and `/vibe/:siteSlug/:pageSlug` for public routes to avoid conflicts with Construct/admin/auth routes.
- Allow `/vibe/*` through `ClientMiddleware`; keep admin and preview routes protected.
- Use SELISE Data Gateway generated operations with actual available Vibe-prefixed schemas: `VibeProject`, `VibePage`, and `VibeFormSubmission`.
- Store layout data as a stringified versioned envelope in `VibePage.Layout`.
- Publish by copying the current draft layout into the envelope's `publishedLayout`, setting page `status` to `published`, and setting `VibeProject.IsPublished` to `true`; the live renderer reads only published envelope content.
- Use component-level drag-and-drop and ordering for MVP instead of freeform pixel-level Webflow editing.
- Match the builder shell to the provided reference video by keeping the existing Construct navigation and using a three-panel editor: compact editor sidebar, central section canvas, and right-side properties panel.
- Match new generated sites to the provided `vidzz` reference video direction with a clean business-site template: light page background, white nav, dark hero/CTA cards, teal call-to-action buttons, section cards, stats, pricing, FAQ, and dark footer.
- Treat `C:\Users\akkha\OneDrive\Desktop\vidzz` as a video reference folder, not an asset/source folder. Do not hardcode extracted video images or external stock media because the assignment requires real images to go through SELISE Media Block.
- Use `/vibe-builder` as the visible builder workbench entry route because the provided reference video shows the editor directly. Keep SELISE-backed site management at `/vibe-builder/sites` and `/admin/sites`.
- The `/vibe-builder` scratch workbench may use local React state for temporary drag/edit interaction only. It must not fake save, autosave, publish, upload, or SELISE persistence. Real persistence is available through `/vibe-builder/sites` after login and schema permissions are confirmed.
- Keep Inventory and other Construct modules protected. They redirect unauthenticated users to `/login`; they are not intended as public routes.
- Preserve protected deep links through login. If a user opens `/vibe-builder` while logged out, the app stores the original internal route and returns there after successful email/password, SELISE SSO, or OIDC authentication.
- Keep drag state local and save only after meaningful layout/property changes with debounce.
- Add real SELISE service calls without mock fallbacks; missing schemas/services are shown as setup blockers.
- Media upload uses SELISE Storage pre-signed upload first, then stores the returned file metadata in `VibeProject.Tags` until a dedicated `VibeAsset` schema is added.
- Collaborator management remains blocked until `VibeUserRole` or equivalent SELISE IAM/Access Manager setup is done.
- Fix the existing SSO callback hook-order lint issue with an `enabled` guard on `useSsoActivation`; behavior stays the same, but hooks are no longer conditional.

## Product Decisions

- Build a drag-and-drop website builder, not a blog platform.
- MVP supports simple websites: business, portfolio, landing, educational, personal, agency, and similar service websites.
- Blog/posts are deferred.
- Plugin marketplace is deferred.
- SEO settings are deferred.
- Custom domains are deferred.
- Full Webflow-level pixel positioning is deferred.
- Start with section/block-level drag-and-drop.
- Draft pages are hidden from public visitors.
- Publishing requires confirmation.

## Technical Decisions

- Use the official SELISE Blocks Construct React Vite app as the foundation.
- Use TypeScript because the generated Construct project is TypeScript.
- Use the existing Construct styling system: Tailwind, Radix UI, and existing component conventions.
- Use SELISE Data Gateway for persistence.
- Use SELISE Identity/Access Manager for auth/role model.
- Use SELISE Storage/media only for uploads.
- Do not add Express, Firebase, Supabase, Appwrite, or any custom backend.
- Do not use mock APIs or mock data.
- Keep SELISE service calls separate from UI components.
- Use `.env.example` for documentation if needed, but do not commit real `.env` values.
- Do not use the stale project-scoped Data Gateway URL; the working gateway is `/uds/v1/gateway`.
- Do not force-render Google SSO without a configured SELISE Identity SSO credential. The login page must show only providers returned by SELISE `GetLoginOptions`.
- Add a Windows `.bat` launcher for local use; the launcher opens `/vibe-builder` and the route correctly requires login.

## Tradeoffs

- The builder can be developed as UI plus SELISE service contracts, but it cannot be treated as complete until real Data Gateway schemas exist.
- Media panel cannot have upload behavior until SELISE Storage setup is confirmed.
- Public rendering can be implemented against SELISE page queries, but published content will remain blocked until the `Page` schema and read access rules are configured.
- App-level `UserRole` schema may be useful for per-site roles, but SELISE IAM permissions must still be the platform authority for protected operations.
- Google SSO frontend support already exists in Construct, but the product cannot claim working Google login until SELISE Cloud returns provider `google` with an audience.

## Route Decisions

Preferred admin routes are under `/admin` to avoid conflict with public page routes.

Public page route fallback should be conservative. If existing Construct routes conflict with `/:pageSlug`, use a narrower public route such as `/site/:pageSlug` until route safety is confirmed. Any final route change must be documented here.

Current route decision: do not add `/:pageSlug` yet. Existing Construct uses many authenticated app routes and currently redirects `/` to `/dashboard`. Public route behavior should be changed only after Data Gateway published-page read access is configured.
