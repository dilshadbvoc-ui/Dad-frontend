# Dad-frontend — Web Dashboard (CLAUDE.md)

This file is auto-loaded for any Claude Code session working inside `Dad-frontend/`. It is a verified map of the codebase, not a wishlist — every claim here was checked against the actual source. If something looks off after a refactor, re-verify rather than trusting this blindly, but treat it as accurate as of the time it was written.

## Overview

`Dad-frontend` is the web dashboard for PypeCRM, a multi-tenant CRM. It's a React 19 + TypeScript + Vite 7 single-page app used by org admins, managers, and sales/field reps to manage leads, contacts, accounts, opportunities, quotes, marketing campaigns, field-force tracking, and reporting. It talks to the Node/Express/Prisma backend (`Dad-backend`, a sibling folder — not covered by this file) over a REST API plus a Socket.IO channel for real-time events. Package name in `package.json` is `client`.

This is a *separate git repository* (`Dad-frontend/.git` exists independently) from the top-level `pypecrm` folder, and deploys independently (there's a `vercel.json`).

Note: this file is distinct from the root `pypecrm/.claude/CLAUDE.md`, which is a project-wide, mobile-Flutter-focused instructions file. Don't confuse the two — the Flutter mobile app described there is a *separate, planned* client; it is not related to the `android/` folder in this repo (see below).

## Running & tooling

- `npm run dev` — starts Vite dev server (default Vite port, typically 5173). Dev server proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:5001` (see `vite.config.ts`), which is where `Dad-backend` runs locally.
- `npm run build` — `tsc -b && vite build` (type-checks before bundling).
- `npm run lint` — `eslint .` (uses the flat config `eslint.config.js`; see Footguns below about a dead legacy `.eslintrc.js`).
- `npm run preview` — serves the production build locally.
- Backend base URL resolution (`src/config.ts`): uses `VITE_API_URL` if set; otherwise, if the page is loaded from a non-localhost hostname, defaults to `window.location.origin` (assumes backend serves the built frontend from the same host); otherwise falls back to `http://localhost:5001`.

## Directory map (`src/`)

```
src/
  App.tsx            Route table + top-level providers + auth bootstrap (see Routing map)
  main.tsx            Vite entry point
  config.ts           API_URL resolution logic
  index.css            Design tokens + reusable component classes (see Design system)
  App.css
  types.d.ts

  pages/               ~30 route-level folders, one per CRM module (see Page/module inventory)
  components/
    ui/                shadcn/Radix-style primitives (button, dialog, table, select, toast, data-table, etc.)
    shared/             App chrome + cross-cutting dialogs: Layout, Sidebar, Header, BottomNav,
                          GlobalSearch, NotificationPopover, CommandCenter, EditLeadDialog/EditAccountDialog/
                          EditContactDialog, Logo, SEO, ViolationAlert, PersistentBroadcastModal, etc.
    dashboard/          Dashboard widgets (SalesChartWidget, LeadSourcesWidget, TopPerformersWidget, ...)
    landing/            Marketing landing page sections (Hero, PricingTable, FAQSection, ...) — NOTE: uses
                          hardcoded Tailwind colors, not the design token system (see Footguns)
    leads/              Lead-specific dialogs (AddProductToLeadDialog, LeadTimeline, QuickConvertWon/Lost)
    organisation/       AssignLeadDialog, BulkImportLeads
    settings/           CustomFieldDialog, GmailConnect, IntegrationConfigDialog, MetaAccountConfigDialog
    super-admin/        Org/plan management dialogs for the super-admin console
    WhatsApp/           ChatWindow, ConversationList, MediaPreview, TemplatePicker (WhatsApp inbox UI)
    Communications/     LogInteractionDialog (note PascalCase folder — inconsistent with other lowercase dirs)
    icons/              BrandLogos.tsx
    common/             MapComponent.tsx (Leaflet wrapper)
    forms/              DynamicCustomFields.tsx (renders org-defined custom fields)
    (top-level .tsx files directly in components/: many feature dialogs live loose here rather than in a
     subfolder — AssignLeadDialog, CloseLostDialog, CloseWonDialog, ConvertLeadDialog, CreateFollowUpDialog,
     CreateOpportunityDialog, CreateQuoteDialog, CreateTaskDialog, LogCallDialog, LogNoteDialog,
     ScheduleMeetingDialog, SetFollowUpDialog, SetShufflerDialog, UpsellDialog, ViewOpportunityDialog,
     EditOpportunityDialog, EditDocumentDialog, EmailComposeDialog, EventDetailsDialog,
     UpdateFollowUpDialog, DailyBriefingDialog, AchievementNotification, CallRecordingPlayer,
     EMISchedulePanel — this is a known inconsistency, see Footguns)

  services/            API client layer, one file per backend domain (see API/data-fetching pattern)
  contexts/            React Context providers: Theme, Currency, Socket (see State management pattern)
  hooks/               useArrayData, useLeadStatuses, useProductViewNotifications
  lib/                 utils.ts (cn(), currency formatting, role-check helpers, phone formatting),
                        callUtils.ts, countryCodes.ts
  utils/               androidBridge.ts, mobileBridge.ts, environmentChecker.ts, notificationFeedback.ts,
                        roleUtils.ts (DUPLICATE of role helpers in lib/utils.ts — see Footguns)
  assets/              Static images incl. logo-light.png / logo-dark.png
```

## Routing map

Routing is `react-router-dom` v7 (`BrowserRouter`), defined entirely in `src/App.tsx`. Most pages are lazily loaded via `React.lazy`. Auth/eagerly-loaded pages (Login, Register, ForgotPassword, ResetPassword, LandingPage, Dashboard, SSOCallback, PrivacyPolicy, Terms) are imported directly at the top of `App.tsx`; everything else is `lazy()`-imported.

**There is no `ProtectedRoute` component.** Routes are grouped under a single `<Route element={<Layout />}>` wrapper, but `Layout` (`src/components/shared/Layout.tsx`) does **not** check auth or redirect unauthenticated users — it just renders the sidebar/header/outlet shell. Auth is enforced *reactively*: `src/services/api.ts`'s Axios response interceptor catches any `401` from the backend, clears `userInfo` from localStorage, and dispatches a `window` `auth-logout` event, which `AuthListener` (declared inside `App.tsx`) catches to `navigate('/login')` and clear the Query cache. Practically: visiting a protected URL while logged out briefly renders the authenticated shell/page before the first failed API call kicks you to `/login`. There is a `PublicRoute` wrapper (also defined inline in `App.tsx`, not a separate file) used only on `/login`, `/sso-login`, and `/register`, and on `/` (LandingPage) — it redirects to `/dashboard` if a `userInfo.token` already exists in localStorage.

Session bootstrap on app load (`AppContent` in `App.tsx`) is nontrivial: it reads `userInfo` from localStorage, optionally recovers a token from the native Android bridge (`getAndroidToken()`) if `autoLogin` was set, calls `GET /auth/me` to revalidate, and has a 4s (mobile WebView) / 10s (desktop) failsafe timer so a hung request doesn't block the UI forever behind `<PageLoader text="Verifying session..." />`.

There's no role-based route gating at the router level either — role checks (`isAdmin`, `isOrgAdmin`, `isSuperAdmin` from `src/lib/utils.ts`) are applied ad hoc inside pages/components (e.g. `Sidebar.tsx` hides nav items by role) rather than blocking navigation.

Several routes are commented out in `App.tsx` even though their page components and lazy imports still exist — these pages are currently unreachable via the UI (see "Where NOT to look" below):
- `/communications` → `CommunicationsPage` (`src/pages/communications/index.tsx`)
- `/ai-writer` → `AiWriterPage` (`src/pages/marketing/ai-writer.tsx`)
- `/goals` → `GoalsPage` (`src/pages/goals/index.tsx`)
- `/analytics` (top-level) is commented out, but the same `AnalyticsPage` component is reachable at `/reports/analytics`, so that page isn't dead — just double-mapped/cleaned up to one path.

| Path | Component file | Auth | Notes |
|---|---|---|---|
| `/` | `pages/LandingPage.tsx` | Public (redirects to `/dashboard` if logged in) | Marketing homepage |
| `/login` | `pages/Login.tsx` | Public-only | |
| `/sso-login` | `pages/SSOLogin.tsx` | Public-only | lazy |
| `/sso-callback` | `pages/SSOCallback.tsx` | Public | no PublicRoute wrapper |
| `/register` | `pages/Register.tsx` | Public-only | |
| `/forgot-password` | `pages/ForgotPassword.tsx` | Public-only | |
| `/reset-password/:resetToken` | `pages/ResetPassword.tsx` | Public | |
| `/pages/:slug` | `pages/public/LandingPageView.tsx` | Public | user-built landing pages (marketing feature) |
| `/privacy`, `/terms` | `pages/PrivacyPolicy.tsx`, `pages/Terms.tsx` | Public | outside the `Layout` route group |
| `/shared-product/:slug` | `pages/public/SharedProductPage.tsx` | Public | outside `Layout`; public product-share link |
| `/dashboard` | `pages/Dashboard.tsx` | Inside Layout | home screen after login |
| `/leads`, `/leads/new`, `/leads/import`, `/leads/:id` | `pages/leads/*` | Inside Layout | |
| `/re-enquiries` | `pages/re-enquiries/index.tsx` | Inside Layout | |
| `/duplicates` | `pages/duplicates/index.tsx` | Inside Layout | |
| `/contacts`, `/contacts/:id` | `pages/contacts/*` | Inside Layout | |
| `/accounts`, `/accounts/:id` | `pages/accounts/*` | Inside Layout | |
| `/opportunities`, `/opportunities/:id` | `pages/opportunities/*` | Inside Layout | list is full-width (see Layout logic) |
| `/emi-schedules` | `pages/emi-schedules/index.tsx` | Inside Layout | |
| `/marketing`, `/marketing/ads`, `/marketing/ads-manager`, `/marketing/sms`, `/marketing/landing-pages`, `/marketing/forms`, `/marketing/campaigns/new`, `/marketing/lists`, `/marketing/whatsapp` | `pages/marketing/*` | Inside Layout | |
| `/whatsapp/inbox` | `pages/WhatsAppInbox.tsx` | Inside Layout | full-width page |
| `/calendar` | `pages/calendar/index.tsx` | Inside Layout | |
| `/follow-ups` | `pages/follow-ups/index.tsx` | Inside Layout | |
| `/calls` | `pages/calls/index.tsx` | Inside Layout | |
| `/settings` + ~25 `/settings/*` sub-routes | `pages/settings/*` | Inside Layout | profile, team, branches, roles, pipelines, custom-fields, territories, call-recording, whatsapp-scraper, import, bulk-import, billing, audit-logs, developer, shuffler, broadcast, organisation, lead-scoring, assignment-rules, integrations, notifications, lead-statuses, gmail-callback |
| `/users/:id` | `pages/users/[id].tsx` | Inside Layout | |
| `/organisation/hierarchy` | `pages/organisation/hierarchy.tsx` | Inside Layout | |
| `/automation`, `/automation/new`, `/automation/:id`, `/workflows` | `pages/automation/*` | Inside Layout | workflow builder, full-width |
| `/products` | `pages/products/index.tsx` | Inside Layout | |
| `/quotes` | `pages/quotes/index.tsx` | Inside Layout | |
| `/field-force` | `pages/field-force/index.tsx` | Inside Layout | |
| `/support` | `pages/support/index.tsx` | Inside Layout | |
| `/training` | `pages/Training.tsx` | Inside Layout | |
| `/trash` | `pages/trash/index.tsx` | Inside Layout | soft-delete recovery |
| `/sales-targets` | `pages/sales-targets/index.tsx` | Inside Layout | |
| `/sales/commissions` | `pages/sales/commissions` | Inside Layout | |
| `/reports` + ~13 sub-routes | `pages/reports/*` | Inside Layout | analytics, sales-book, user-sales, campaigns, field-force, leads, follow-ups, audit-logs, call-analytics, user-total, daily, lead-distribution |
| `/super-admin`, `/super-admin/organisation/:id`, `/super-admin/seo`, `/super-admin/restore` | `pages/super-admin/*` | Inside Layout | platform-level admin console (cross-tenant) |
| `/notifications` | `pages/notifications/index.tsx` | Inside Layout | |

## Page/module inventory (`src/pages/`)

Grouped by function; one line each, confirmed by opening a representative file per folder:

**Sales pipeline / CRM core**
- `leads/` — lead list (server-paginated `DataTable`), detail, create, bulk import, bulk assign/status dialogs.
- `re-enquiries/` — leads that re-enquired after being closed, tracked separately from fresh leads.
- `duplicates/` — duplicate-lead detection/merge UI.
- `contacts/`, `accounts/` — CRM contact and account (company) records, each with list + detail + columns.
- `opportunities/` — deal pipeline with a Kanban board (`KanbanBoard.tsx`) plus list/detail views.
- `quotes/` — quote generation.
- `products/` — product catalog.
- `emi-schedules/` — installment/EMI payment schedule tracking tied to opportunities (finance vertical feature).

**Engagement / communication**
- `communications/` — unified communications log page (currently unreachable, route commented out).
- `WhatsAppInbox.tsx` (top-level page) + `whatsapp/inbox` route — live WhatsApp chat inbox.
- `calls/` — call log/history.
- `calendar/` — scheduled meetings/events.
- `follow-ups/` — follow-up task list, with a mobile-card variant.
- `notifications/` — in-app notification center.

**Marketing**
- `marketing/` — hub page plus subpages: `ads` (Meta ads dashboard), `AdsManager.tsx`, `sms/` (SMS campaigns), `landing-pages/` (build/manage public landing pages), `forms/` (web-form builder for lead capture), `whatsapp/` (WhatsApp campaigns), `lists/` (email lists), `ai-writer.tsx` (AI copy generation, unreachable), `new-campaign.tsx`.

**Field operations**
- `field-force/` — field rep location/visit tracking (works with `components/common/MapComponent.tsx`, Leaflet-based).
- `automation/` — workflow automation builder (`workflows.tsx`, `WorkflowDetail.tsx`, `new.tsx`), full-width layout.

**Sales performance**
- `goals/` — sales goals (unreachable, route commented out).
- `sales-targets/` — sales target tracking.
- `sales/commissions/` — commission tracking.
- `reports/` — large module: sales book, user sales, campaign reports, field-force reports, lead reports, follow-up reports, audit logs, call analytics, performance report, daily report, lead distribution, general analytics.

**Admin / settings**
- `settings/` — large module: profile, team, branches, roles, pipelines, custom fields, territories, call recording, WhatsApp scraper, import/bulk-import, billing, audit logs, developer settings (API keys etc.), lead scoring, assignment rules, integrations (Gmail/Meta), notification prefs, lead statuses, broadcast, shuffler (lead round-robin config — UI only, per project rule the actual round-robin logic lives in the backend).
- `organisation/hierarchy.tsx` — org chart / reporting hierarchy view.
- `users/[id].tsx` — user profile page.
- `super-admin/` — platform-owner console: org list/detail, plan assignment, SEO settings, data restore tooling. Separate from tenant-level `settings/organisation/`.
- `trash/` — recover soft-deleted records.
- `support/` — support/help page.
- `Training.tsx` — training/onboarding content page.

**Public / auth**
- `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `SSOLogin.tsx`, `SSOCallback.tsx` — auth flows.
- `LandingPage.tsx` — marketing homepage (see Design system discrepancy below).
- `PrivacyPolicy.tsx`, `Terms.tsx` — legal pages.
- `public/LandingPageView.tsx` — renders org-built landing pages at `/pages/:slug` (customer-facing, not this app's own landing page).
- `public/SharedProductPage.tsx` — public product-share link view.
- `Dashboard.tsx` — main authenticated home screen, built from `components/dashboard/*` widgets.

## API/data-fetching pattern

- **Axios client**: `src/services/api.ts` exports a single configured `api` instance (`baseURL: ${API_URL}/api`, `withCredentials: true`, `timeout: 60000`).
- **Auth injection**: a request interceptor reads `userInfo` from `localStorage`, parses `.token`, and sets `Authorization: Bearer <token>`. There is no refresh-token flow — one JWT stored client-side.
- **401 handling**: response interceptor clears `userInfo` and fires a global `auth-logout` window event (unless already on `/login` or the failing request was itself `/auth/login`) — see Routing map above for how that's consumed.
- **500s**: just logged, not otherwise special-cased; callers handle their own error UI.
- **Service files** (`src/services/*.ts`, ~35 files): one file per backend domain, each a flat set of exported functions (not classes) wrapping `api.get/post/put/delete` calls, e.g. `leadService.ts`, `accountService.ts`, `contactService.ts`, `opportunityService.ts`, `quoteService.ts`, `productService.ts`, `taskService.ts`, `followUpService.ts`, `callService.ts`/`callSettingsService.ts`, `eventService.ts`, `emiService.ts`, `goalService.ts`, `salesTargetService.ts`, `commissionService.ts`, `userService.ts`, `settingsService.ts`, `billingService.ts`, `subscriptionPlanService.ts`, `assignmentRuleService.ts`, `analyticsService.ts`, `notificationService.ts`, `trashService.ts`, `caseService.ts`, `checkInService.ts`, `interactionService.ts`, `developerService.ts`, `adService.ts`, `marketingService.ts`, `smsCampaignService.ts`, `whatsAppService.ts`/`whatsAppCampaignService.ts`, `webFormService.ts`, `landingPageService.ts`, `gmailService.ts`, `workflowService.ts`, `pipelineService.ts`. Also `socketService.ts` (below) — not an HTTP service.
  - Service files also export their own TypeScript interfaces for the domain models (e.g. `Lead`, `LeadQueryParams`, `CreateLeadData` in `leadService.ts`) rather than a centralized `types/` directory.
- **socketService.ts**: a singleton class (`SocketService`) wrapping `socket.io-client`. `connect(userId)` tears down and recreates the socket to avoid stale room subscriptions across user switches. Reads the token straight from `localStorage.userInfo` (independent of the Axios interceptor). Socket URL resolution mirrors `config.ts`'s logic but is duplicated locally in this file rather than importing `API_URL` (a minor duplication to be aware of).
- **TanStack Query**: v5, configured once in `App.tsx` (`staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`, `refetchOnMount: true`, `retry: 1`). Query keys are ad hoc arrays per page, not a centralized key factory, e.g. `['leads', 'all', ownerFilter, branchFilter, sourceFilter, statusFilter, dateFilter, searchTerm]`, `['tasks', 'all']`, `['users', 'list']`, `['branches', 'list']`, `['lead-sources']`. Real-time socket events (`lead_created`, `lead_updated`, `lead_deleted`, `notification`) trigger `queryClient.invalidateQueries` in `Layout.tsx` to keep TanStack Query data fresh without polling.
- Server-side pagination/sorting/filtering is standard for list pages (`LeadQueryParams`-style params objects passed straight through to the backend).

## Design system / theming

Tailwind v4 (via `@tailwindcss/postcss`, imported with `@import "tailwindcss"` + `@config "../tailwind.config.js"` in `src/index.css` — the v4 CSS-first config style, layered with a v3-style `tailwind.config.js` for the `content` glob, `darkMode: ["class"]`, container settings, and the color→CSS-variable mapping). Design language: "Finance Breeze" — soft teal-gray background, near-black primary, very round corners (`--radius: 1.5rem`).

**CSS variable tokens** (defined in `:root` in `src/index.css`, all as HSL triples consumed via `hsl(var(--x))`):
`--background`, `--foreground`, `--card`/`--card-foreground`, `--popover`/`--popover-foreground`, `--primary`/`--primary-foreground`, `--secondary`/`--secondary-foreground`, `--muted`/`--muted-foreground`, `--accent`/`--accent-foreground`, `--destructive`/`--destructive-foreground`, `--success`/`--success-foreground`, `--warning`/`--warning-foreground`, `--info`/`--info-foreground`, `--border`, `--input`, `--ring`, `--radius`, `--sidebar-bg`/`--sidebar-text`/`--sidebar-active`/`--sidebar-hover`/`--sidebar-border`, `--chart-1`..`--chart-5`. All are re-declared under a `.dark` class selector (dark mode is a real, implemented variant, not stubbed).

`tailwind.config.js` maps these to Tailwind color utilities (`bg-background`, `text-primary`, `border-border`, `bg-sidebar-bg`, etc.) and to `borderRadius.lg/md/sm` derived from `--radius`.

**Reusable component classes** defined in `@layer components` in `index.css` — prefer these over ad hoc styling for new UI:
- `.finance-card` / `.card-ocean` — the two standard card surfaces (rounded, soft-shadow, no border).
- `.btn-ocean` — pill-shaped primary button (dark, hover-darken, scale-on-hover/active).
- `.gradient-ocean` / `.gradient-success` / `.gradient-warning` / `.gradient-danger` — gradient pill buttons.
- `.card-primary` / `.card-success` / `.card-warning` / `.card-danger` — soft gradient-tinted card backgrounds.
- `.stat-card-ocean` and colored variants (`stat-card-primary/success/warning/danger`) — dashboard KPI tiles.
- `.badge-ocean` and colored variants (`badge-success/warning/danger/info`).
- `.input-ocean`, `.table-row-ocean`, `.sidebar-ocean`, `.nav-item-ocean`/`.nav-item-ocean-active`, `.scrollbar-ocean`, `.progress-primary/success/warning/danger`.
- Plus `@layer utilities` helpers: `.text-gradient-*`, `.status-dot`+`.status-active/inactive/pending/...`, `.bg-success-light` etc., mobile-responsive helpers (`.hide-mobile`, `.table-stacked`, `.touch-safe`, `.safe-top`/`.safe-bottom` for notch/gesture-bar insets), and print styles.

**Known discrepancy — landing page does not use the token system.** `src/pages/LandingPage.tsx` and all of `src/components/landing/*` (Hero, FeatureSection, PricingTable, Testimonials, FAQSection, CTASection, Footer, LandingNavbar, IntegrationSection) use hardcoded Tailwind palette classes (`bg-blue-500`, `from-blue-600`, `text-indigo-400`, `bg-gray-900`, etc.) instead of the semantic `--primary`/`--background`/etc. tokens used everywhere else in the app. Confirmed by grep: zero occurrences of `hsl(var(...))` or token-based classes in any landing component. This is an observed inconsistency, not an intended pattern — do not treat the landing page's color choices as the app's design system when building new authenticated-app UI. Whether this is deliberate (marketing wants a distinct look) or just drift is unclear; ask before "fixing" it.

**Dark mode**: implemented and wired up (see State management pattern → ThemeContext), toggled via a `dark`/`light` class on `<html>`, with a `system` option that follows `prefers-color-scheme`. Default is light (not system) per `ThemeProvider`'s initial state.

## Logo / brand asset

`src/components/shared/Logo.tsx` swaps between `src/assets/logo-light.png` and `logo-dark.png` using Tailwind's `dark:hidden`/`dark:block` classes (both images always render; CSS toggles visibility), plus a gradient-text "PYPE CRM" wordmark (`from-indigo-400 to-violet-400`, notably *not* the theme's primary token — matches the landing page's hardcoded-color pattern rather than the app token system). Treat this as a fixed brand asset — don't casually restyle it without explicit request.

## State management pattern

- **Auth/session state**: not a React Context. Lives directly in `localStorage.userInfo` (JSON: `{ token, ...user fields }`) and is read ad hoc via `getUserInfo()` (`src/lib/utils.ts`) or raw `localStorage.getItem('userInfo')` calls scattered across many files (Layout, contexts, App.tsx). Changes are broadcast via two custom `window` events: `auth-refresh` (session data updated) and `auth-logout` (session invalidated) — several contexts/components listen for these independently rather than through a shared provider.
- **Contexts** (`src/contexts/`):
  - `ThemeContext`/`ThemeProvider` — light/dark/system theme, persisted to `localStorage.theme`.
  - `CurrencyContext`/`CurrencyProvider` — org currency (from `userInfo.organisation.currency`), exposes `formatCurrency`/`formatCurrencyCompact`/`currencySymbol`; also mirrors into a module-level variable in `lib/utils.ts` (`setGlobalCurrency`/`getGlobalCurrency`) so non-component code (e.g. service files, column defs) can format currency without a hook.
  - `SocketContext`/`SocketProvider` — wraps `socketService`, exposes `{ socket, connected, onlineUsers }`.
  - There is no `AuthContext`. If you need current-user info in a component, the established pattern is `getUserInfo()` from `lib/utils.ts`, not a context hook.
- **Server state**: TanStack Query for essentially all API-backed data (see API/data-fetching pattern above). No Redux/Zustand/Jotai in the dependency list.
- **Local/UI state**: plain `useState`/`useReducer` per component; no evidence of a global UI-state store.
- **Forms**: `react-hook-form` is a dependency; `components/ui/form.tsx` provides shadcn-style form field wiring. Not universally used — check a given page before assuming `react-hook-form` vs. plain controlled `useState` inputs.

## Known inconsistencies / footguns

1. **Duplicate role-check utilities.** `src/lib/utils.ts` and `src/utils/roleUtils.ts` both define `checkRole`, `isAdmin`, `isSuperAdmin` with near-identical logic. `Sidebar.tsx` (the main nav-gating consumer) imports from `lib/utils.ts`, along with `isOrgAdmin`/`canAccessSettings` which only exist in `lib/utils.ts`. Only one other file (`pages/settings/shuffler/index.tsx`) imports from `roleUtils.ts`. Treat `lib/utils.ts` as the canonical source for role checks; `utils/roleUtils.ts` looks like earlier/abandoned duplication.
2. **No route guards.** As covered in Routing map: auth enforcement is reactive (401 interceptor → logout event), not a preventative `ProtectedRoute`/`RequireAuth` wrapper. A logged-out user hitting a deep link briefly sees the app shell before being bounced.
3. **Landing page ignores the design token system** (see Design system section) — hardcoded blue/indigo/gray/green Tailwind classes throughout `components/landing/*` and `pages/LandingPage.tsx`, unlike the rest of the app.
4. **Inconsistent component organization.** Many feature dialogs live loose directly under `src/components/` (e.g. `CreateTaskDialog.tsx`, `LogCallDialog.tsx`) rather than in a domain subfolder, while others are properly grouped (`components/leads/`, `components/organisation/`). Folder casing is also inconsistent: `components/WhatsApp/` and `components/Communications/` are PascalCase; everything else under `components/` is lowercase.
5. **Two ESLint configs.** `.eslintrc.js` (legacy, `eslint:recommended`-based) still exists alongside the actual active config `eslint.config.js` (ESLint 9 flat config, referenced by the `lint` script). `.eslintrc.js` is not used by ESLint 9's flat-config resolution — it's dead and should not be edited expecting it to take effect.
6. **`antd` is a dependency but almost unused.** It's listed in `package.json` `dependencies`, but only one file in `src/` (`pages/settings/shuffler/index.tsx`) references `antd`. The rest of the app uses the Radix/shadcn-style `components/ui/*` primitives. Don't assume antd is the UI kit — it isn't, in practice.
7. **Commented-out but still-shipped routes/pages.** `communications`, `goals`, and `marketing/ai-writer` pages and their lazy imports still exist and are still bundled, but their `<Route>` entries are commented out in `App.tsx`, making them unreachable in the running app (see Routing map).
8. **`socketService.ts` duplicates `config.ts`'s URL-resolution logic** instead of importing `API_URL`, and has its own production hard-fallback to `https://pypecrm.com` baked in — a maintenance trap if the production domain ever changes (would need updating in two places).
9. **`getAssetUrl()` in `lib/utils.ts`** deliberately builds absolute URLs (protocol + host) for uploaded assets (brochures/images) specifically so React Router doesn't intercept the navigation — a non-obvious reason for what looks like it could be simplified to a relative path.
10. **Heavy `localStorage`/`window` event coupling.** Auth, theme, currency, and socket state are all synchronized through raw `localStorage` reads and custom `window` events (`auth-refresh`, `auth-logout`, native `storage` events) rather than a single source of truth. When debugging session/state-sync bugs, check all of: `App.tsx`'s `AppContent`/`AuthListener`, `SocketContext.tsx`, `CurrencyContext.tsx`, and `services/api.ts`'s interceptor — the logic is spread across all four.

## The `android/` folder

This is **not** Capacitor or Cordova. It's a hand-built native Android app (Kotlin, Gradle project, package `com.pypecrm.app`) that loads this Vite web app in a `WebView` and exposes a JS bridge object `window.AndroidBridge` (implemented natively in `android/app/src/main/java/com/pypecrm/app/bridge/CRMBridge.kt`) with methods the web app calls via `src/utils/androidBridge.ts` — `syncLeads`, `saveToken`, `saveApiUrl`, `getToken`, `clearToken`, `requestLocationPermission`, `getRecordingStatus`, `showNotification`, `initiateCall`. The native side also includes real telephony/background features a pure web app can't do: `CallCaptureService`, `CallRecordingAccessibilityService`, `CallStateReceiver`, `CallTrackerService`, `AudioRecorderService`, `WhatsAppNotificationListener`, `BackgroundSyncService`/`UnifiedSyncWorker`, and voice-interaction services — this strongly suggests the Android wrapper exists specifically to support call recording / caller-ID / WhatsApp-activity capture for field sales reps, which the mobile browser sandbox can't provide.

This is a completely separate, already-built native artifact from the *planned* Flutter mobile app referenced in the root `pypecrm/.claude/CLAUDE.md` — don't conflate the two, and don't assume Flutter/Riverpod conventions apply anywhere under `android/`.

## Noise to ignore

- `node_modules/`, `package-lock.json` — only one lockfile present (npm); no yarn/pnpm lockfile conflicts.
- `README.md` — unedited Vite template boilerplate, not project-specific; don't treat it as documentation.
- `.eslintrc.js` — dead legacy config (see Footguns #5).
- `uploads/` — present at the repo root but not referenced by the Vite app's `src/` or `vite.config.ts`; appears to be a leftover/orphaned artifact (possibly from local backend testing or a copy operation), not part of the frontend build.
- `prisma/` (with a `schema.prisma` and migrations) and `scripts/` (backend maintenance scripts like `resetPassword.ts`, `generateSuperAdminKey.ts`) — these are **backend** artifacts (Prisma is a `Dad-backend` concern; `package.json` here has no `prisma`/`@prisma/client`/`express` dependency at all). Their presence in `Dad-frontend/` is almost certainly accidental/orphaned — do not assume this frontend package touches the database directly, and do not "fix" these paths as if they're supposed to be here without asking.
- `.kiro/specs/emi-payment-system` — appears to be spec/planning docs from a different AI tool (Kiro), unrelated to Claude Code's workflow.
- `.vscode/`, `.npmrc` — editor/npm config, not app logic.
- `android/.gradle/`, `android/app/build/`, `android/app/release/`, `android/.idea/` — Android build/IDE output, never hand-edit.

## Where NOT to look / dead ends

- `pages/communications/`, `pages/goals/`, `pages/marketing/ai-writer.tsx` — real code, but currently unreachable (routes commented out in `App.tsx`). Don't assume they're live features; verify the route exists before treating them as in-scope.
- `utils/roleUtils.ts` — superseded/duplicated by `lib/utils.ts`'s role helpers (see Footguns #1). Prefer `lib/utils.ts`.
- `.eslintrc.js` — inert; `eslint.config.js` is what actually runs.
- `prisma/`, `scripts/`, `uploads/` at the repo root — backend-era orphans, not part of this app (see Noise to ignore).
- No test suite exists anywhere in this package: no `*.test.*`/`*.spec.*` files under `src/`, no Vitest/Jest config, and no test runner in `package.json`'s `devDependencies` or `scripts`. Do not assume tests exist or can be run — if asked to "run the tests," say plainly that there is no test setup rather than inventing one silently.
