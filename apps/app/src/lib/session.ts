import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSessionUser() {
  const read = async () => auth.api.getSession({ headers: await headers() });
  try {
    const session = await read();
    return session?.user ?? null;
  } catch (error) {
    const message = error instanceof Error ? `${error.message} ${error.cause ?? ""}` : String(error);
    if (!/ECONNRESET|ECONNREFUSED|ETIMEDOUT|Connection terminated/i.test(message)) throw error;
    const session = await read();
    return session?.user ?? null;
  }
}
