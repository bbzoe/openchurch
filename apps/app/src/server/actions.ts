"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
import { serviceTemplate, starterRoles } from "@/data/roles";
import { denominationBySlug, listCountries, otherDenomination } from "@/data/community";
import { getSessionUser } from "@/lib/session";
import { capabilities, hasCapability, type Role } from "@/server/access";
import { getEvent, getMembership, listBlocks } from "@/server/queries";

function id() {
  return crypto.randomUUID();
}

async function actor(organizationId: string) {
  const userSession = await getSessionUser();
  if (!userSession) redirect("/sign-in");
  const row = await getMembership(userSession.id, organizationId);
  if (!row) redirect("/churches");
  return row;
}

export async function createChurch(formData: FormData) {
  const userSession = await getSessionUser();
  if (!userSession) redirect("/sign-in");
  const name = String(formData.get("name") ?? "").trim();
  const countryCode = String(formData.get("country") ?? "").trim().toUpperCase();
  const city = String(formData.get("city") ?? "").trim();
  const slug = String(formData.get("denomination") ?? "");
  const custom = String(formData.get("denominationCustom") ?? "").trim();
  const country = listCountries().find((item) => item.code === countryCode);
  const known = slug === otherDenomination ? null : denominationBySlug(slug);
  if (!name || !city || !country) redirect("/churches?error=Name%2C%20country%2C%20and%20city%20are%20required");
  if (slug === otherDenomination && !custom) redirect("/churches?error=Name%20the%20church%20body");
  if (slug !== otherDenomination && !known) redirect("/churches?error=Choose%20a%20denomination");
  const organizationId = id();
  await db.insert(organization).values({
    id: organizationId,
    name,
    countryCode,
    city,
    denominationSlug: slug,
    denominationName: known?.name ?? custom,
  });
  await db.insert(membership).values({
    id: id(),
    organizationId,
    userId: userSession.id,
    role: "admin",
  });
  await db.insert(churchRole).values(
    starterRoles.map((name, position) => ({ id: id(), organizationId, name, position })),
  );
  redirect(`/churches/${organizationId}/setup`);
}

export async function addMember(organizationId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "people")) redirect(`/churches/${organizationId}/people?error=Not%20allowed`);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as Role;
  const found = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!found[0]) redirect(`/churches/${organizationId}/people?error=That%20person%20needs%20an%20account%20first`);
  const existing = await getMembership(found[0].id, organizationId);
  const membershipId = existing?.id ?? id();
  if (!existing) {
    await db.insert(membership).values({
      id: membershipId,
      organizationId,
      userId: found[0].id,
      role,
    });
  } else {
    await db.update(membership).set({ role }).where(eq(membership.id, membershipId));
    await db.delete(membershipCapability).where(eq(membershipCapability.membershipId, membershipId));
  }
  if (role === "ministry") {
    const picked = capabilities.filter((item) => formData.get(item) === "on");
    if (picked.length) {
      await db.insert(membershipCapability).values(
        picked.map((item) => ({ id: id(), membershipId, capability: item })),
      );
    }
  }
  revalidatePath(`/churches/${organizationId}/people`);
}

export async function createEvent(organizationId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) redirect(`/churches/${organizationId}?error=Not%20allowed`);
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const kind = String(formData.get("kind") ?? "service") === "gathering" ? "gathering" : "service";
  if (!title || !startsAt) redirect(`/churches/${organizationId}?error=Title%20and%20time%20are%20required`);
  const eventId = id();
  await db.insert(event).values({
    id: eventId,
    organizationId,
    title,
    startsAt: new Date(startsAt),
    kind,
    status: "draft",
  });
  await db.insert(block).values(
    serviceTemplate.map((item, position) => ({
      id: id(),
      eventId,
      position,
      kind: item.kind,
      title: item.title,
      durationMinutes: item.minutes,
      description: "",
    })),
  );
  redirect(`/churches/${organizationId}/events/${eventId}`);
}

export async function addBlock(organizationId: string, eventId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return;
  const current = await getEvent(eventId);
  if (!current || current.organizationId !== organizationId) return;
  const blocks = await listBlocks(eventId);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const kind = String(formData.get("kind") ?? "other") as
    | "welcome"
    | "worship"
    | "announcement"
    | "message"
    | "prayer"
    | "other";
  await db.insert(block).values({
    id: id(),
    eventId,
    position: blocks.length,
    kind,
    title,
    assigneeMembershipId: String(formData.get("assignee") ?? "") || null,
  });
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
}

export async function moveBlock(organizationId: string, eventId: string, blockId: string, direction: "up" | "down") {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return;
  const blocks = await listBlocks(eventId);
  const index = blocks.findIndex((item) => item.id === blockId);
  const swap = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swap < 0 || swap >= blocks.length) return;
  const current = blocks[index];
  const other = blocks[swap];
  await db.update(block).set({ position: other.position }).where(eq(block.id, current.id));
  await db.update(block).set({ position: current.position }).where(eq(block.id, other.id));
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
}

export async function addMaterial(organizationId: string, eventId: string, blockId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return;
  const kind = String(formData.get("kind") ?? "note");
  const existing = await db.select().from(blockMaterial).where(eq(blockMaterial.blockId, blockId));
  const position = existing.length;
  if (kind === "song") {
    const arrangementId = String(formData.get("arrangementId") ?? "");
    const songId = String(formData.get("songId") ?? "");
    if (!arrangementId || !songId) return;
    await db.insert(blockMaterial).values({
      id: id(),
      blockId,
      position,
      kind: "song",
      songId,
      arrangementId,
    });
  } else if (kind === "scripture") {
    await db.insert(blockMaterial).values({
      id: id(),
      blockId,
      position,
      kind: "scripture",
      reference: String(formData.get("reference") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
    });
  } else {
    await db.insert(blockMaterial).values({
      id: id(),
      blockId,
      position,
      kind: "note",
      body: String(formData.get("body") ?? "").trim(),
    });
  }
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
}

export async function createSong(organizationId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "songs")) redirect(`/churches/${organizationId}/songs?error=Not%20allowed`);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect(`/churches/${organizationId}/songs?error=Title%20is%20required`);
  const songId = id();
  await db.insert(song).values({ id: songId, organizationId, title });
  await db.insert(arrangement).values({
    id: id(),
    songId,
    name: String(formData.get("arrangement") ?? "Default").trim() || "Default",
    key: String(formData.get("key") ?? "").trim() || null,
    lyrics: String(formData.get("lyrics") ?? ""),
    chords: String(formData.get("chords") ?? ""),
  });
  revalidatePath(`/churches/${organizationId}/songs`);
}

export async function setLiveBlock(organizationId: string, eventId: string, blockId: string) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "live")) return;
  const current = await getEvent(eventId);
  if (!current || current.organizationId !== organizationId) return;
  await db.update(event).set({ liveBlockId: blockId, status: "live" }).where(eq(event.id, eventId));
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
  revalidatePath(`/churches/${organizationId}/events/${eventId}/live`);
}

export async function endEvent(organizationId: string, eventId: string) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "live")) return;
  await db
    .update(event)
    .set({ status: "ended", liveBlockId: null })
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
  revalidatePath(`/churches/${organizationId}/events/${eventId}/live`);
}

export async function ensureStarterRoles(organizationId: string) {
  const existing = await db.select().from(churchRole).where(eq(churchRole.organizationId, organizationId)).limit(1);
  if (existing.length) return;
  await db.insert(churchRole).values(
    starterRoles.map((name, position) => ({ id: id(), organizationId, name, position })),
  );
}

export async function addRole(organizationId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "people") && row.role !== "admin") return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const roles = await db.select().from(churchRole).where(eq(churchRole.organizationId, organizationId));
  await db.insert(churchRole).values({ id: id(), organizationId, name, position: roles.length });
  revalidatePath(`/churches/${organizationId}/setup`);
  revalidatePath(`/churches/${organizationId}/people`);
}

export async function renameRole(organizationId: string, roleId: string, formData: FormData) {
  await actor(organizationId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.update(churchRole).set({ name }).where(and(eq(churchRole.id, roleId), eq(churchRole.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/setup`);
  revalidatePath(`/churches/${organizationId}/people`);
}

export async function addPerson(organizationId: string, formData: FormData) {
  await actor(organizationId);
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleId = String(formData.get("roleId") ?? "");
  const next = String(formData.get("next") ?? "setup") === "people" ? "people" : "setup";
  if (!firstName || !lastName || !email || !roleId) {
    redirect(`/churches/${organizationId}/${next}?error=Name%2C%20email%2C%20and%20role%20are%20required`);
  }
  await db.insert(person).values({ id: id(), organizationId, firstName, lastName, email, roleId });
  revalidatePath(`/churches/${organizationId}/setup`);
  revalidatePath(`/churches/${organizationId}/people`);
}

export async function updatePersonRole(organizationId: string, personId: string, formData: FormData) {
  await actor(organizationId);
  const roleId = String(formData.get("roleId") ?? "");
  if (!roleId) return;
  await db.update(person).set({ roleId }).where(and(eq(person.id, personId), eq(person.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/people`);
  revalidatePath(`/churches/${organizationId}/setup`);
}

export async function updateSection(organizationId: string, eventId: string, blockId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const minutes = Number(formData.get("durationMinutes") ?? "");
  if (!title) return;
  await db
    .update(block)
    .set({
      title,
      description,
      durationMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null,
    })
    .where(and(eq(block.id, blockId), eq(block.eventId, eventId)));
  await db.delete(blockPerson).where(eq(blockPerson.blockId, blockId));
  const personIds = formData.getAll("personId").map(String).filter(Boolean);
  if (personIds.length) {
    await db.insert(blockPerson).values(personIds.map((personId) => ({ id: id(), blockId, personId })));
  }
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
}

export async function signOut() {
  const { auth } = await import("@/lib/auth");
  const { headers } = await import("next/headers");
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
