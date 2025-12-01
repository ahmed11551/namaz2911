import { relations } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("category", [
  "general",
  "surah",
  "ayah",
  "dua",
  "azkar",
  "names99",
  "salawat",
  "kalimat",
]);

export const goalTypeEnum = pgEnum("goal_type", ["recite", "learn"]);

export const goalStatusEnum = pgEnum("goal_status", ["active", "completed", "archived"]);

export const prayerSegmentEnum = pgEnum("prayer_segment", ["fajr", "dhuhr", "asr", "maghrib", "isha", "none"]);

export const eventTypeEnum = pgEnum("event_type", [
  "tap",
  "bulk",
  "repeat",
  "learn_mark",
  "goal_completed",
  "auto_reset",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    telegramUserId: text("telegram_user_id").notNull(),
    locale: text("locale").notNull().default("en"),
    madhab: text("madhab").notNull().default("hanafi"),
    timezone: text("tz").notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    telegramUnique: index("users_telegram_user_id_idx").on(table.telegramUserId),
  }),
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: categoryEnum("category").notNull(),
    slug: text("slug").notNull(),
    title: jsonb("title_json").notNull(),
    meta: jsonb("meta_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    slugUnique: index("items_slug_idx").on(table.slug),
  }),
);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: categoryEnum("category").notNull(),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
  goalType: goalTypeEnum("goal_type").notNull(),
  targetCount: integer("target_count").notNull(),
  progress: integer("progress").notNull().default(0),
  status: goalStatusEnum("status").notNull().default("active"),
  prayerSegment: prayerSegmentEnum("prayer_segment").default("none"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [goals.itemId],
    references: [items.id],
  }),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
  prayerSegment: prayerSegmentEnum("prayer_segment").default("none"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  goal: one(goals, {
    fields: [sessions.goalId],
    references: [goals.id],
  }),
}));

export const dhikrLog = pgTable(
  "dhikr_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    category: categoryEnum("category").notNull(),
    itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
    eventType: eventTypeEnum("event_type").notNull(),
    delta: integer("delta").notNull(),
    valueAfter: integer("value_after").notNull(),
    prayerSegment: prayerSegmentEnum("prayer_segment").default("none"),
    atTs: timestamp("at_ts", { withTimezone: true }).defaultNow(),
    timezone: text("tz").notNull().default("UTC"),
    offlineId: text("offline_id"),
    suspected: boolean("suspected").notNull().default(false),
  },
  (table) => ({
    offlineIdIdx: index("dhikr_log_offline_id_idx").on(table.offlineId),
  }),
);

export const dhikrLogRelations = relations(dhikrLog, ({ one }) => ({
  user: one(users, { fields: [dhikrLog.userId], references: [users.id] }),
  goal: one(goals, { fields: [dhikrLog.goalId], references: [goals.id] }),
  session: one(sessions, { fields: [dhikrLog.sessionId], references: [sessions.id] }),
  item: one(items, { fields: [dhikrLog.itemId], references: [items.id] }),
}));

export const dailyAzkar = pgTable(
  "daily_azkar",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dateLocal: text("date_local").notNull(),
    fajr: integer("fajr").notNull().default(0),
    dhuhr: integer("dhuhr").notNull().default(0),
    asr: integer("asr").notNull().default(0),
    maghrib: integer("maghrib").notNull().default(0),
    isha: integer("isha").notNull().default(0),
    total: integer("total").notNull().default(0),
    isComplete: boolean("is_complete").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    dailyAzkarPk: primaryKey({ columns: [table.userId, table.dateLocal] }),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  goals: many(goals),
  sessions: many(sessions),
  logs: many(dhikrLog),
}));

