"use server";

import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { account, db, user } from "@openchurch/db";
import { auth } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

function avatarFrom(formData: FormData) {
  const value = String(formData.get("image") ?? "");
  if (!value) return null;
  if (!value.startsWith("data:image/jpeg;base64,") || value.length > 180000) return "invalid" as const;
  return value;
}

export async function updateProfile(orgId: string, formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/sign-in");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const image = avatarFrom(formData);
  if (!name || !email) redirect(`/churches/${orgId}/account?error=Name%20and%20email%20are%20required`);
  if (image === "invalid") redirect(`/churches/${orgId}/account?error=Use%20a%20smaller%20photo`);
  const taken = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (taken[0] && taken[0].id !== sessionUser.id) {
    redirect(`/churches/${orgId}/account?error=That%20email%20is%20already%20in%20use`);
  }
  await db
    .update(user)
    .set({ name, email, ...(image ? { image } : {}), updatedAt: new Date() })
    .where(eq(user.id, sessionUser.id));
  revalidatePath(`/churches/${orgId}/account`);
}

export async function changePassword(orgId: string, formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/sign-in");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 8) redirect(`/churches/${orgId}/account?error=Use%20at%20least%208%20characters`);
  if (next !== confirm) redirect(`/churches/${orgId}/account?error=Those%20passwords%20do%20not%20match`);
  try {
    await auth.api.verifyPassword({
      headers: await headers(),
      body: { password: current },
    });
  } catch {
    redirect(`/churches/${orgId}/account?error=Current%20password%20is%20wrong`);
  }
  const hash = await hashPassword(next);
  await db
    .update(account)
    .set({ password: hash, updatedAt: new Date() })
    .where(and(eq(account.userId, sessionUser.id), eq(account.providerId, "credential")));
  revalidatePath(`/churches/${orgId}/account`);
  redirect(`/churches/${orgId}/account?saved=password`);
}
