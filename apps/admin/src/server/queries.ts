import { asc, count, eq } from "drizzle-orm";
import { db, membership, organization, platformAdmin, user } from "@openchurch/db";

export async function isPlatformAdmin(userId: string) {
  const rows = await db.select().from(platformAdmin).where(eq(platformAdmin.userId, userId)).limit(1);
  return Boolean(rows[0]);
}

export async function adminOverview() {
  const churches = await db.select().from(organization).orderBy(asc(organization.name));
  const people = await db.select().from(user).orderBy(asc(user.name));
  const memberships = await db.select({ organizationId: membership.organizationId, userId: membership.userId }).from(membership);
  const [churchCount] = await db.select({ value: count() }).from(organization);
  const [userCount] = await db.select({ value: count() }).from(user);
  return {
    churchCount: churchCount?.value ?? 0,
    userCount: userCount?.value ?? 0,
    churches: churches.map((church) => ({
      ...church,
      members: memberships.filter((item) => item.organizationId === church.id).length,
    })),
    people: people.map((person) => ({
      ...person,
      churches: memberships.filter((item) => item.userId === person.id).length,
    })),
  };
}
