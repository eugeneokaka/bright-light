import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "./index";
import { account, user } from "./schema";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin";

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in the environment",
    );
  }

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Seed skipped: a user with ${email} already exists.`);
    return;
  }

  const userId = randomUUID();
  const hashedPassword = await hashPassword(password);

  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: true,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
  });

  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
  });

  console.log(`Created SUPER_ADMIN account for ${email}.`);
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
