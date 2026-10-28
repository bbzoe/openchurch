"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  arrangement,
  block,
  blockMaterial,
  blockPerson,
  churchRole,
  db,
  deckItem,
  event,
  membership,
  membershipCapability,
  organization,
  person,
  slide,
  song,
  songLine,
  songSection,
  user,
} from "@openchurch/db";
import { isMissingSlidesTable, prepareDeck, type Deck } from "@/lib/slides";
import { prepareSong, type SongDocument } from "@/lib/song-text";
import { serviceTemplate, starterRoles } from "@/data/roles";
import { denominationBySlug, listCountries, otherDenomination } from "@/data/community";
import { getSessionUser } from "@/lib/session";
import { parseSlotNotes, writeSlotNotes } from "@/lib/slot-notes";
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
  if (!name || !city || !country) redirect("/churches/new?error=Name%2C%20country%2C%20and%20city%20are%20required");
  if (slug === otherDenomination && !custom) redirect("/churches/new?error=Name%20the%20church%20body");
  if (slug !== otherDenomination && !known) redirect("/churches/new?error=Choose%20a%20denomination");
  const website = normalizeWebsite(String(formData.get("website") ?? ""));
  const organizationId = id();
  await db.insert(organization).values({
    id: organizationId,
    name,
    countryCode,
    city,
    denominationSlug: slug,
    denominationName: known?.name ?? custom,
    website,
  });
  await db.insert(membership).values({
    id: id(),
    organizationId,
    userId: userSession.id,
    role: "admin",
  });
  const roleRows = starterRoles.map((roleName, position) => ({ id: id(), organizationId, name: roleName, position }));
  await db.insert(churchRole).values(roleRows);
  const names = splitName(userSession.name);
  await db.insert(person).values({
    id: id(),
    organizationId,
    firstName: names.firstName,
    lastName: names.lastName,
    email: userSession.email.trim().toLowerCase() || null,
    image: userSession.image ?? null,
    roleId: roleRows[0].id,
  });
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

const blockKinds = ["welcome", "worship", "announcement", "message", "prayer", "other"] as const;

export async function addBlock(organizationId: string, eventId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return null;
  const current = await getEvent(eventId);
  if (!current || current.organizationId !== organizationId) return null;
  const blocks = await listBlocks(eventId);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return null;
  const rawKind = String(formData.get("kind") ?? "other");
  const kind = blockKinds.includes(rawKind as (typeof blockKinds)[number])
    ? (rawKind as (typeof blockKinds)[number])
    : "other";
  const minutes = Number(formData.get("durationMinutes") ?? "");
  const blockId = id();
  await db.insert(block).values({
    id: blockId,
    eventId,
    position: blocks.length,
    kind,
    title,
    description: String(formData.get("description") ?? ""),
    durationMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null,
    assigneeMembershipId: String(formData.get("assignee") ?? "") || null,
  });
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
  return { id: blockId };
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

export async function reorderBlocks(organizationId: string, eventId: string, orderedIds: string[]) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return;
  const current = await getEvent(eventId);
  if (!current || current.organizationId !== organizationId) return;
  const blocks = await listBlocks(eventId);
  const known = new Set(blocks.map((item) => item.id));
  if (orderedIds.length !== blocks.length || orderedIds.some((item) => !known.has(item))) return;
  await db.transaction(async (tx) => {
    for (const [position, blockId] of orderedIds.entries()) {
      await tx.update(block).set({ position }).where(and(eq(block.id, blockId), eq(block.eventId, eventId)));
    }
  });
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
}

export async function removeBlock(organizationId: string, eventId: string, blockId: string) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return;
  const current = await getEvent(eventId);
  if (!current || current.organizationId !== organizationId) return;
  await db.delete(block).where(and(eq(block.id, blockId), eq(block.eventId, eventId)));
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

export async function saveSong(
  organizationId: string,
  songId: string | null,
  payload: SongDocument,
): Promise<{ id: string } | { error: string }> {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "songs")) return { error: "Not allowed" };
  const prepared = prepareSong(payload);
  if ("error" in prepared) return prepared;
  const document = prepared.song;
  const idValue = songId ?? id();
  try {
    await db.transaction(async (tx) => {
      if (songId) {
        const existing = await tx
          .select({ id: song.id })
          .from(song)
          .where(and(eq(song.id, songId), eq(song.organizationId, organizationId)))
          .limit(1);
        if (!existing[0]) throw new Error("missing");
        await tx
          .update(song)
          .set({
            title: document.title,
            songbookNumber: document.songbookNumber || null,
            defaultKey: document.defaultKey || null,
          })
          .where(eq(song.id, songId));
      } else {
        await tx.insert(song).values({
          id: idValue,
          organizationId,
          title: document.title,
          songbookNumber: document.songbookNumber || null,
          defaultKey: document.defaultKey || null,
        });
      }
      await tx.delete(songSection).where(eq(songSection.songId, idValue));
      if (document.sections.length) {
        await tx.insert(songSection).values(
          document.sections.map((section, position) => ({
            id: section.id,
            songId: idValue,
            position,
            type: section.type,
            label: section.label,
          })),
        );
        const lines = document.sections.flatMap((section) =>
          section.lines.map((line, position) => ({
            id: line.id,
            sectionId: section.id,
            position,
            text: line.text,
            chords: line.chords,
          })),
        );
        if (lines.length) await tx.insert(songLine).values(lines);
      }
      const current = await tx.select({ id: arrangement.id }).from(arrangement).where(eq(arrangement.songId, idValue));
      const keep = new Set(document.arrangements.map((item) => item.id));
      const remove = current.map((item) => item.id).filter((item) => !keep.has(item));
      if (remove.length) await tx.delete(arrangement).where(inArray(arrangement.id, remove));
      for (const [position, item] of document.arrangements.entries()) {
        const values = {
          name: item.name,
          key: item.key || null,
          position,
          sequence: item.sequence,
          slideMode: item.slideMode,
          linesPerSlide: item.linesPerSlide,
          breaks: item.breaks,
        };
        if (current.some((existing) => existing.id === item.id)) {
          await tx.update(arrangement).set(values).where(eq(arrangement.id, item.id));
        } else {
          await tx.insert(arrangement).values({ id: item.id, songId: idValue, ...values });
        }
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "missing") return { error: "Song not found" };
    throw error;
  }
  revalidatePath(`/churches/${organizationId}/songs`);
  revalidatePath(`/churches/${organizationId}/songs/${idValue}`);
  return { id: idValue };
}

export async function updateEventStart(organizationId: string, eventId: string, startsAtIso: string) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return;
  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return;
  await db
    .update(event)
    .set({ startsAt })
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
  revalidatePath(`/churches/${organizationId}/events/${eventId}/live`);
}

export async function setAdvance(organizationId: string, eventId: string, mode: "manual" | "auto") {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "live") && !hasCapability(row.role, row.capabilities, "plan")) return;
  await db
    .update(event)
    .set({ advance: mode })
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
  revalidatePath(`/churches/${organizationId}/events/${eventId}/live`);
}

export async function startEvent(organizationId: string, eventId: string) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "live")) return;
  const current = await getEvent(eventId);
  if (!current || current.organizationId !== organizationId) return;
  const blocks = await listBlocks(eventId);
  const first = blocks.find((item) => item.description !== "openchurch:break") ?? blocks[0];
  await db
    .update(event)
    .set({ status: "live", liveBlockId: current.liveBlockId ?? first?.id ?? null })
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
  revalidatePath(`/churches/${organizationId}/events/${eventId}/live`);
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

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function updateChurchWebsite(organizationId: string, formData: FormData) {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan") && row.role !== "admin") {
    redirect(`/churches/${organizationId}/settings`);
  }
  const raw = String(formData.get("website") ?? "").trim();
  const website = raw ? normalizeWebsite(raw) : null;
  if (raw && !website) redirect(`/churches/${organizationId}/settings?error=Enter%20a%20valid%20website`);
  await db
    .update(organization)
    .set({ website })
    .where(eq(organization.id, organizationId));
  revalidatePath(`/churches/${organizationId}/settings`);
  revalidatePath(`/churches/${organizationId}`);
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
  revalidatePath(`/churches/${organizationId}/settings`);
}

export async function renameRole(organizationId: string, roleId: string, formData: FormData) {
  await actor(organizationId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.update(churchRole).set({ name }).where(and(eq(churchRole.id, roleId), eq(churchRole.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/setup`);
  revalidatePath(`/churches/${organizationId}/people`);
  revalidatePath(`/churches/${organizationId}/settings`);
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Member", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function ensureSelfAsPerson(organizationId: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return;
  const member = await getMembership(sessionUser.id, organizationId);
  if (!member) return;
  const email = sessionUser.email.trim().toLowerCase();
  if (email) {
    const existing = await db
      .select({ id: person.id })
      .from(person)
      .where(and(eq(person.organizationId, organizationId), eq(person.email, email)))
      .limit(1);
    if (existing[0]) return;
  }
  const roles = await db
    .select()
    .from(churchRole)
    .where(eq(churchRole.organizationId, organizationId))
    .orderBy(asc(churchRole.position));
  const role = roles.find((item) => item.name === "Pastor") ?? roles[0];
  if (!role) return;
  const names = splitName(sessionUser.name);
  await db.insert(person).values({
    id: id(),
    organizationId,
    firstName: names.firstName,
    lastName: names.lastName,
    email: email || null,
    image: sessionUser.image ?? null,
    roleId: role.id,
  });
}

function namesFromEmail(email: string) {
  const local = email.split("@")[0]?.replace(/[._+-]+/g, " ").trim() ?? "";
  const parts = local.split(/\s+/).filter(Boolean);
  const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  if (parts.length === 0) return { firstName: email, lastName: "" };
  if (parts.length === 1) return { firstName: label(parts[0]), lastName: "" };
  return { firstName: label(parts[0]), lastName: parts.slice(1).map(label).join(" ") };
}

function emailsFromList(raw: string) {
  const found = raw
    .split(/[\s,;]+/)
    .map((item) => item.trim().toLowerCase().replace(/^<|>$/g, ""))
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  return [...new Set(found)];
}

export async function addPeopleFromList(organizationId: string, formData: FormData) {
  await actor(organizationId);
  const next = String(formData.get("next") ?? "setup") === "people" ? "people" : "setup";
  const roleId = String(formData.get("roleId") ?? "");
  const emails = emailsFromList(String(formData.get("emails") ?? ""));
  if (!roleId || emails.length === 0) {
    redirect(`/churches/${organizationId}/${next}?error=Paste%20at%20least%20one%20email`);
  }
  const existing = await db.select({ email: person.email }).from(person).where(eq(person.organizationId, organizationId));
  const known = new Set(existing.map((item) => item.email?.toLowerCase()).filter((item): item is string => Boolean(item)));
  const fresh = emails.filter((email) => !known.has(email));
  if (fresh.length) {
    await db.insert(person).values(
      fresh.map((email) => {
        const names = namesFromEmail(email);
        return { id: id(), organizationId, email, roleId, ...names };
      }),
    );
  }
  revalidatePath(`/churches/${organizationId}/setup`);
  revalidatePath(`/churches/${organizationId}/people`);
  revalidatePath(`/churches/${organizationId}/settings`);
}

export async function addPerson(organizationId: string, formData: FormData) {
  await actor(organizationId);
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleId = String(formData.get("roleId") ?? "");
  const image = String(formData.get("image") ?? "");
  const next = String(formData.get("next") ?? "setup") === "people" ? "people" : "setup";
  if (!firstName || !lastName || !roleId) {
    redirect(`/churches/${organizationId}/${next}?error=Name%20and%20role%20are%20required`);
  }
  if (image.length > 180000) {
    redirect(`/churches/${organizationId}/${next}?error=That%20photo%20is%20too%20large`);
  }
  await db.insert(person).values({
    id: id(),
    organizationId,
    firstName,
    lastName,
    email: email || null,
    image: image || null,
    roleId,
  });
  revalidatePath(`/churches/${organizationId}/setup`);
  revalidatePath(`/churches/${organizationId}/people`);
  revalidatePath(`/churches/${organizationId}/settings`);
}

export async function updatePerson(organizationId: string, personId: string, formData: FormData) {
  await actor(organizationId);
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleId = String(formData.get("roleId") ?? "");
  const image = String(formData.get("image") ?? "");
  if (!firstName || !lastName || !roleId) return;
  if (image.length > 180000) return;
  await db
    .update(person)
    .set({
      firstName,
      lastName,
      email: email || null,
      image: image || null,
      roleId,
    })
    .where(and(eq(person.id, personId), eq(person.organizationId, organizationId)));
  revalidatePath(`/churches/${organizationId}/people`);
  revalidatePath(`/churches/${organizationId}/setup`);
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
  const parsed = parseSlotNotes(String(formData.get("description") ?? ""));
  const description = parsed.break ? parsed.notes : writeSlotNotes(parsed.notes, parsed.color);
  const minutes = Number(formData.get("durationMinutes") ?? "");
  const leaders = Number(formData.get("leaderCount") ?? "1");
  if (!title) return;
  await db
    .update(block)
    .set({
      title,
      description,
      durationMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null,
      leaderCount: Number.isFinite(leaders) ? Math.max(0, Math.round(leaders)) : 1,
    })
    .where(and(eq(block.id, blockId), eq(block.eventId, eventId)));
  await db.delete(blockPerson).where(eq(blockPerson.blockId, blockId));
  const personIds = formData.getAll("personId").map(String).filter(Boolean);
  if (personIds.length) {
    await db.insert(blockPerson).values(personIds.map((personId, position) => ({ id: id(), blockId, personId, position })));
  }
  revalidatePath(`/churches/${organizationId}`);
  revalidatePath(`/churches/${organizationId}/events/${eventId}`);
}

export async function saveDeck(
  organizationId: string,
  eventId: string,
  blockId: string,
  payload: Deck,
): Promise<{ ok: true } | { error: string }> {
  const row = await actor(organizationId);
  if (!hasCapability(row.role, row.capabilities, "plan")) return { error: "Not allowed" };
  const prepared = prepareDeck(payload);
  if ("error" in prepared) return prepared;
  const owned = await db
    .select({ id: block.id })
    .from(block)
    .innerJoin(event, eq(event.id, block.eventId))
    .where(and(eq(block.id, blockId), eq(event.id, eventId), eq(event.organizationId, organizationId)))
    .limit(1);
  if (!owned[0]) return { error: "Could not save these slides" };
  try {
    await db.transaction(async (tx) => {
      await tx.delete(deckItem).where(eq(deckItem.blockId, blockId));
      for (const [position, item] of prepared.deck.entries()) {
        if (item.kind === "slide") {
          await tx.insert(deckItem).values({
            id: item.id,
            blockId,
            position,
            kind: "slide",
            title: item.slide.label || "Slide",
          });
          await tx.insert(slide).values({
            id: item.slide.id,
            deckItemId: item.id,
            position: 0,
            label: item.slide.label,
            sectionType: item.slide.sectionType,
            sectionId: item.slide.sectionId,
            occurrence: item.slide.occurrence,
            background: item.slide.backgroundId,
            font: item.slide.fontId,
            color: item.slide.color,
            lines: item.slide.lines,
          });
          continue;
        }
        await tx.insert(deckItem).values({
          id: item.id,
          blockId,
          position,
          kind: "group",
          title: item.title,
          songId: item.songId,
          arrangementId: item.arrangementId,
        });
        await tx.insert(slide).values(
          item.slides.map((row, slidePosition) => ({
            id: row.id,
            deckItemId: item.id,
            position: slidePosition,
            label: row.label,
            sectionType: row.sectionType,
            sectionId: row.sectionId,
            occurrence: row.occurrence,
            background: row.backgroundId,
            font: row.fontId,
            color: row.color,
            lines: row.lines,
          })),
        );
      }
    });
  } catch (error) {
    if (isMissingSlidesTable(error)) return { error: "Slides are not in the database yet" };
    return { error: "Could not save these slides" };
  }
  revalidatePath(`/churches/${organizationId}/events/${eventId}/live`);
  return { ok: true };
}

export async function signOut() {
  const { auth } = await import("@/lib/auth");
  const { headers } = await import("next/headers");
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
