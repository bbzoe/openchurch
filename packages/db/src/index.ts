import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://openchurch:openchurch@127.0.0.1:5433/openchurch";

const client = postgres(url, {
  max: 1,
  prepare: false,
});

export const db = drizzle(client, { schema });
export * from "./schema";
