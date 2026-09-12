# Architecture

**Status:** Active — Phase 1 Step 1 (foundation).  
**Phase:** Phase 1 local-first only. No remote API clients in this phase.

## Stack choice

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **React Native CLI** (not Expo) | User choice; bare RN for full native control (SQLite, camera, future on-device ML) |
| Language | TypeScript | Safer domain/repository boundaries |
| Local DB | **SQLite** via `react-native-quick-sqlite` or `op-sqlite` + migrations | Relational, transactions, indexes; sync-ready |
| State management | React context + lightweight hooks (expand later) | Keep UI free of DB details |
| Navigation | React Navigation (native stack + bottom tabs) | Mobile-first tabs/stacks |
| DI | Manual composition root (`src/app/dependencies.ts`) | Constructor injection into repositories / use cases |
| Auth | Abstraction: `local` now → `firebase` later | Login gate; swap provider in `src/config/appConfig.ts` |
| Analytics | Abstraction: noop now → Firebase Analytics later | Screen + event hooks already wired |
| Motion | `react-native-reanimated` | Login / dashboard fades + stack slide transitions |

**Rule:** Do not replace an existing stack without a strong, documented reason.  
**Note:** Flutter was considered earlier; project proceeds with React Native CLI per product owner decision.

## Auth & Analytics (Firebase later)

1. Paste IDs into `src/config/firebase.ts` (and add native `google-services.json` / `GoogleService-Info.plist`).
2. Install: `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/analytics`.
3. In `src/config/appConfig.ts` set:
   - `firebaseConfigured: true`
   - `authProvider: 'firebase'`
   - `analyticsEnabled: true` when ready
4. Finish TODOs inside `FirebaseAuthService` / `FirebaseAnalyticsService`.

Until then, **local email/password auth** gates the app and business data stays offline SQLite.

## Layering

```text
Presentation (UI / screens / components)
        ↓
Application / domain (use cases, validation, status rules)
        ↓
Repository interfaces
        ↓
Local data sources (DAO / queries)     [Phase 2: + remote data sources]
        ↓
Relational local database (SQLite)
```

- UI **must not** import database/ORM types.
- Repositories are the only persistence boundary the UI/domain should use.
- Phase 2 adds remote implementations behind the same repository interfaces (or a sync engine coordinating local + remote).

## Project layout (planned)

```text
src/
  app/           # composition root, navigation, theme providers
  domain/        # entities, use cases, validation (no RN imports)
  data/          # repository implementations, DB, migrations
  features/      # feature screens (customers, orders, …)
  shared/        # UI kit, logging, errors, utils
```

## Sync-ready decisions (Phase 1)

| Concern | Phase 1 approach |
|---------|------------------|
| Entity IDs | UUID (or equivalent collision-resistant IDs) |
| Soft delete | `deleted_at` nullable timestamp |
| Audit | `created_at`, `updated_at` |
| Sync marker | `sync_status`: `pending` \| `synced` \| `failed` (local only; no network sync yet) |
| Images | App-managed storage keys/paths, not raw device-coupled absolute paths in domain models |
| Idempotency | Stable IDs so Phase 2 retries won’t create duplicates |

Optional: a no-op or local-only sync queue abstraction. **Do not** implement API upload/download.

## Navigation (planned)

Dashboard home, Customers, Orders/Production, Inventory, Settings/Business profile — bottom tabs + nested stacks.

## Error handling & logging

- User-facing messages: plain language; no stack traces.
- Log technical detail for diagnostics.
- Validate required fields before writes; use transactions for multi-step writes (e.g. order + payment + status).

## Testing

- Prefer unit/integration tests around repositories and domain rules.
- See Phase 1 minimum test matrix in `PROJECT_REQUIREMENTS.md` §36.

## Open decisions

| Date | Decision |
|------|----------|
| 2026-08-22 | Use **React Native CLI** (not Expo, not Flutter). |
| 2026-08-22 | Local SQLite + repository abstraction for Phase 2 sync readiness. |
