# UI and UX system

Phase thirteen establishes a reusable, responsive interaction layer across the storefront, account area, checkout, and administrator console.

## Responsive strategy

The interface remains mobile-first and uses Tailwind's existing breakpoints as layout thresholds rather than device detection.

| Range               | Primary behavior                                                                  |
| ------------------- | --------------------------------------------------------------------------------- |
| Mobile `< 640px`    | Single-column content, full-width actions, compact header, modal navigation       |
| Tablet `640–1023px` | Two-column cards/forms where useful, compact header actions, modal navigation     |
| Desktop `≥ 1024px`  | Persistent primary navigation, multi-column catalog and sticky summary panels     |
| Wide `≥ 1280px`     | Four-column cards and side-by-side dashboard charts where the content supports it |

Touch targets in the shared header and dialogs are at least 40–44 px. Wide tables retain horizontal scrolling on narrow screens, while cards and form actions stack before their content becomes cramped.

## Theme

- The first visit follows `prefers-color-scheme` before React hydration, avoiding a light-theme flash.
- The theme button stores an explicit `light` or `dark` choice in browser key `ec-site-theme`.
- Dark mode applies to shared surfaces, forms, borders, status colors, dialogs, toasts, skeletons, storefront pages, account pages, and admin pages.
- `color-scheme` is set so native form controls match the resolved theme.
- Theme preference stays in the browser and is not uploaded.

## State language

| State   | Pattern                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------- |
| Loading | Route-level `loading.tsx` streaming boundaries with content-shaped shimmer skeletons                  |
| Empty   | Shared dashed-surface component with a clear explanation and optional next action                     |
| Error   | Field-level errors stay beside inputs; route failures use a safe retry boundary; Toast adds context   |
| Success | Persistent inline confirmation where the user may need to reread it, plus short global Toast feedback |

Skeleton animation stops when `prefers-reduced-motion: reduce` is active. Errors shown to users never include raw server details; a production error digest may be displayed for support correlation.

## Toast and modal behavior

- Toasts support success, error, and informational tones, expose an `aria-live` region, and cap the visible queue.
- Success and informational messages close after four seconds; errors remain for six seconds.
- Destructive actions use the shared native `<dialog>` modal rather than `window.confirm` or `window.alert`.
- Modal Escape, backdrop click, labelled title/description, close control, and native focus trapping are supported.
- Product deactivation and address deletion explain their exact effect before confirmation.

## Route coverage

- A root loading/error experience covers the full application.
- Product, account, and administrator segments provide more representative skeleton shapes.
- Product results, order history, and wishlist use the shared empty-state language.
- Cart, wishlist, profile, address, product, inventory, and order mutations provide Toast feedback without removing actionable inline validation.

## Manual QA matrix

Before release, exercise at least these viewport widths in both themes: 390 px mobile, 768 px tablet, and 1440 px desktop. Verify header navigation, dialog focus/Escape, Toast dismissal, form input contrast, empty/loading/error states, product-card grids, checkout summaries, account navigation, admin tables, and Recharts labels.
