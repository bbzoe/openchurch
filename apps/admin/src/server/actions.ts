"use server";

import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { account, churchRole, db, organization, person, user } from "@openchurch/db";
import { auth } from "@/lib/auth";
import { requireOperator } from "@/server/guard";

const starterRoles = ["Pastor", "Deacon", "Worship leader", "Host", "Preacher", "Prayer"];

function id() {
  return crypto.randomUUID();
}

function back(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}

export async function createUser(formData: FormData) {
  await requireOperator();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 8) back("/users", "Name, email, and a password of at least 8 characters are required.");
  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
    });
  } catch {
    back("/users", "That email is already in use.");
  }
  revalidatePath("/users");
}

export async function updateUser(userId: string, formData: FormData) {
  const operator = await requireOperator();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email) back(`/users/${userId}`, "Name and email are required.");
  const taken = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (taken[0] && taken[0].id !== userId) back(`/users/${userId}`, "That email is already in use.");
  await db.update(user).set({ name, email, updatedAt: new Date() }).where(eq(user.id, userId));
  if (password) {
    if (password.length < 8) back(`/users/${userId}`, "A new password needs at least 8 characters.");
    const hash = await hashPassword(password);
    const existing = await db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
      .limit(1);
    if (existing[0]) {
      await db.update(account).set({ password: hash, updatedAt: new Date() }).where(eq(account.id, existing[0].id));
    } else {
      await db.insert(account).values({
        id: id(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hash,
      });
    }
  }
  if (operator.id === userId) revalidatePath("/users");
  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
}

export async function deleteUser(userId: string) {
  const operator = await requireOperator();
  if (operator.id === userId) back(`/users/${userId}`, "You cannot delete the account you are signed in with.");
  await db.delete(user).where(eq(user.id, userId));
  revalidatePath("/users");
  redirect("/users");
}

export async function createOrganization(formData: FormData) {
  await requireOperator();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const denominationName = String(formData.get("denominationName") ?? "").trim();
  if (!name || !city || countryCode.length !== 2 || !denominationName) {
    back("/organizations", "Name, city, a two-letter country code, and a denomination are required.");
  }
  const organizationId = id();
  await db.insert(organization).values({
    id: organizationId,
    name,
    city,
    countryCode,
    denominationSlug: "other",
    denominationName,
  });
  await db.insert(churchRole).values(
    starterRoles.map((roleName, position) => ({ id: id(), organizationId, name: roleName, position })),
  );
  revalidatePath("/organizations");
  redirect(`/organizations/${organizationId}`);
}

export async function updateOrganization(organizationId: string, formData: FormData) {
  await requireOperator();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const denominationName = String(formData.get("denominationName") ?? "").trim();
  if (!name || !city || countryCode.length !== 2 || !denominationName) {
    back(`/organizations/${organizationId}`, "Name, city, a two-letter country code, and a denomination are required.");
  }
  await db
    .update(organization)
    .set({ name, city, countryCode, denominationName, denominationSlug: "other" })
    .where(eq(organization.id, organizationId));
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${organizationId}`);
}

export async function deleteOrganization(organizationId: string) {
  await requireOperator();
  await db.delete(person).where(eq(person.organizationId, organizationId));
  await db.delete(organization).where(eq(organization.id, organizationId));
  revalidatePath("/organizations");
  redirect("/organizations");
}
