import { and, asc, eq, inArray } from "drizzle-orm";
import {
  arrangement,
  block,
  blockMaterial,
  blockPerson,
  churchRole,
  db,
  event,
  membership,
  membershipCapability,
  organization,
  person,
  song,
  user,
} from "@openchurch/db";
import type { Capability, Role } from "@/server/access";

export async function listMyChurches(userId: string) {
  return db
    .select({
      membershipId: membership.id,
      role: membership.role,
      organizationId: organization.id,
      name: organization.name,
      city: organization.city,
    })
    .from(membership)
    .innerJoin(organization, eq(organization.id, membership.organizationId))
    .where(eq(membership.userId, userId))
    .orderBy(asc(organization.createdAt));
}

export async function getMembership(userId: string, organizationId: string) {
  const rows = await db
    .select()
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.organizationId, organizationId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const caps = await db
    .select({ capability: membershipCapability.capability })
    .from(membershipCapability)
    .where(eq(membershipCapability.membershipId, row.id));
  return {
    ...row,
    capabilities: caps.map((item) => item.capability) as Capability[],
    role: row.role as Role,
  };
}

export async function getChurch(organizationId: string) {
  const rows = await db.select().from(organization).where(eq(organization.id, organizationId)).limit(1);
  return rows[0] ?? null;
}

export async function listMembers(organizationId: string) {
  const rows = await db
    .select({
      membershipId: membership.id,
      role: membership.role,
      name: user.name,
      email: user.email,
    })
    .from(membership)
    .innerJoin(user, eq(user.id, membership.userId))
    .where(eq(membership.organizationId, organizationId))
    .orderBy(asc(user.name));
  const ids = rows.map((row) => row.membershipId);
  const caps = ids.length
    ? await db.select().from(membershipCapability).where(inArray(membershipCapability.membershipId, ids))
    : [];
  return rows.map((row) => ({
    ...row,
    capabilities: caps.filter((item) => item.membershipId === row.membershipId).map((item) => item.capability),
  }));
}

export async function listEvents(organizationId: string) {
  return db
    .select()
    .from(event)
    .where(eq(event.organizationId, organizationId))
    .orderBy(asc(event.startsAt));
}

export async function getEvent(eventId: string) {
  const rows = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
  return rows[0] ?? null;
}

export async function listBlocks(eventId: string) {
  const blocks = await db.select().from(block).where(eq(block.eventId, eventId)).orderBy(asc(block.position));
  const ids = blocks.map((item) => item.id);
  const materials = ids.length
    ? await db.select().from(blockMaterial).where(inArray(blockMaterial.blockId, ids)).orderBy(asc(blockMaterial.position))
    : [];
  const assigneeIds = blocks.map((item) => item.assigneeMembershipId).filter((value): value is string => Boolean(value));
  const members = assigneeIds.length
    ? await db
        .select({ id: membership.id, name: user.name })
        .from(membership)
        .innerJoin(user, eq(user.id, membership.userId))
        .where(inArray(membership.id, assigneeIds))
    : [];
  const assignments = ids.length
    ? await db
        .select({
          blockId: blockPerson.blockId,
          personId: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          roleName: churchRole.name,
        })
        .from(blockPerson)
        .innerJoin(person, eq(person.id, blockPerson.personId))
        .innerJoin(churchRole, eq(churchRole.id, person.roleId))
        .where(inArray(blockPerson.blockId, ids))
    : [];
  return blocks.map((item) => ({
    ...item,
    assigneeName: members.find((member) => member.id === item.assigneeMembershipId)?.name ?? null,
    materials: materials.filter((material) => material.blockId === item.id),
    people: assignments.filter((assignment) => assignment.blockId === item.id),
  }));
}

export async function listRoles(organizationId: string) {
  return db.select().from(churchRole).where(eq(churchRole.organizationId, organizationId)).orderBy(asc(churchRole.position));
}

export async function listPeople(organizationId: string) {
  return db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      roleId: person.roleId,
      roleName: churchRole.name,
    })
    .from(person)
    .innerJoin(churchRole, eq(churchRole.id, person.roleId))
    .where(eq(person.organizationId, organizationId))
    .orderBy(asc(person.firstName), asc(person.lastName));
}

export async function listSongs(organizationId: string) {
  const songs = await db
    .select()
    .from(song)
    .where(eq(song.organizationId, organizationId))
    .orderBy(asc(song.title));
  const songIds = songs.map((item) => item.id);
  const arrangements = songIds.length
    ? await db.select().from(arrangement).where(inArray(arrangement.songId, songIds))
    : [];
  return songs.map((item) => ({
    ...item,
    arrangement: arrangements.find((row) => row.songId === item.id) ?? null,
  }));
}

export async function getLivePayload(eventId: string) {
  const current = await getEvent(eventId);
  if (!current) return null;
  const blocks = await listBlocks(eventId);
  const live = blocks.find((item) => item.id === current.liveBlockId) ?? null;
  const songs = await listSongs(current.organizationId);
  return { event: current, blocks, live, songs };
}
