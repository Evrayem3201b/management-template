# Field Service SaaS Database Schema Documentation

This document provides a line-by-line breakdown of the multi-tenant database schema designed for a B2B Field Service Management (FSM) SaaS platform (such as plumbing or HVAC businesses). 

The schema is built using **Drizzle ORM** and configured for **PostgreSQL** (Neon DB) alongside **Better Auth** authentication and organization plugins.

---

## 1. Imports and Utility Functions

```typescript
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  numeric,
  char,
  index,
  uniqueIndex,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
```
* **`pgEnum`, `pgTable`, `text`, etc.**: Standard column types and schema construct functions exported by Drizzle ORM for PostgreSQL.
* **`relations`**: Drizzle's relational query builder helper to define parent/child relationships between tables.
* **`sql`**: SQL template tag allowing raw SQL expressions inside Drizzle definitions (used for partial indexes).

### Timestamp Helpers
```typescript
const createdAt = () =>
  timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
```
* **`createdAt()`**: Reusable column builder that produces a timezone-aware timestamp defaulting to the current execution time (`NOW()`).
* **`updatedAt()`**: Reusable column builder that defaults to `NOW()` and updates automatically to the current date whenever the record is updated in Drizzle.

---

## 2. Global Enums

```typescript
export const jobStatusEnum = pgEnum("job_status", [
  "new",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);
```
* **`job_status`**: Enforces strict lifecycle states for a service job (`new` $\rightarrow$ `assigned` $\rightarrow$ `in_progress` $\rightarrow$ `completed` / `cancelled`).

```typescript
export const jobPriorityEnum = pgEnum("job_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);
```
* **`job_priority`**: Sets urgency levels to help dispatchers and technicians prioritize jobs.

---

## 3. Authentication & Core User Tables (Better Auth Core)

### `user` Table
Stores global user account data across the platform.

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  canCreateOrganization: boolean("can_create_organization").default(false).notNull(),
  role: text("role").default("user").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
```
* **`id`**: Unique user identifier managed by Better Auth.
* **`email`**: User email address (must be globally unique).
* **`canCreateOrganization`**: Custom permission flag determining if this global user can create new organization accounts.
* **`role`**: Platform-level global role (e.g., `"admin"`, `"user"`).

### `session` Table
Manages active web and mobile user sessions.

```typescript
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);
```
* **`token`**: Unique secret session token stored in browser cookies.
* **`userId`**: Foreign key linking session to a global `user`. Deletes session if user is deleted (`cascade`).
* **`activeOrganizationId`**: Tracks which organization workspace the user is currently interacting with.
* **`index("session_userId_idx")`**: Speeds up session queries by user ID.

### `account` Table
Stores authentication provider credentials (passwords, OAuth tokens).

```typescript
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);
```
* Handles credential logins (hashed `password`) as well as OAuth providers (Google, GitHub, etc.).

### `verification` Table
Handles email verification tokens and password reset requests.

```typescript
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
```

---

## 4. Multi-Tenant Organization Tables

### `organization` Table
Represents a tenant business (e.g., a plumbing or HVAC company).

```typescript
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});
```
* **`slug`**: URL-friendly identifier for the tenant workspace (e.g., `/app/super-plumbing`).

### `member` Table
Links platform users to organizations and assigns tenant-level roles.

```typescript
export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);
```
* **`role`**: Defines permissions within this specific organization (`"owner"`, `"manager"`, `"technician"`, `"customer"`).

### `invitation` Table
Manages pending invites sent to users to join an organization.

```typescript
export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);
```

---

## 5. Domain & Business Entities (CRM & Job Management)

### `customers` Table (CRM Entity)
Stores client data for each organization (phone-in leads, property addresses, etc.).

```typescript
export const customers = pgTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address"),
    notes: text("notes"),

    archivedAt: timestamp("archived_at", { withTimezone: true }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("customers_organization_idx").on(table.organizationId),
    index("customers_name_idx").on(table.organizationId, table.name),
    index("customers_phone_idx").on(table.organizationId, table.phone),
  ],
);
```
* **`organizationId`**: Multi-tenant key ensuring competitor companies cannot view each other's customer records.
* **`archivedAt`**: Enables soft deletes without losing past job history.
* **Compound Indexes**: Optimized for searching customers by name or phone number within a specific organization.

### `jobs` Table (Core Workflow Engine)
Represents work orders or service requests.

```typescript
export const jobs = pgTable(
  "jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),

    title: text("title").notNull(),
    description: text("description"),

    status: jobStatusEnum("status")
      .notNull()
      .default("new"),

    priority: jobPriorityEnum("priority")
      .notNull()
      .default("normal"),

    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),

    agreedPrice: numeric("agreed_price", {
      precision: 12,
      scale: 2,
    }),

    currency: char("currency", { length: 3 })
      .notNull()
      .default("EGP"),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),

    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("jobs_organization_idx").on(table.organizationId),
    index("jobs_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("jobs_customer_idx").on(table.customerId),
    index("jobs_schedule_idx").on(
      table.organizationId,
      table.scheduledAt,
    ),
  ],
);
```
* **`onDelete: "restrict"` on `customerId`**: Prevents accidental deletion of a customer record if active or historic jobs exist.
* **`numeric("agreed_price", { precision: 12, scale: 2 })`**: Prevents floating-point rounding errors on financial values.
* **`createdBy`**: Tracks the dispatcher/manager who opened the ticket.

### `jobAssignments` Table (Technician Dispatch Tracking)
Tracks technician assignments on jobs over time.

```typescript
export const jobAssignments = pgTable(
  "job_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),

    technicianId: text("technician_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    assignedBy: text("assigned_by").references(() => user.id, {
      onDelete: "set null",
    }),

    assignedAt: createdAt(),

    unassignedAt: timestamp("unassigned_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    index("job_assignments_job_idx").on(table.jobId),
    index("job_assignments_technician_idx").on(
      table.organizationId,
      table.technicianId,
    ),
    uniqueIndex("job_assignments_active_unique").on(
      table.jobId,
      table.technicianId,
    ).where(sql`${table.unassignedAt} IS NULL`),
  ],
);
```
* **`unassignedAt`**: Soft-unassign column that preserves assignment history for audit trails.
* **Partial Unique Index (`job_assignments_active_unique`)**: Ensures a technician cannot be assigned to the exact same job twice concurrently while `unassignedAt IS NULL`.

### `jobActivity` Table (Audit Trail)
Tracks a complete historical log of events that occur on a job.

```typescript
export const jobActivity = pgTable(
  "job_activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),

    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),

    type: text("type").notNull(),
    description: text("description"),
    metadata: text("metadata"),

    createdAt: createdAt(),
  },
  (table) => [
    index("job_activity_job_created_idx").on(
      table.jobId,
      table.createdAt,
    ),
    index("job_activity_organization_idx").on(table.organizationId),
  ],
);
```

### `jobCosts` Table (Expense Tracking)
Tracks operational expenses incurred during job execution (materials, parts, etc.).

```typescript
export const jobCosts = pgTable(
  "job_costs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),

    description: text("description").notNull(),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    recordedBy: text("recorded_by").references(() => user.id, {
      onDelete: "set null",
    }),

    createdAt: createdAt(),
  },
  (table) => [
    index("job_costs_job_idx").on(table.jobId),
    index("job_costs_organization_idx").on(table.organizationId),
  ],
);
```

### `jobPayments` Table (Revenue & Billing)
Records payments collected for completed or ongoing jobs.

```typescript
export const jobPayments = pgTable(
  "job_payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    method: text("method"),
    reference: text("reference"),
    notes: text("notes"),

    recordedBy: text("recorded_by").references(() => user.id, {
      onDelete: "set null",
    }),

    paidAt: timestamp("paid_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: createdAt(),
  },
  (table) => [
    index("job_payments_job_idx").on(table.jobId),
    index("job_payments_organization_idx").on(table.organizationId),
  ],
);
```

---

## 6. Summary of Drizzle Relationships Defined

* **User**: Has many `sessions`, `accounts`, `members`, and `invitations`.
* **Organization**: Has many `members` and `invitations`.
* **Member**: Belongs to one `organization` and one `user`.
* **Session / Account / Invitation**: Belong to one parent `user` or `organization`.