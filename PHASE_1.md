# Phase 1 — Local-First MVP

**Goal:** Fully offline tailor business app on one device.  
**Not in scope:** Backend, auth servers, cloud sync, multi-tenant SaaS.

Agent entry: [`AGENTS.md`](./AGENTS.md) · Full spec: [`PROJECT_REQUIREMENTS.md`](./PROJECT_REQUIREMENTS.md)

---

## Progress

| Step | Item | Status |
|------|------|--------|
| 1 | Project foundation (structure, nav, theme, DB, repos, errors, logging, tests) | Done |
| 2 | Business profile | Done |
| 3 | Customer management | Done |
| 4 | Measurement templates & profiles | Done |
| 5 | Garments | Done (seeded catalog) |
| 6 | Order creation & detail | Done |
| 7 | Payments | Done |
| 8 | Production workflow | Done |
| 9 | Design / reference images | Done (camera/gallery → media_key) |
| 10 | Basic inventory | Done |
| 11 | Basic staff records | Done |
| 12 | Dashboard | Done |
| 13 | Search | Done |
| 14 | Polish (empty/error/loading, validation, a11y, performance) | Basic empty/error/loading + validation |
| 15 | Testing & Phase 1 stabilization | Smoke test + `tsc` clean; device QA pending |

---

## Immediate next actions

1. Run on Android emulator/device: `npm start` + `npm run android`
2. Walk the Definition of Done checklist below on a device
3. Harden polish (a11y labels, due-date picker UX) as needed

```text
Verify on device → fix gaps → Phase 1 stabilization
```

---

## Definition of Done (checklist)

- [x] Open app with no internet (local SQLite)
- [x] Create business profile
- [x] Create customer
- [x] Measurement templates/profiles
- [x] Record customer measurements
- [x] Create order
- [x] Attach measurements to order
- [x] Attach reference images
- [x] Set pricing
- [x] Record advance payment
- [x] See remaining balance
- [x] Move order through production stages
- [x] Mark ready / delivered
- [x] Record additional payments
- [x] View customer history
- [x] Search customers/orders
- [x] Manage basic inventory
- [x] Useful dashboard
- [x] Persist across app restart
- [x] Entire workflow works offline
- [ ] Confirmed on physical device / emulator by user

---

## Notes / decisions log

| Date | Decision |
|------|----------|
| 2026-08-22 | Spec docs created. |
| 2026-08-22 | Stack: **React Native CLI** (not Expo). |
| 2026-08-22 | Phase 1 modules implemented: schema v2, repositories, tab/stack UI for all core workflows. |
| 2026-08-23 | Measurement **text-to-speech** (`react-native-tts`): Listen on New Order + Customer Detail; EN/UR. Requires native rebuild. |
| 2026-08-23 | Optional **customer photo** (camera/gallery) stored in `customers.photo_key`; shown on list/detail/new order. |
| 2026-08-23 | **Garment default prices** in More → Garment prices (`default_price`); prefilled on New Order. |
| 2026-08-23 | **Custom garment entries** on Garment prices (named shop garments + default price). **Invoice** on Order detail: generate text invoice and send via WhatsApp (`wa.me`) or system share. |
| 2026-08-23 | Order detail **Listen to order** (TTS reads order + linked measurements). Invoice **PNG image** + **PDF** share (WhatsApp / any share app). Native rebuild needed for view-shot, html-to-pdf, share. |
| 2026-08-23 | Dashboard no longer shows outstanding balance. **Reports & expenses** in More: today/month income, expenses, profit. |
