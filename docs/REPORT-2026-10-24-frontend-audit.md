# Frontend audit — 2026-10-24

Scope: `/var/www/raad/frontend` against the live RAAD LMS API. The backend audit in `raad/REPORT-2026-10-24-security-and-backend-audit.md` was treated as done. No migrations, seeders, or container restarts were run.

## Summary

| ID | Severity | Location | Issue | Fix | Status |
|---|---|---|---|---|---|
| F1 | High | `CourseEntityFormDrawer.tsx` plan description | Unsanitized `dangerouslySetInnerHTML` | Shared `sanitizeHtml` | Fixed |
| F2 | High | `CourseViewPage.tsx` `sanitizeRichText` | Regex sanitizer bypassed by unquoted handlers, SVG, encoded `javascript:`, `data:` | DOMPurify allow-list matching TipTap | Fixed |
| F3 | Low | `src/components/ui/chart.tsx` | CSS injected from chart config | Hex/rgb/hsl/`var()` allow-list; unsafe values dropped | Fixed |
| F4 | Medium | `src/lib/openMedia.ts` | Raw `fetch` for media downloads | Apisauce blob download. Same-origin keeps cookies and XSRF. Cross-origin signed Garage URLs omit credentials so `Access-Control-Allow-Origin: *` still works | Fixed |
| F5 | Medium | `src/types/base.ts` | `[key: string]: any` on `ObjectAny` | `Record<string, unknown>` plus narrowing in `callApi` form-data | Fixed |
| F6 | Medium | `getApiBaseUrl` | Hard-coded `http://localhost:8000` fallback | Same-origin, or throw if `window` is missing and `VITE_API_BASE_URL` is unset. Confirmed absent from the built `index` chunk | Fixed |
| F7 | Medium | `nginx.conf` | `/api`, `/sanctum`, `/auth` proxied to `http://app:80`. Both `raad-frontend` and `raad-backend` register the alias `app` on `raad-network` | Proxies now target `http://raad-backend:80` | Fixed in source. **Not deployed** |
| F8 | Medium | `QueryProvider`, `callApi` | 429 was retried and had no message | Localized toast. Queries and mutations do not retry 429 or other 4xx | Fixed |
| C1 | Medium | Register / user password Zod | Client required mixed case and symbols. API uses `Password::defaults()` (minimum 8) | Schemas now require 8 characters and confirmation | Fixed |
| C2 | Medium | Login | 5xx could surface an API body; 403 used a generic permission toast | 401/403 show the API `message`. 5xx shows a generic string. Login does not also toast a second permission error | Fixed |
| C3 | Medium | `POST /auth/email/resend` | UI branched on the old success body | Any 2xx shows “If an account exists, we've sent a verification link.” | Fixed |
| C4 | Medium | Register 429 | Throttle at 5/min was easy to miss | Inline localized 429 message | Fixed |
| C5 | Medium | Lesson video init | Filename and content-type not checked before upload | Extension allow-list, `video/*` or `application/octet-stream`, type length ≤ 100, translated error, `accept` updated | Fixed |
| C6 | Low | `/auth/google` removed | Dashboard stripped `?from=google` | Effect removed. No Google sign-in control remains. Maps embed is unchanged | Fixed |
| C7 | Low | Roles `users_count` | Optional on the Zod model | Required `z.number()`. List and detail already render the field | Fixed |
| C8 | Low | `?redirect=` | `/\` and control characters were not rejected | Parsed with `URL` and kept only when the origin stays the dummy same-origin base | Fixed |
| C9 | Low | `target="_blank"` | Two links used `rel="noreferrer"` only | `rel="noopener noreferrer"` | Fixed |
| C10 | Low | Public marketing layout | gsap/lenis pulled toward the entry via a static import | `PublicWebsiteLayout` is `lazy()`. gsap stays in `ScrollTrigger`, lenis in the layout chunk | Fixed |
| C11 | Low | TipTap in the entry chunk | Barrel `src/components/ui/index.ts` re-exported the editor | Direct import from `rich-text-editor.tsx`. Own chunk, not `index` | Fixed |
| C12 | Low | TanStack query key lint | `useQueryApi` closed over `apiConfig` without it in the key | `apiConfig` is part of the query key. 429 thrown as `ApiRequestError` | Fixed |
| S1 | Info | Student code and invoice “next number” | Client must not invent the next code | Already displayed from the API preview only | Already ok |
| S2 | Info | Public catalog polling | 120 requests/min per IP | No `refetchInterval`. Global `refetchOnWindowFocus` is false. Public queries use a 60s `staleTime` | Already ok |
| S3 | Info | Horizon / Pulse links | Admin-only on the API | No frontend links | Already ok |
| S4 | Info | hls.js / Lenis cleanup | Leaked players or scroll instances | `LessonVideoPlayer` destroys hls on unmount. `SmoothScrollProvider` destroys Lenis and removes the gsap ticker | Already ok |

## Tooling

Throwaway container: `oven/bun:1-alpine` on a copy of the source (`/tmp/raad-fe`). The production frontend container was not used to compile.

| Check | Before | After |
|---|---|---|
| `tsc -b --noEmit` | 0 errors | 0 errors |
| `eslint` | 2,040 problems (2,020 errors, 20 warnings) | 2,052 problems (2,032 errors, 20 warnings) |
| `vite build` | not recorded (baseline lint/tsc only) | success |
| `bun test src/lib/sanitizeHtml.test.ts` | no suite | 5 passed |

The 2,032 lint errors are `prettier/prettier` (formatting and CRLF on 18 source files). They were already the baseline. Reformatting the tree was left alone so this change stays reviewable. Non-prettier warnings stayed at 20 (`react-hooks/exhaustive-deps`, `react-refresh/only-export-components`, one unused type). The previous `@tanstack/query/exhaustive-deps` error and the useless `catch` in `callApi` are gone.

### Bundle (minified)

| Chunk | Size | gzip | Notes |
|---|---|---|---|
| `index` | 1,094 kB | 336 kB | Was 1,436 kB / 445 kB gzip before the TipTap split. No `localhost:8000`, Three, hls, gsap, or ProseMirror |
| `rich-text-editor` | 340 kB | 109 kB | TipTap, loaded with the course wizard and entity drawer |
| `LessonVideoPlayer` | 553 kB | 173 kB | hls.js |
| `LandingPage` | 524 kB | 134 kB | Three / pixel blast |
| `Dashboard` | 438 kB | 118 kB | Recharts |
| `ScrollTrigger` | 115 kB | 46 kB | gsap |
| `sanitizeHtml` | 32 kB | 12 kB | DOMPurify, shared by course view and the plan drawer |
| `PublicWebsiteLayout` | 21 kB | 6 kB | Lenis |

The entry chunk is still large (React, Radix, TanStack Query, icons). Splitting those further is a separate pass.

## Screenshots

Taken against the **currently deployed** site `https://ims.raad.af` (this patch is not in that image yet). Pashto RTL was the stored locale.

- Home, desktop 1440: `audit-home-desktop-ps.png`
- Home, mobile 390: `audit-home-mobile-ps.png` (nav collapses to a menu, RTL title wraps)
- Course 30, desktop: `audit-course-desktop.png` (catalog detail and description render)
- Login, mobile 390: `audit-login-mobile.png`
- Logged-out `/dashboard` redirects to `/login?redirect=%2Fdashboard`

No forms were submitted.

## Deferred

| Item | Why | Next step |
|---|---|---|
| Prettier (2,032 errors) | Pre-existing format and CRLF. A repo-wide `prettier --write` is a noisy diff | Run it in its own change if you want lint at zero |
| `react-hooks/exhaustive-deps` warnings (LightPillar, finance memos) | Pre-existing. Fixing the finance memo deps can change invoice behavior | Review each hook with the screen owner |
| `translations.ts` `as unknown as Messages` for `fa` / `ps` | The locales are cast so a missing key does not fail `tsc` | Type both dictionaries as `Messages` and fill gaps |
| `pixel-blast.tsx` `as unknown as` | Reaches a private Three.js `effects` field | Leave unless that effect is rewritten |
| `fetch` in `fetchCsrfCookie` | Sanctum’s cookie URL is not `/api/v1`. It must send cookies before the JSON client is ready | Keep. Do not point it at Garage |
| Mutation retry on network / 5xx | Still one retry, matching the old default. A retried POST can create a second row | Set mutation `retry: false` after checking which writes are idempotent |
| Auth screens | New errors are translated. The rest of login/register copy is still English in the components | Move those strings into `translations.ts` when the auth pages are redesigned |
| Entry chunk ~1.1 MB | Framework and icon weight | Manual chunks for `lucide-react` and Radix if startup on slow links matters |

No backend edits. The UI now follows the 2026-10-24 API contract (password length, generic resend, login 401/403/5xx, video init rules, role `users_count`, no Google OAuth).

The working tree also contains a loading-indicator update that landed while this audit was in progress (`page-loader.tsx`, `thinking-orbs` on `Spinner`). It typechecks and is included in the lockfile. Deploying the frontend image ships it with these fixes.

## Deploy

Not run. Host nginx sends the site to `127.0.0.1:3000` (`raad-frontend`). Rebuild and recreate that container so the new static files and the `raad-backend` proxy are what gets served:

```bash
cd /var/www/raad/frontend
docker compose build
docker compose up -d
```

`docker compose up -d` recreates `raad-frontend`. Do that when you are ready for the new bundle to go live. No backend container, migration, or volume change is required.
