import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email";

const appUrl = getAppUrl();

const trustedOrigins = Array.from(
  new Set(
    [
      appUrl,
      "https://bright-light-tau.vercel.app",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:3000", "http://127.0.0.1:3000"]
        : []),
    ].filter(Boolean),
  ),
);

export const auth = betterAuth({
  baseURL: appUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins,
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [account] = await db
            .select({ status: schema.user.status })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId))
            .limit(1);

          if (account?.status === "SUSPENDED") {
            throw new APIError("FORBIDDEN", {
              message: "This account has been suspended.",
            });
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Reset your Bright Light CRM password",
        `<p>Hello ${user.name},</p><p>We received a request to reset your password.</p><p><a href="${url}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      );
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["SUPER_ADMIN", "DIRECTOR", "AGENT", "BROKER", "STAFF"],
        required: false,
        defaultValue: "STAFF",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: ["ACTIVE", "INVITED", "SUSPENDED"],
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
    },
  },
});
