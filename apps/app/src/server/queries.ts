import { and, asc, eq, inArray } from "drizzle-orm";
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
import { isMissingSlidesTable, slideFromRow, type Deck } from "@/lib/slides";
import {
  asBreaks,
  asStringArrayValue,
  sectionTypes,
  type SectionType,
  type SongArrangement,
  type SongDocument,
  type SongSection,
} from "@/lib/song-text";
import type { Capability, Role } from "@/server/access";

export async function listMyChurches(userId: string) {
  return db
    .select({
      membershipId: membership.id,
      role: membership.role,
      organizationId: organization.id,
      name: organization.name,
      city: organization.city,
      website: organization.website,
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

export async function listEventPlans(organizationId: string) {
  const events = await listEvents(organizationId);
  if (events.length === 0) return [];
  const ids = events.map((item) => item.id);
  const blocks = await db
    .select({
      id: block.id,
      eventId: block.eventId,
      title: block.title,
      durationMinutes: block.durationMinutes,
      description: block.description,
      position: block.position,
    })
    .from(block)
    .where(inArray(block.eventId, ids))
    .orderBy(asc(block.position));
  return events.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    startsAt: item.startsAt.toISOString(),
    blocks: blocks
      .filter((row) => row.eventId === item.id)
      .map(({ id, title, durationMinutes, description }) => ({ id, title, durationMinutes, description })),
  }));
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
          image: person.image,
        })
        .from(blockPerson)
        .innerJoin(person, eq(person.id, blockPerson.personId))
        .innerJoin(churchRole, eq(churchRole.id, person.roleId))
        .where(inArray(blockPerson.blockId, ids))
        .orderBy(asc(blockPerson.position))
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
      image: person.image,
      roleId: person.roleId,
      roleName: churchRole.name,
    })
    .from(person)
    .innerJoin(churchRole, eq(churchRole.id, person.roleId))
    .where(eq(person.organizationId, organizationId))
    .orderBy(asc(person.firstName), asc(person.lastName));
}

export type StoredSong = SongDocument & { id: string };

function asSectionType(value: string): SectionType {
  return sectionTypes.includes(value as SectionType) ? (value as SectionType) : "other";
}

function mapArrangement(row: typeof arrangement.$inferSelect): SongArrangement {
  return {
    id: row.id,
    name: row.name,
    key: row.key ?? "",
    sequence: asStringArrayValue(row.sequence),
    slideMode: row.slideMode === "section" ? "section" : "lines",
    linesPerSlide: row.linesPerSlide === 4 ? 4 : 2,
    breaks: asBreaks(row.breaks),
  };
}

export async function listSongs(organizationId: string, onlyIds?: string[]): Promise<StoredSong[]> {
  if (onlyIds && onlyIds.length === 0) return [];
  const songs = await db
    .select()
    .from(song)
    .where(
      onlyIds
        ? and(eq(song.organizationId, organizationId), inArray(song.id, onlyIds))
        : eq(song.organizationId, organizationId),
    )
    .orderBy(asc(song.title));
  const songIds = songs.map((item) => item.id);
  if (!songIds.length) return [];
  const sections = await db
    .select()
    .from(songSection)
    .where(inArray(songSection.songId, songIds))
    .orderBy(asc(songSection.position));
  const sectionIds = sections.map((item) => item.id);
  const lines = sectionIds.length
    ? await db.select().from(songLine).where(inArray(songLine.sectionId, sectionIds)).orderBy(asc(songLine.position))
    : [];
  const arrangements = await db
    .select()
    .from(arrangement)
    .where(inArray(arrangement.songId, songIds))
    .orderBy(asc(arrangement.position), asc(arrangement.name));
  return songs.map((item) => {
    const songSections: SongSection[] = sections
      .filter((section) => section.songId === item.id)
      .map((section) => ({
        id: section.id,
        type: asSectionType(section.type),
        label: section.label,
        lines: lines
          .filter((line) => line.sectionId === section.id)
          .map((line) => ({
            id: line.id,
            text: line.text,
            chords: asStringArrayValue(line.chords),
          })),
      }));
    return {
      id: item.id,
      title: item.title,
      songbookNumber: item.songbookNumber ?? "",
      defaultKey: item.defaultKey ?? "",
      sections: songSections,
      arrangements: arrangements.filter((row) => row.songId === item.id).map(mapArrangement),
    };
  });
}

export async function getSong(organizationId: string, songId: string) {
  const songs = await listSongs(organizationId, [songId]);
  return songs[0] ?? null;
}

export async function getDeck(blockId: string): Promise<Deck> {
  try {
    return await readDeck(blockId);
  } catch (error) {
    if (isMissingSlidesTable(error)) return [];
    throw error;
  }
}

async function readDeck(blockId: string): Promise<Deck> {
  const items = await db.select().from(deckItem).where(eq(deckItem.blockId, blockId)).orderBy(asc(deckItem.position));
  if (!items.length) return [];
  const rows = await db
    .select()
    .from(slide)
    .where(inArray(slide.deckItemId, items.map((item) => item.id)))
    .orderBy(asc(slide.position));
  const deck: Deck = [];
  for (const item of items) {
    const slides = rows
      .filter((row) => row.deckItemId === item.id)
      .map((row) =>
        slideFromRow({
          id: row.id,
          label: row.label,
          sectionType: row.sectionType,
          sectionId: row.sectionId,
          occurrence: row.occurrence,
          lines: Array.isArray(row.lines) ? row.lines.filter((line): line is string => typeof line === "string") : [],
          background: row.background,
          font: row.font,
          color: row.color,
        }),
      );
    if (item.kind === "slide") {
      const only = slides[0];
      if (only) deck.push({ id: item.id, kind: "slide", slide: only });
      continue;
    }
    if (slides.length) {
      deck.push({
        id: item.id,
        kind: "group",
        title: item.title,
        songId: item.songId,
        arrangementId: item.arrangementId,
        slides,
      });
    }
  }
  return deck;
}

export async function getLivePayload(eventId: string) {
  const current = await getEvent(eventId);
  if (!current) return null;
  const blocks = await listBlocks(eventId);
  const live = blocks.find((item) => item.id === current.liveBlockId) ?? null;
  const songIds = [
    ...new Set(blocks.flatMap((item) => item.materials.flatMap((material) => (material.songId ? [material.songId] : [])))),
  ];
  const songs = await listSongs(current.organizationId, songIds);
  return { event: current, blocks, live, songs };
}
