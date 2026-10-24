import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@openchurch/db";
import * as schema from "@openchurch/db/schema";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3493";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: [baseURL, "http://localhost:3493", "http://127.0.0.1:3493"],
});
