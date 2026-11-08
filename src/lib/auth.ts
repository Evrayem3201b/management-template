
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { admin } from "better-auth/plugins";

import { db } from "@/db/index";
import { ac, owner, manager, technician, admin as adminRole, user } from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost:3000"],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 } // seconds
  },

  // logger: {
  //   level: "debug",
  //   disabled: false
  // },

  user: {
    additionalFields: {
      canCreateOrganization: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      role: {
        type: "string",
        required: false,
        input: false, // Prevents security risks during sign-up
      },
    },
  },

  plugins: [

    admin({
      ac,
      roles: {
        user,
        admin: adminRole,
      },
      defaultRole: "user", // Automatically assigned to new signups
    }),

    organization({
      ac,

      roles: {
        owner,
        manager,
        technician,
      },

      // Default role assigned to users joining without an explicit role specified
      defaultRole: "technician",
      allowUserToCreateOrganization: async (user) => {
        // If the user has canCreateOrganization set to true, allow it
        if (user.canCreateOrganization === true || user.role === "admin") {
          return true
        }

        return false // Deny by default
      },
      organizationLimit: 3,
      requireEmailVerificationOnInvitation: false,
      creatorRole: "owner",
    }),
    tanstackStartCookies()
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, emailVerified: true },
        }),
      },
    },
  },
});
