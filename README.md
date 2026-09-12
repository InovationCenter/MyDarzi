# MyDarzi — Tailor Mobile App

Local-first mobile app for tailoring businesses: customers, measurements, orders, payments, and production — fully usable offline.

| Phase | Focus | Status |
|-------|--------|--------|
| **Phase 1** | Local-only MVP | In progress |
| **Phase 2** | Backend, sync, multi-device | Not started |

## Stack

- **React Native CLI** (0.87) + TypeScript — **not Expo**
- SQLite via `@op-engineering/op-sqlite`
- React Navigation (bottom tabs)
- Local-first repositories (UI → domain → repository → SQLite)

## For coding agents

Read **[`AGENTS.md`](./AGENTS.md)** first, then [`PROJECT_REQUIREMENTS.md`](./PROJECT_REQUIREMENTS.md).

Key constraint: **do not build a backend in Phase 1.**

## Documentation

| Doc | Contents |
|-----|----------|
| [AGENTS.md](./AGENTS.md) | Agent operating rules |
| [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md) | Full product & phase specification |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, layers, navigation |
| [DATABASE.md](./DATABASE.md) | Schema, migrations |
| [PHASE_1.md](./PHASE_1.md) | Phase 1 progress |

## Prerequisites

- Node.js ≥ 22.11
- JDK 17
- Android Studio + Android SDK / emulator (or device)
- For iOS: macOS + Xcode (not required for Android-only)

## Run the app

```bash
npm install
npm start
```

In another terminal:

```bash
npm run android
```

## License

_TBD_
