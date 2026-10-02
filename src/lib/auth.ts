import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { db } from "@/db";
import * as schema from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailFrom =
  process.env.EMAIL_FROM ?? "Bright Light Homes <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Reset your Bright Light CRM password",
        `<p>Hello ${user.name},</p><p>We received a request to reset your password.</p><p><a href="${url}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      );
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Verify your email address",
        `<p>Hello ${user.name},</p><p>Please confirm your email address to activate your account.</p><p><a href="${url}">Verify your email</a></p>`,
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
