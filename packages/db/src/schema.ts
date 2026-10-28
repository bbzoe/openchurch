import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", [
  "sympathizer",
  "member",
  "ministry",
  "admin",
]);

export const capability = pgEnum("capability", ["plan", "live", "songs", "people"]);

export const eventKind = pgEnum("event_kind", ["service", "gathering"]);

export const eventStatus = pgEnum("event_status", ["draft", "scheduled", "live", "ended"]);

export const blockKind = pgEnum("block_kind", [
  "welcome",
  "worship",
  "announcement",
  "message",
  "prayer",
  "other",
]);

export const materialKind = pgEnum("material_kind", ["song", "scripture", "note"]);

export const sectionType = pgEnum("section_type", [
  "verse",
  "chorus",
  "bridge",
  "tag",
  "intro",
  "ending",
  "other",
]);

export const slideMode = pgEnum("slide_mode", ["section", "lines"]);

export const deckItemKind = pgEnum("deck_item_kind", ["slide", "group"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  countryCode: text("country_code").notNull(),
  city: text("city").notNull(),
  denominationSlug: text("denomination_slug").notNull(),
  denominationName: text("denomination_name").notNull(),
  website: text("website"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformAdmin = pgTable("platform_admin", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const membership = pgTable(
  "membership",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("membership_org_user").on(table.organizationId, table.userId)],
);

export const membershipCapability = pgTable(
  "membership_capability",
  {
    id: text("id").primaryKey(),
    membershipId: text("membership_id")
      .notNull()
      .references(() => membership.id, { onDelete: "cascade" }),
    capability: capability("capability").notNull(),
  },
  (table) => [uniqueIndex("membership_capability_unique").on(table.membershipId, table.capability)],
);

export const song = pgTable("song", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  songbookNumber: text("songbook_number"),
  defaultKey: text("default_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const songSection = pgTable(
  "song_section",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
      .notNull()
      .references(() => song.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: sectionType("type").notNull(),
    label: text("label").notNull(),
  },
  (table) => [index("song_section_song_idx").on(table.songId)],
);

export const songLine = pgTable(
  "song_line",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => songSection.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull().default(""),
    chords: jsonb("chords").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  },
  (table) => [index("song_line_section_idx").on(table.sectionId)],
);

export const arrangement = pgTable("arrangement", {
  id: text("id").primaryKey(),
  songId: text("song_id")
    .notNull()
    .references(() => song.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key"),
  position: integer("position").notNull().default(0),
  sequence: jsonb("sequence").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  slideMode: slideMode("slide_mode").notNull().default("lines"),
  linesPerSlide: integer("lines_per_slide").notNull().default(2),
  breaks: jsonb("breaks").$type<{ sectionId: string; afterLine: number }[]>().notNull().default(sql`'[]'::jsonb`),
});

export const event = pgTable("event", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  kind: eventKind("kind").notNull(),
  status: eventStatus("status").notNull().default("draft"),
  liveBlockId: text("live_block_id"),
  advance: text("advance").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const churchRole = pgTable("church_role", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
});

export const person = pgTable("person", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  image: text("image"),
  roleId: text("role_id")
    .notNull()
    .references(() => churchRole.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const block = pgTable("block", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  kind: blockKind("kind").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  durationMinutes: integer("duration_minutes"),
  leaderCount: integer("leader_count").notNull().default(1),
  assigneeMembershipId: text("assignee_membership_id").references(() => membership.id, {
    onDelete: "set null",
  }),
});

export const blockPerson = pgTable(
  "block_person",
  {
    id: text("id").primaryKey(),
    blockId: text("block_id")
      .notNull()
      .references(() => block.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [uniqueIndex("block_person_unique").on(table.blockId, table.personId)],
);

export const blockMaterial = pgTable("block_material", {
  id: text("id").primaryKey(),
  blockId: text("block_id")
    .notNull()
    .references(() => block.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  kind: materialKind("kind").notNull(),
  body: text("body").notNull().default(""),
  reference: text("reference"),
  songId: text("song_id").references(() => song.id, { onDelete: "set null" }),
  arrangementId: text("arrangement_id").references(() => arrangement.id, { onDelete: "set null" }),
});

export const deckItem = pgTable(
  "deck_item",
  {
    id: text("id").primaryKey(),
    blockId: text("block_id")
      .notNull()
      .references(() => block.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    kind: deckItemKind("kind").notNull(),
    title: text("title").notNull().default(""),
    songId: text("song_id").references(() => song.id, { onDelete: "set null" }),
    arrangementId: text("arrangement_id").references(() => arrangement.id, { onDelete: "set null" }),
  },
  (table) => [index("deck_item_block_idx").on(table.blockId)],
);

export const slide = pgTable(
  "slide",
  {
    id: text("id").primaryKey(),
    deckItemId: text("deck_item_id")
      .notNull()
      .references(() => deckItem.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label").notNull().default(""),
    sectionType: sectionType("section_type"),
    sectionId: text("section_id").notNull().default(""),
    occurrence: integer("occurrence").notNull().default(0),
    background: text("background").notNull().default("forest"),
    font: text("font").notNull().default("sans"),
    color: text("color").notNull().default(""),
    lines: jsonb("lines").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  },
  (table) => [index("slide_deck_item_idx").on(table.deckItemId)],
);
