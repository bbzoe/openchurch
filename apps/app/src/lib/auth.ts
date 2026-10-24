import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@openchurch/db";
import * as schema from "@openchurch/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3492",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3492",
    "http://localhost:3492",
    "http://127.0.0.1:3492",
  ],
});
