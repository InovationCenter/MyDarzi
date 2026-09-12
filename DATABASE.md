# Database

**Status:** Active — migrations v1–v4.  
**Engine:** SQLite via `@op-engineering/op-sqlite`  
**Migrations:** `src/data/database/migrations.ts`

## Conventions

| Column | Notes |
|--------|--------|
| `id` | UUID text primary key |
| `created_at` / `updated_at` | ISO-8601 |
| `deleted_at` | Soft delete |
| `sync_status` | `pending` \| `synced` \| `failed` |

## Schema

| Table | Purpose |
|-------|---------|
| `schema_migrations` | Applied migration versions |
| `business_profile` | Single local business |
| `customers` | Customer CRM (optional `photo_key` local image URI) |
| `garments` | Garment catalog (seeded) + optional `default_price` for new-order prefills |
| `measurement_templates` + `_fields` | Customizable measurement templates |
| `measurement_profiles` + `measurement_values` | Per-customer measurement history |
| `orders` + `order_items` | Orders and line items |
| `payments` | Immutable payment / adjustment history |
| `expenses` | Shop expenses for profit reporting |
| `production_events` | Production status change log |
| `design_references` | Order reference images (`media_key`) |
| `alterations` | Basic alterations linked to orders |
| `inventory_items` + `inventory_transactions` | Stock + adjustments |
| `staff` | Basic staff records |

## Seeds

On first launch after migration v2, garments + system measurement templates (Shalwar Kameez, Shirt, Trouser) are inserted if empty.

## Schema changelog

| Version | Date | Notes |
|---------|------|-------|
| 1 | 2026-08-22 | `business_profile`, `customers` |
| 2 | 2026-08-22 | Full Phase 1 entity set + indexes |
| 3 | 2026-08-23 | `garments.default_price` for More → Garment prices |
| 4 | 2026-08-23 | `expenses` table for More → Reports (today/month profit) |
