# Agent prompt: RAAD LMS frontend audit and fix

> Paste everything below the line into a new agent session opened on `/var/www` (the repo root is `/var/www/raad`).

---

You are a **senior React/TypeScript engineer and frontend security reviewer** working on **RAAD LMS**, a production learning-management system. The frontend is in `/var/www/raad/frontend`, and the Laravel 13 API it talks to is in `/var/www/raad/backend`. Your mission is to **scan the whole frontend, find every real defect, and fix it one by one** without breaking the backend contract or production.

## 0. Ground rules (non-negotiable)

1. **This host is live production.**
   - Do not run anything against the backend containers except read-only `curl` to public endpoints.
   - Never run `php artisan migrate*`, seeders, `docker compose down -v`, `docker volume rm` or `rm -rf`.
   - Never change Docker volume or project names.
   - Never print secrets from `.env` files.
2. **Explore with Graphify first.** Before using Read/Grep/Glob to explore, run:
   `graphify query "<question>" --graph /var/www/raad/graphify-out/graph.json`
   (also `graphify explain` / `path` / `affected`). After code changes, run `graphify update /var/www/raad`. Include this rule in every subagent prompt you spawn.
3. **Read the conventions before writing code:** `raad/frontend/AGENTS.md`, `README.FRONTEND.LLM.md` and `DESIGN.md`, plus `/var/www/.cursor/rules/*.mdc`.
4. **Mirror existing modules.** `src/modules/UserManagement` and `src/modules/Finance` are the reference implementations. Feature code lives in `src/modules/<Feature>/` with this flow: `data/constants/endpoints.ts`, then `data/models` (Zod), then `hooks` (`useQueryApi`/`useMutationApi`), then `features/<Page>`, then `routes/index.tsx` (permission-guarded).
   - Do not invent a parallel architecture.
   - Reuse `src/components/ui` (DataTable, Drawer, Dialog, Button, Form, etc.) rather than custom tables or modals.
5. **TypeScript strict:**
   - No `any`, no `@ts-ignore`, and no `as unknown as X` to silence errors. Parse API data with Zod.
   - Code style: arrow-function components, typed `interface` props, the `@/` alias, `export default` at the bottom, no `React.FC`.
6. **API and state:**
   - Use only `callApi` / `apiClient` (Apisauce) and the hooks layer. **No raw `fetch` or `axios`**, no hard-coded API URLs, and no server state in Zustand. Zustand is for UI and session state only.
7. **i18n:** every user-facing string goes in `src/i18n/translations.ts`. Add `en` first, then `fa` and `ps`, which are RTL; layouts must work in RTL.
   **Icons:** `lucide-react` only.
8. **UI work:** for any visual redesign or new UI, follow the workspace user rule:
   - Consult the `ui-ux-pro` MCP (`get_design_system` first).
   - Respect `DESIGN.md` tokens.
   - Animate with `motion` (Framer Motion, already a dependency), honouring `prefers-reduced-motion`.
   - Screenshot desktop (1440px) and mobile (390px) with the browser tools and fix visual issues.
   Pure bug fixes don't need the MCP step.
9. **Every screen handles all four states:** loading, empty, error, and permission-denied (403).
10. **Work incrementally.** Fix one issue at a time, keep each change focused, and run the type check and lint after each batch. Don't leave `console.log` or commented-out code.

## 1. Stack facts (verified)

- **Core:**
  - React 19, TypeScript ~5.7 strict, Vite 6 (SWC), Bun.
  - Tailwind v4, shadcn-style primitives in `src/components/ui`.
- **Libraries:**
  - Data and forms: TanStack Query v5, Zustand 5, React Hook Form + Zod 3, React Router 7.
  - API and media: Apisauce, hls.js, TipTap 2.
  - Visual: Recharts, `motion`, `gsap`, `lenis`, `three` (marketing site under `src/components/website`).
- **Modules:** `ActivityLog`, `Blog`, `Course`, `Finance`, `Notifications`, `UserManagement`. Auth lives in `src/features/auth`.
- **Build and serving:**
  - Built by `Dockerfile` (`oven/bun:1-alpine`, then `nginx:stable-alpine`) and served as a static SPA.
  - Production `/api`, `/sanctum` and `/auth` traffic is routed by the **host** nginx directly to the backend.
- **No frontend test suite exists**: there are zero `*.test.*` / `*.spec.*` files.
- **Toolchain:** the host has **no node, npx or bun**. Run the toolchain in a throwaway container on a copy of the source, never in the production container:
  ```bash
  rsync -a --delete --exclude node_modules --exclude dist /var/www/raad/frontend/ /tmp/raad-fe/
  docker run --rm -v /tmp/raad-fe:/app -w /app oven/bun:1-alpine sh -c \
    "bun install --frozen-lockfile && bunx tsc -b --noEmit && bun run lint && bun run build"
  ```
  Re-sync after each batch of edits. Record the baseline error counts **before** fixing anything.

## 2. Known findings to fix (start here, then keep scanning)

| # | Severity | Location | Issue | Expected fix |
|---|---|---|---|---|
| F1 | **High (XSS)** | `src/modules/Course/features/CourseEntityFormDrawer/CourseEntityFormDrawer.tsx` (~L898) | `dangerouslySetInnerHTML={{ __html: String(detail.plan_description ...) }}` renders **unsanitized** HTML that came from the API. | Use one shared sanitizer (below). |
| F2 | **High (XSS)** | `src/modules/Course/features/CourseViewPage/CourseViewPage.tsx` (`sanitizeRichText`, ~L66) | A hand-rolled regex "sanitizer" that's trivially bypassed: `<img src=x onerror=…>` variants, `<svg><animate>`, entity-encoded `javascript:`, `<a href="data:…">`, unquoted or newline-separated attributes. | Add `dompurify` (and its types if needed) and create `src/lib/sanitizeHtml.ts` with an allow-list matching TipTap output. Replace both usages and delete the regex version. |
| F3 | Low | `src/components/ui/chart.tsx` (~L64) | `dangerouslySetInnerHTML` for generated CSS (the shadcn chart). | Make sure the injected values come only from typed config (colour tokens), never user input. Document the constraint, or validate the colour format. |
| F4 | Medium | `src/lib/openMedia.ts` | Uses raw `fetch`, which breaks the "Apisauce only" rule and may skip credentials/XSRF handling and 401 handling. | Route through `callApi` / `apiClient`, with blob responseType if needed. Keep the auth cookie and XSRF behaviour. |
| F5 | Medium | `src/types/base.ts:6` | `[key: string]: any;` index signature leaks `any` everywhere. | Use `unknown` and fix the downstream types with Zod-inferred types. Grep for the other `any`/`as any` cases too. |
| F6 | Medium | the API client (`apiClient.ts`) | Falls back to `http://localhost:8000` when the env var is missing, so a misconfigured production build silently calls localhost. | Fail loudly at build/start time, or default to same-origin `/api`. No hard-coded host. |
| F7 | Medium (infra) | frontend `docker-compose.yml` + `nginx.conf` | The compose service is named `app` on `raad-network`, so `http://app:80` inside the container resolves to **the frontend itself**. Its `/api`, `/sanctum` and `/auth` proxy blocks loop back to itself. Production works only because host nginx intercepts those paths. | Point the proxies at the backend container's real name (check `docker network inspect raad-network`) or remove the dead proxy blocks. **Don't restart production containers without the user's approval;** write the change and report it. |
| F8 | Medium | Global error handling | **429 Too Many Requests** isn't handled anywhere. | Show a localized toast/inline message ("Too many attempts, try again in a minute") and don't auto-retry 429 in TanStack Query (`retry` predicate). |

### Backend contract changes made on 2026-10-24 that the UI must respect
Read `/var/www/raad/backend/docs/REPORT-2026-10-24-security-and-backend-audit.md` for full detail.
- **`POST /auth/register`:**
  - Throttled at 5 requests/min, so it returns 429.
  - Uses `Password::defaults()` (min 8).
  - The duplicate-email error is now generic. Don't build UI logic on the old message text.
- **`POST /auth/email/resend`:** **always 200** with a generic message, even for unknown or already-verified emails. Show a neutral "If an account exists, we've sent a link" message.
- **`POST /auth/login`:**
  - 401 for bad credentials; 403 for suspended or unverified accounts, with a message.
  - Unexpected server errors now return 500 without internal detail.
  - Show the API `message` for 401/403 and a generic one for 5xx.
- **Public catalog GETs (`/public/...`):** throttled at **120 requests/min per IP**. Avoid aggressive polling or refetch-on-focus storms on the public site.
- **`/auth/google*` has been removed.** If any "Sign in with Google" UI, link or env var exists, remove it.
- **Lesson video multipart init:**
  - The filename must end in `.mp4|.m4v|.webm|.mov|.avi|.3gp|.mkv`.
  - `content_type` must be `video/*` or `application/octet-stream`, max 100 chars.
  - Mirror this in the upload picker (`accept=` and Zod), with a translated error, in `src/modules/Course/services/lessonVideoMultipartUpload.ts` and its callers.
- **Student code and invoice "next number" previews:** the backend now returns last + 1 consistently. Don't compute codes client-side; show the preview only as a hint.
- **Roles list:** `users_count` is now always present on every role. Display it rather than computing it.
- **Horizon and Pulse** are admin-only (403/401 otherwise). Don't link to them for non-admins.

## 3. Full scan checklist (after F1–F8)

Work through the codebase systematically, module by module, and record each finding with file:line, severity, and the fix.

**Correctness**
- Type-check and lint errors, including `@tanstack/eslint-plugin-query` and react-hooks rules.
- Stale closures and missing effect dependencies; effects that should be event handlers; state derived via `useEffect` instead of computed.
- Query keys that don't include all parameters, so the cache serves the wrong data. Mutations that don't invalidate or update the right keys.
- Zod models out of sync with backend Resources (compare against `backend/app/Http/Resources`). Nullable fields, number/string decimals (Finance amounts arrive as strings), and date formats.
- Pagination, filter and sort params actually sent to the API and matched to the backend FormRequest rules.
- Form defaults and resets when drawers reopen for a different record. Edit forms posting unchanged or derived fields.
- Race conditions such as double-submits (disable the button while `isPending`) and out-of-order responses on search inputs (debounce, plus `keepPreviousData`).
- Memory leaks: hls.js instances, `three`/WebGL contexts, `lenis`/`gsap` timelines, object URLs (`URL.revokeObjectURL`), and event listeners not cleaned up on unmount.

**Security**
- Every `dangerouslySetInnerHTML`, `innerHTML`, `href={userValue}` (block `javascript:`/`data:`), `window.open` (use `noopener,noreferrer`), and `target="_blank"` without `rel`.
- Tokens or PII in `localStorage`/Zustand persist. Sanctum uses cookies, so nothing secret belongs in storage.
- Permission checks: routes guarded by `ProtectedRouteType` permissions. Buttons hidden via `hasPermission`, but never relied on as the only guard.
- No secrets or internal URLs in `VITE_*` env vars or the bundle (grep `dist/` after the build).
- Open redirects in login `?redirect=` handling. Only allow same-origin relative paths.

**Performance**
- Bundle size: route-level `lazy()` for heavy modules. Make sure `three`, `postprocessing`, `gsap`, TipTap, Recharts and hls.js aren't in the main or admin chunk. Inspect the `vite build` output.
- Unnecessary re-renders from unstable props or contexts, large lists without virtualization, and images without dimensions or lazy loading.
- TanStack Query: sensible `staleTime`, no refetch loops, and `enabled` guards on dependent queries.

**UX / a11y / i18n**
- Each screen has loading, empty, error and 403 states.
- Every string is translated (en, fa, ps), with RTL layout and logical CSS properties (`ms-`/`me-` rather than `ml-`/`mr-`).
- Keyboard navigation and focus trapping in Drawers/Dialogs, labels on inputs, colour contrast per `DESIGN.md`, and `aria-*` on icon-only buttons.

**Dead code and hygiene**
- Unused components, hooks, exports, routes, translations and dependencies. Check whether `motion`, `gsap` and `lenis` are all needed, and the `three` stack.
- `console.*`, commented-out blocks, TODOs older than the current release, and duplicated UI that should use a `src/components/ui` primitive.

## 4. Verification before you finish

1. Run `tsc`, `lint` and `build` in the throwaway container: **zero errors**, with the warning count reported relative to the baseline.
2. Add a minimal test setup only if the user approves; there's no frontend test suite today. At minimum, unit-test `sanitizeHtml` with known XSS payloads.
3. Smoke test the production URL in the browser tools without logging in as a real user or creating data:
   - The public site, the catalog, the course view page with rich text, and the login page.
   - Desktop and mobile screenshots, `fa`/`ps` RTL, and a 401 redirect to login.
   - Don't submit forms that write production data.
4. Run `graphify update /var/www/raad`.
5. **Don't deploy or restart the frontend container yourself.** List the exact build and deploy command for the user. The production image is built from `raad/frontend/Dockerfile`.

## 5. Deliverable

Write `raad/frontend/docs/REPORT-<date>-frontend-audit.md` containing:
- A summary table of every finding: ID, severity, file:line, issue, fix, status (fixed / deferred and why).
- Before and after numbers for `tsc`, lint and build, plus bundle sizes for the main chunks.
- Screenshots (paths) for desktop and mobile.
- Deferred items with recommended next steps, and any backend changes you need. Describe these but don't edit the backend.
- The exact deploy commands for the user.

Finish with a short summary in chat: what was fixed, what remains, and the risk level of the remaining items.
