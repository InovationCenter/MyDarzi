# Tailor Mobile App — Agent Instructions

**Document Version:** 1.0  
**Current Phase:** Phase 1 — Local-First Mobile MVP  
**Future Phase:** Phase 2 — Backend, Cloud Persistence & Synchronization  

This file is the primary instruction set for coding agents working in this repository.  
Full product requirements live in [`PROJECT_REQUIREMENTS.md`](./PROJECT_REQUIREMENTS.md).

---

## Mission

Build a **mobile-only, local-first** tailoring business management app.

Phase 1 success principle:

> A tailor can manage customers, measurements, orders, payments, and production from one phone, even without internet.

Phase 2 will later add cloud backup and sync **without rewriting the app**. Do not implement Phase 2 yet.

---

## Hard Rules (Non-Negotiable)

1. **Do not jump to backend development.** No APIs, cloud DBs, auth servers, or fake backend stubs in Phase 1.
2. **Fully offline.** All core workflows must work with zero network.
3. **Local-first architecture.** UI → business logic → repository → local database. UI must never talk to the DB implementation directly.
4. **Clean data layer for future sync.** Repositories must be abstract enough that Phase 2 can add a remote API beside the local DB without rewriting screens or domain logic.
5. **Stable global IDs** (UUIDs). Do not rely on auto-increment as the only identity.
6. **Timestamps + soft delete** on major entities: `id`, `created_at`, `updated_at`, `deleted_at`. Prefer `sync_status` (`pending` | `synced` | `failed`) for future sync; do not implement remote sync yet.
7. **Relational local DB** (not key-value) for business entities. Support relationships, queries, transactions, indexes, migrations.
8. **No mock data instead of real persistence.** Seed data for demos is OK; core modules must write to the local DB.
9. **Do not build everything at once.** Follow the Phase 1 order below. Prefer simple Phase 1 solutions; avoid unnecessary dependencies.
10. **Do not replace the stack** unless the repo is empty or there is a strong, documented technical reason.

---

## Conceptual Architecture

```text
UI
 |
 v
Application / Business Logic
 |
 v
Repository / Data Access Layer
 |
 +-------------------+
 |                   |
 v                   v
Local Database     Remote API   ← Phase 2 only
                    |
                    v
                 Backend
```

**Phase 1 path only:** UI → Business Logic → Repository → Local Database.

---

## First Immediate Task

Do **not** start by building every screen.

```text
Inspect project
    ↓
Document architecture (update docs below)
    ↓
Create local data model
    ↓
Create database + migrations
    ↓
Create repository layer
    ↓
Create navigation foundation
    ↓
Create basic app shell
    ↓
Begin Customer module
```

### Startup checklist

1. Inspect the existing repository/project.
2. Determine the current technology stack.
3. Identify existing code and reusable components.
4. Do not replace the technology stack unless strongly justified and documented.
5. Create/update project documentation.
6. Design the initial local database schema.
7. Design the repository/data-access abstraction.
8. Implement the application foundation.
9. Implement Phase 1 features incrementally.
10. Test each major module before moving to the next.

If the repository is empty, choose an appropriate modern mobile stack, document the choice in `ARCHITECTURE.md`, then proceed.

---

## Phase 1 Implementation Order

| Step | Focus |
|------|--------|
| 1 | Foundation: structure, navigation, theme, local DB, repositories, errors, logging, tests |
| 2 | Business profile |
| 3 | Customer management |
| 4 | Measurement templates & profiles |
| 5 | Garments |
| 6 | Order creation & detail |
| 7 | Payments |
| 8 | Production workflow |
| 9 | Design / reference images |
| 10 | Basic inventory |
| 11 | Basic staff records |
| 12 | Dashboard |
| 13 | Search |
| 14 | Polish (empty/error/loading states, validation, a11y, performance) |
| 15 | Testing & Phase 1 stabilization |

---

## Phase 1 Scope (Build These)

- Business profile (single local business)
- Customers (CRUD, search, archive, profile with history + New Order)
- Measurement templates, profiles, history, copy, in/cm, customizable fields
- Garments (Shalwar Kameez, Kurta, Shirt, Trouser, Suit, Waistcoat, Dress, Custom)
- Orders (multi-item, pricing, due date, status, notes, images)
- Fast order workflow: Customer → Garment → Measurements → Design → Pricing → Advance → Due date → Confirm
- Production statuses: New → Measurement → Cutting → Stitching → Finishing → Quality Check → Ready → Delivered
- Payments (advance, additional, balance, immutable history / adjustments)
- Design/reference images (camera/gallery; storage abstractable for future cloud)
- Basic inventory + stock adjustments
- Basic staff records (no cloud auth/permissions yet)
- Dashboard with actionable lists + quick actions
- Search (customers, phones, order numbers, garments, notes)

## Explicitly Out of Scope for Phase 1

Backend, auth servers, cloud sync, multi-device sync, multi-tenant SaaS, customer-facing app, WhatsApp/SMS automation, online payments, multi-branch, suppliers, advanced accounting, AI features, subscriptions, marketplace.

A sync-queue **abstraction** is optional in Phase 1; remote sync is **not**.

---

## Definition of Done — Phase 1

A user can offline: set up business profile; manage customers & measurements; create orders with images, pricing, and advance payment; track production to ready/delivered; record further payments; search; manage basic inventory; use the dashboard; close/reopen the app without data loss.

---

## Documentation the Agent Must Maintain

Create or update (prefer update over duplication):

| File | Purpose |
|------|---------|
| `README.md` | How to run, stack, Phase overview |
| `PROJECT_REQUIREMENTS.md` | Full product & phase requirements (source of truth) |
| `ARCHITECTURE.md` | Structure, DI, state, navigation, sync-ready decisions |
| `DATABASE.md` | Schema, relationships, migrations, soft delete, IDs |
| `PHASE_1.md` | Current Phase 1 status, what’s done / next |
| `AGENTS.md` | This file — agent operating instructions |

Document irreversible architectural decisions before making them.

---

## Testing Expectations

Add tests as core modules land. Minimum coverage areas: customer CRUD/search/archive; measurement create/update/copy/history; order create/update/status/due dates; payment balance & discounts; inventory adjustments; DB migrations, relationships, transactions.

---

## When Unsure

1. Prefer the simpler local solution that preserves the repository abstraction.
2. Do not add network or backend “just in case.”
3. Check `PROJECT_REQUIREMENTS.md` for detailed entity and UX rules.
4. Update `PHASE_1.md` with progress after each completed step.
