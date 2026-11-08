
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

const createdAt = () =>
  timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const jobStatusEnum = pgEnum("job_status", [
  "new",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const jobPriorityEnum = pgEnum("job_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

//Auth schema
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  canCreateOrganization: boolean("can_create_organization").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

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
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

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

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));



// Customers belong to a single organization.
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
    userId: text("user_id")
      .references(() => user.id, { onDelete: "set null" }), // <-- Add this

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("customers_organization_idx").on(table.organizationId),
    index("customers_name_idx").on(table.organizationId, table.name),
    index("customers_phone_idx").on(table.organizationId, table.phone),
  ],
);

// Jobs are the central entity of the application.
export const jobs = pgTable(
  "jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    archivedAt: timestamp("archived_at", { withTimezone: true }),

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

// A job may have multiple technicians.
// Keep historical assignments by setting unassignedAt instead of deleting.
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

// A timeline of important events on each job.
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

// Direct costs associated with performing a job.
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

// Payments received against jobs.
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
