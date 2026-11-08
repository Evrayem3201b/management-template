# Field Service Management (FSM) B2B SaaS Platform

A modern, high-performance, secure multi-tenant B2B SaaS platform built specifically for field service businesses—such as plumbing, HVAC, and electrical contracting companies—to manage their teams, customers, jobs, and financial workflows.

---

## 🚀 The Vision
Local service businesses are the backbone of the economy, yet many are forced to rely on fragmented tools, spreadsheets, or bloated legacy software. This platform provides a streamlined, lightning-fast "command center" for field service business owners, managers, and technicians to run their day-to-day operations seamlessly.

---

## 👥 Core Architecture & Multi-Tenancy

The platform uses a strict multi-tenant architecture powered by a dual-layer role system to separate global platform administration from tenant-specific workspace permissions.

1. **Global Platform Layer (`user.role`)**:
   - Manages system-wide permissions (`admin` vs. standard `user`).
   - Controls platform-level features like tenant creation eligibility (`canCreateOrganization`).

2. **Organization Workspace Layer (`member.role`)**:
   - Siloes tenant data so competing plumbing/HVAC businesses operate in secure isolation.
   - Tailored roles for team members:
     - **Owner**: Full administrative control over the organization workspace and billing.
     - **Manager**: Dispatching, job creation, and team coordination.
     - **Technician**: Field execution, job updates, and cost logging.

---

## ✨ Key Features

- **Centralized CRM (`customers` table)**: Maintain detailed client directories, service addresses, phone numbers, and private property notes per organization without forcing every client to create a login account.
- **Job Dispatching & Lifecycle Engine**: Create, schedule, prioritize, and track work orders from `new` to `completed` or `cancelled`.
- **Advanced Technician Assignment**: Manage team dispatches with historical tracking and conflict prevention using robust PostgreSQL partial unique indexes (`unassignedAt IS NULL`).
- **Financial & Cost Tracking**: Handle precise financial calculations using high-precision `numeric` types for agreed pricing, job costs, and payment collections.
- **Comprehensive Audit Trails**: Automatically track who created jobs, recorded payments, or updated statuses using activity logs.

---

## 🛠️ Tech Stack

- **Framework**: TanStack Start (Full-stack React framework with SSR and server functions).
- **Authentication**: Better Auth with Organization and Admin plugins, secure cookie session management, and custom access control (`ac`).
- **Database & ORM**: PostgreSQL (hosted on Neon) managed via Drizzle ORM.
- **Styling**: Tailwind CSS.

---

## 🔒 Security & Data Isolation
Every operational table (`customers`, `jobs`, `jobAssignments`, `jobActivity`, `jobCosts`, `jobPayments`) is strictly scoped by `organizationId`, ensuring watertight data boundaries across all tenants.
