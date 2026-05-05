# Product Requirements

Last updated: 2026-05-02

## Product Type

A drag-and-drop website builder for simple websites.

Supported website types:

- Business/company websites.
- Portfolio websites.
- Landing pages.
- Educational/institution websites.
- Personal websites.
- Agency websites.
- Restaurant/service websites if feasible.

Excluded for MVP:

- Blog/posts.
- Plugin marketplace.
- Custom domains.
- Advanced SEO tooling.
- Advanced marketplace system.

## Builder UI

Top bar:

- Save.
- Preview.
- Publish.
- Autosave status.
- Device/view mode if feasible.

Left sidebar:

- Available blocks/components.
- Templates/sections.
- Media access if SELISE Storage is ready.

Center canvas:

- Live page layout.
- Drag-and-drop editing.
- Select block.
- Reorder sections.
- Direct text editing where feasible.

Right sidebar:

- Selected block settings.
- Text settings.
- Image/media settings.
- Spacing.
- Background color/image.
- Button settings.
- Theme/page settings.

Theme panel:

- Colors.
- Fonts.
- Spacing.
- Button style.
- Section style.
- Header/footer style.
- Template switching if feasible.

Media panel:

- SELISE media/storage only.
- If Storage is not ready, show exact setup requirements instead of fake upload.

## Required Blocks

Every block needs:

- Editable props.
- Default values.
- Renderer component.
- Settings panel controls.
- Stored configuration inside page layout data.

Blocks:

- Hero.
- Text.
- Image.
- Gallery.
- CTA/Button.
- Contact form.
- FAQ.
- Feature cards.
- Testimonials.
- Navbar/Header.
- Footer.
- Pricing section.
- Team section.
- Map/location section.
- Video section.

## Block Behavior

Required:

- Add block.
- Edit block.
- Reorder block with drag-and-drop.
- Remove block.
- Change background color/image.
- Change spacing.
- Save page.
- Autosave page.
- Undo/redo.

Not required unless easy:

- Duplicate blocks.
- Hide block without deleting.
- Mobile/tablet preview.

## Admin Routes

Preferred admin routes:

- `/admin`
- `/admin/sites`
- `/admin/sites/new`
- `/admin/pages`
- `/admin/pages/new`
- `/admin/pages/:pageId/builder`
- `/admin/theme`
- `/admin/media`
- `/admin/users`

If these conflict with existing Construct routes, use the safest alternative and document the decision in `DECISIONS.md`.

## Public Routes

Preferred public routes:

- `/`
- `/home`
- `/about`
- `/contact`
- `/:pageSlug`

Homepage should be `/`.

Draft pages must not be publicly visible.

## Roles

Owner:

- Manage site.
- Manage pages.
- Manage theme.
- Manage media.
- Manage users.
- Publish pages.

Editor:

- Create/edit pages.
- Upload media if allowed.
- Publish pages.

Viewer:

- View/admin-preview content if allowed.
- Preview drafts if allowed.
- Cannot edit.

## Contact Form

Contact submissions must be saved through SELISE Data Gateway.

Do not:

- Console-log submissions as final behavior.
- Use fake API calls.
- Add a custom email backend.

Email sending is deferred unless SELISE Communication is configured and can be used directly.
