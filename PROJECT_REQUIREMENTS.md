# Tailor Mobile App

## Project Requirements & Development Specification

**Document Version:** 1.0  
**Current Phase:** Phase 1 — Local-First Mobile MVP  
**Future Phase:** Phase 2 — Backend, Cloud Persistence & Synchronization  

> **Agent note:** Operating instructions and immediate start order are in [`AGENTS.md`](./AGENTS.md). This document is the full product specification.

---

# 1. Project Overview

Build a **mobile-only tailoring business management application**.

The application is intended for tailors and tailoring businesses to manage their complete day-to-day workflow from a mobile phone.

The application should eventually support:

* Customer management
* Measurements
* Measurement templates
* Garments
* Orders
* Designs/reference images
* Production workflow
* Fittings
* Alterations
* Payments
* Inventory
* Staff
* Appointments
* Notifications
* Reports
* Cloud backup
* Multi-device synchronization
* Multi-user businesses
* Multi-branch businesses
* SaaS subscriptions
* Customer-facing functionality

However, development must happen incrementally.

---

# 2. Development Strategy

The application must be designed as a **local-first application**.

The project will be developed in phases.

## Phase 0 — Architecture Foundation

Establish:

* Project structure
* Domain models
* Local database abstraction
* Repository/data-access layer
* Dependency injection where appropriate
* Navigation architecture
* State management architecture
* Error handling
* Logging
* Configuration management
* Testing structure

No backend is required in this phase.

---

# 3. Phase 1 — Local-Only MVP

## Objective

Create a fully usable tailoring management application that works **without an internet connection**.

All application data should initially be stored locally on the device.

The user should be able to run a small tailoring business using a single mobile device.

Phase 1 must NOT depend on:

* Backend APIs
* Cloud databases
* Authentication servers
* Internet connectivity

---

# 4. Critical Architectural Requirement

Although Phase 1 is local-only, the architecture MUST be designed so Phase 2 can introduce a backend without rewriting the entire application.

Use this conceptual architecture:

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
Local Database     Remote API
                    |
                    v
                 Backend
```

During Phase 1:

```text
UI
 |
 v
Business Logic
 |
 v
Repository
 |
 v
Local Database
```

During Phase 2:

```text
UI
 |
 v
Business Logic
 |
 v
Repository
 |
 +------------+
 |            |
 v            v
Local DB     API
              |
              v
           Backend
```

The UI must not directly access database implementation details.

---

# 5. Local Database Requirements

Use a proper relational/local database appropriate for the selected mobile technology.

Do NOT use simple key-value storage as the primary database for business entities.

The local database should support:

* Relationships
* Queries
* Transactions
* Indexes
* Updates
* Soft deletion
* Migration/versioning

---

# 6. Entity ID Requirements

Every major entity must have a globally unique ID.

Prefer UUIDs or another collision-resistant identifier.

Do NOT depend on local auto-increment IDs as the only identity mechanism.

Example:

```text
Customer:
c9f5b2c0-....

Order:
o82d1a1e4-....
```

This is required because Phase 2 will need to synchronize local records with backend records.

---

# 7. Timestamp Requirements

Major entities should contain:

```text
id
created_at
updated_at
deleted_at
```

`deleted_at` should support soft deletion.

Do not permanently delete records unless there is a specific reason.

Soft deletion will help future synchronization.

---

# 8. Phase 1 Functional Modules

Phase 1 should contain the following modules.

## 8.1 Business Profile

Store:

* Business name
* Owner name
* Phone number
* WhatsApp number
* Address
* Logo/photo
* Currency
* Default measurement unit

The application should be usable by one local business.

Do not implement multi-tenant cloud architecture yet.

---

# 9. Customer Management

Implement:

### Customer list

Features:

* Search
* Sort
* Add customer
* Edit customer
* Delete/archive customer
* View customer

### Customer fields

At minimum:

```text
id
name
phone
whatsapp
address
notes
photo
created_at
updated_at
deleted_at
```

### Customer profile

Display:

* Customer information
* Order history
* Measurement profiles
* Payment history
* Alteration history
* Notes

Provide a prominent:

**New Order**

action.

---

# 10. Measurement Management

Measurements are one of the core features of the application.

Support:

* Measurement templates
* Measurement profiles
* Measurement history
* Editing
* Copy previous measurements
* Measurement notes
* Inches
* Centimeters

Do not hard-code one universal measurement structure.

The system should support customizable measurement fields.

---

# 11. Measurement Templates

Initial templates may include:

### Men's Shalwar Kameez

Example fields:

* Kameez Length
* Shoulder
* Chest
* Waist
* Hip
* Sleeve
* Armhole
* Neck
* Cuff
* Shalwar Length
* Shalwar Bottom

### Shirt

Example:

* Length
* Shoulder
* Chest
* Waist
* Sleeve
* Neck
* Cuff

### Trouser

Example:

* Length
* Waist
* Hip
* Thigh
* Knee
* Bottom

Templates should eventually become customizable.

Phase 1 should establish the architecture for custom templates even if the first release only provides predefined templates.

---

# 12. Order Management

Orders are a core module.

An order should contain:

* Customer
* Garment(s)
* Measurements
* Design/reference images
* Fabric information
* Color
* Instructions
* Price
* Discount
* Advance payment
* Remaining balance
* Due date
* Status
* Notes
* Created date
* Updated date

---

# 13. Order Creation Workflow

The mobile order creation process should be optimized for speed.

Suggested flow:

```text
1. Select Customer
        ↓
2. Select Garment
        ↓
3. Select/Create Measurements
        ↓
4. Add Design/Reference
        ↓
5. Add Pricing
        ↓
6. Add Advance Payment
        ↓
7. Set Due Date
        ↓
8. Confirm Order
```

The user should not have to navigate through unnecessarily complicated screens.

---

# 14. Garments

Initial garment types can include:

* Shalwar Kameez
* Kurta
* Shirt
* Trouser
* Suit
* Waistcoat
* Dress
* Custom

The architecture must allow additional garment types to be added later.

---

# 15. Order Status / Production Workflow

Initial workflow:

```text
New
 ↓
Measurement
 ↓
Cutting
 ↓
Stitching
 ↓
Finishing
 ↓
Quality Check
 ↓
Ready
 ↓
Delivered
```

The system should store status changes as data rather than relying only on UI state.

Eventually statuses should become customizable.

---

# 16. Payment Management

Phase 1 should support:

* Total order amount
* Discount
* Advance payment
* Additional payments
* Remaining balance
* Payment history

Payment methods:

* Cash
* Bank
* Card
* Mobile Wallet
* Other

Payment records should be immutable where practical. Corrections should preferably be represented as adjustment/reversal records rather than silently modifying historical financial records.

---

# 17. Design / Reference Images

Because this is a mobile app, integrate the device camera/gallery where appropriate.

Allow users to:

* Take photo
* Select photo
* Attach photo to order
* Add notes
* Delete/archive reference

Examples:

* Clothing reference
* Collar design
* Sleeve design
* Embroidery
* Fabric
* Customer reference image

Images should be stored in a way that can later be migrated/synchronized to cloud storage.

Do not tightly couple the application to a device-specific file path.

---

# 18. Production Management

Phase 1 should provide a simple production workflow.

The tailor should be able to:

* View active orders
* Filter by status
* Change status
* View due dates
* Identify overdue orders
* Mark orders as ready
* Mark orders as delivered

Keep the first implementation simple.

Advanced employee assignment can be added later.

---

# 19. Alterations

Phase 1 should establish basic support for alterations.

An alteration should be associated with an order.

Store:

* Problem
* Requested change
* Notes
* Status
* Date
* Cost if applicable

Advanced alteration workflows can be introduced later.

---

# 20. Inventory

Phase 1 can include a basic inventory implementation.

Initial inventory items:

* Fabric
* Thread
* Buttons
* Zippers
* Lining
* Other materials

Support:

* Item name
* Category
* Quantity
* Unit
* Notes
* Stock adjustment

Advanced supplier and purchasing functionality can wait for a later phase.

---

# 21. Staff

Phase 1 may support basic staff records.

Example roles:

* Owner
* Cutter
* Stitcher
* Finisher
* Cashier
* Delivery

Do not build complex cloud authentication/permissions yet.

However, structure the domain so staff assignments and role-based permissions can be added later.

---

# 22. Dashboard

The home screen should prioritize actionable information.

Display:

* Today's orders
* Orders due today
* Overdue orders
* Ready orders
* Outstanding payments
* Recent customers
* Recent orders

Quick actions:

```text
+ New Order
+ Customer
+ Measurement
+ Payment
```

---

# 23. Search

Implement global/local search where practical.

The user should be able to quickly search:

* Customer name
* Phone number
* Order number
* Garment
* Order notes

Search performance should remain acceptable as the local database grows.

---

# 24. Mobile UX Requirements

The application is mobile-only.

Prioritize:

* One-handed usage
* Large touch targets
* Fast data entry
* Minimal typing
* Clear navigation
* Simple forms
* Confirmation for destructive actions
* Consistent buttons
* Consistent spacing
* Accessible text sizes
* Loading states
* Empty states
* Error states

Avoid desktop-style UI.

Do not attempt to fit large tables onto small screens.

Use cards, lists, sections, bottom sheets, tabs, and mobile-friendly forms where appropriate.

---

# 25. Offline Requirement

Phase 1 must work fully offline.

The following must NOT require internet:

* Customer creation
* Customer search
* Measurements
* Order creation
* Order editing
* Payment recording
* Production status changes
* Inventory changes
* Viewing historical data

---

# 26. Future Synchronization Preparation

Even though Phase 1 is offline-only, entities should be designed for future synchronization.

Recommended fields:

```text
id
created_at
updated_at
deleted_at
sync_status
```

Possible sync states:

```text
pending
synced
failed
```

A sync queue abstraction may be created in Phase 1, but actual remote synchronization should NOT be implemented until Phase 2.

---

# 27. Phase 2 — Backend

Phase 2 will introduce:

* User authentication
* Cloud database
* API
* Cloud backup
* Synchronization
* Multi-device support
* Remote image storage
* Server-side validation
* Conflict handling

Target architecture:

```text
Mobile App
    |
    +---- Local Database
    |
    +---- Sync Engine
             |
             v
           API
             |
             v
          Backend
             |
             v
        Server Database
```

The local database remains important.

The application should remain usable during temporary network failures.

---

# 28. Phase 2 Synchronization Model

Example:

```text
User creates order offline
        ↓
Save to local DB
        ↓
Mark as pending
        ↓
Add sync operation
        ↓
Internet becomes available
        ↓
Send operation to API
        ↓
Server validates
        ↓
Server stores data
        ↓
Client receives confirmation
        ↓
Mark local record as synced
```

The system must be designed to avoid duplicate orders when retrying failed requests.

Use idempotent operations where appropriate.

---

# 29. Phase 2 Multi-Device

Eventually:

```text
Phone
   \
    \
     → Backend ← Tablet
    /
   /
Second Phone
```

Changes made on one device should eventually appear on other authorized devices.

Conflict resolution must be explicitly designed.

Do not assume last-write-wins is always appropriate for every entity.

---

# 30. Future SaaS Architecture

Eventually the platform may support multiple businesses.

Conceptually:

```text
Platform
│
├── Business A
│   ├── Users
│   ├── Customers
│   ├── Orders
│   └── Inventory
│
├── Business B
│   ├── Users
│   ├── Customers
│   ├── Orders
│   └── Inventory
│
└── Business C
```

Data isolation between businesses is mandatory.

This does NOT need to be fully implemented in Phase 1, but the domain design should avoid making future multi-tenancy impossible.

---

# 31. Future Features

Do not implement these in Phase 1 unless required for architecture testing:

* Customer mobile app
* Online payments
* WhatsApp automation
* SMS automation
* Multi-branch
* Supplier management
* Advanced accounting
* Delivery management
* Subscription billing
* Marketplace
* AI design recognition
* AI measurement assistance
* Garment visualization
* Advanced analytics

These belong to later phases.

---

# 32. Data Model — Initial Direction

Initial entities:

```text
Business
Customer
MeasurementTemplate
MeasurementProfile
Measurement
Garment
Order
OrderItem
DesignReference
Payment
ProductionStage
Alteration
InventoryItem
InventoryTransaction
Staff
Appointment
```

The exact schema should be refined during implementation.

Relationships should be documented.

---

# 33. Important Data Rules

### Customer

A customer can have many:

* Orders
* Measurement profiles
* Payments
* Alterations

### Order

An order belongs to one customer.

An order can contain one or multiple garments/order items.

### Measurements

Measurements should be versionable/history-aware.

Do not overwrite old measurements without preserving history.

### Payments

An order can have multiple payment records.

### Designs

An order can have multiple reference images.

### Production

An order can pass through multiple production stages.

---

# 34. Error Handling

The application must handle:

* Database errors
* Invalid input
* Missing required fields
* Image failures
* Storage failures
* Unexpected exceptions

Errors should be understandable to normal users.

Do not expose technical stack traces to users.

---

# 35. Data Safety

Implement:

* Local database migrations
* Safe database writes
* Transactions for multi-step operations
* Backup/export strategy where practical
* Defensive handling of corrupted/missing files
* Confirmation before destructive actions

Do not silently lose user-entered business data.

---

# 36. Testing Requirements

Phase 1 should include tests for important business logic.

At minimum test:

### Customer

* Create
* Update
* Search
* Archive

### Measurements

* Create
* Update
* Copy
* Version/history

### Orders

* Create
* Update
* Status transition
* Due dates

### Payments

* Add payment
* Calculate balance
* Multiple payments
* Discounts

### Inventory

* Add stock
* Remove stock
* Adjust stock

### Database

* Migrations
* Relationships
* Transactions

---

# 37. Development Rules for the Agent

1. Do not build everything at once.
2. Start with Phase 1.
3. Do not add backend dependencies to Phase 1.
4. Keep the application fully functional offline.
5. Keep the data layer abstract.
6. Do not let UI code directly depend on the database implementation.
7. Use stable unique IDs.
8. Use timestamps.
9. Support soft deletion where appropriate.
10. Keep future synchronization in mind.
11. Do not prematurely implement advanced features.
12. Keep the code modular.
13. Document architectural decisions.
14. Add tests as core functionality is implemented.
15. Do not make irreversible architectural decisions without documenting them.
16. Prefer simple solutions for Phase 1.
17. Avoid unnecessary dependencies.
18. Do not create fake backend functionality.
19. Do not use mock data as a substitute for implementing real local persistence.
20. The application must remain usable if there is no network connection.

---

# 38. Phase 1 Implementation Order

Implement in approximately this order:

## Step 1

Project foundation:

* Application structure
* Navigation
* Theme/design system
* Local database
* Repository layer
* Error handling
* Logging
* Testing setup

## Step 2

Business profile.

## Step 3

Customer management.

## Step 4

Measurement templates and measurement profiles.

## Step 5

Garments.

## Step 6

Order creation and order detail.

## Step 7

Payments.

## Step 8

Production workflow.

## Step 9

Design/reference images.

## Step 10

Basic inventory.

## Step 11

Basic staff records.

## Step 12

Dashboard.

## Step 13

Search.

## Step 14

Polish:

* Empty states
* Error states
* Loading states
* Validation
* Accessibility
* Performance

## Step 15

Testing and Phase 1 stabilization.

---

# 39. Definition of Done — Phase 1

Phase 1 is complete when a user can:

1. Open the app without internet.
2. Create their business profile.
3. Create a customer.
4. Create measurement templates/profiles.
5. Record customer measurements.
6. Create an order.
7. Attach measurements to the order.
8. Attach reference images.
9. Set pricing.
10. Record an advance payment.
11. See the remaining balance.
12. Move the order through production stages.
13. Mark an order ready.
14. Mark an order delivered.
15. Record additional payments.
16. View customer history.
17. Search customers/orders.
18. Manage basic inventory.
19. View useful dashboard information.
20. Close and reopen the app without losing data.
21. Continue using the app completely offline.

---

# 40. Phase 1 Deliverables

The agent should produce:

### Application

A working mobile application implementing the Phase 1 requirements.

### Documentation

Create/update:

```text
README.md
PROJECT_REQUIREMENTS.md
ARCHITECTURE.md
DATABASE.md
PHASE_1.md
```

If the project already has documentation, update it rather than unnecessarily duplicating information.

### Architecture documentation

Document:

* Project structure
* Database choice
* Repository architecture
* State management
* Navigation
* Entity relationships
* Migration strategy
* Decisions made for future synchronization

---

# 41. Agent Starting Instructions

Start work immediately on **Phase 1**.

Before implementing major features:

1. Inspect the existing repository/project.
2. Determine the current technology stack.
3. Identify existing code and reusable components.
4. Do not replace the technology stack unless there is a strong technical reason.
5. Create/update the project requirements documentation.
6. Design the initial local database schema.
7. Design the repository/data-access abstraction.
8. Implement the application foundation.
9. Then implement Phase 1 features incrementally.
10. Test each major module before moving to the next.

If the repository is empty, create the project using an appropriate modern mobile technology after documenting the choice.

Do not implement Phase 2 backend functionality yet.

---

# 42. First Immediate Task

The first task is NOT to build every screen.

First:

```text
Inspect project
    ↓
Document architecture
    ↓
Create local data model
    ↓
Create database
    ↓
Create repository layer
    ↓
Create navigation foundation
    ↓
Create basic app shell
    ↓
Begin Customer module
```

After the foundation is working, continue through the Phase 1 implementation order.

---

# 43. Success Principle

The final Phase 1 product should feel like:

> **"A tailor can manage their customers, measurements, orders, payments, and production from one phone, even without internet."**

Phase 2 should then feel like:

> **"The same app now safely backs up and synchronizes that business data through the cloud."**

Do not sacrifice the Phase 1 user experience merely to prepare for future functionality.

Build a solid local application first, while keeping the architecture clean enough to evolve into the full cloud-based platform later.
