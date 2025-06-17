import { pgTable, serial, varchar, text, boolean, timestamp, integer, numeric, json, unique } from "drizzle-orm/pg-core"

// Federations table
export const federations = pgTable("federations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 255 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  additionalPointsConditions: json("additional_points_conditions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Clubs table
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 255 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  federationId: integer("federation_id").references(() => federations.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
  bio: text("bio"),
  role: text("role").default("user").notNull(),
  // Дополнительные поля из таблицы players
  surname: varchar("surname", { length: 100 }),
  nickname: varchar("nickname", { length: 100 }),
  country: varchar("country", { length: 100 }),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: "set null" }),
  birthday: timestamp("birthday", { mode: "date" }),
  gender: varchar("gender", { length: 20 }),
  isTournamentJudge: boolean("is_tournament_judge").default(false),
  isSideJudge: boolean("is_side_judge").default(false),
  // Стандартные временные метки
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Accounts table for OAuth providers
export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 255 }),
  },
  (table) => {
    return {
      providerProviderAccountIdKey: unique().on(table.provider, table.providerAccountId),
    }
  },
)

// Sessions table for NextAuth
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires").notNull(),
})

// Verification tokens for email verification
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => {
    return {
      compoundKey: unique().on(table.identifier, table.token),
    }
  },
)

// Players table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  surname: varchar("surname", { length: 100 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  country: varchar("country", { length: 100 }),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: "set null" }),
  birthday: timestamp("birthday"),
  gender: varchar("gender", { length: 20 }),
  photoUrl: varchar("photo_url", { length: 255 }),
  isTournamentJudge: boolean("is_tournament_judge").default(false),
  isSideJudge: boolean("is_side_judge").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  gameType: varchar("game_type", { length: 50 }).notNull(),
  result: varchar("result", { length: 50 }),
  refereeId: integer("referee_id").references(() => users.id, { onDelete: "set null" }),
  refereeComments: text("referee_comments"),
  tableNumber: integer("table_number"),
  clubId: integer("club_id").references(() => clubs.id, { onDelete: "set null" }),
  federationId: integer("federation_id").references(() => federations.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Game players table
export const gamePlayers = pgTable(
  "game_players",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(),
    fouls: integer("fouls").default(0),
    additionalPoints: numeric("additional_points", { precision: 5, scale: 2 }).default("0"),
    slotNumber: integer("slot_number").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      gameSlotKey: unique().on(table.gameId, table.slotNumber),
    }
  },
)

// Game stages table
export const gameStages = pgTable("game_stages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  orderNumber: integer("order_number").notNull(),
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Social networks table
export const socialNetworks = pgTable("social_networks", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  url: varchar("url", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Game side referees table
export const gameSideReferees = pgTable(
  "game_side_referees",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      gamePlayerKey: unique().on(table.gameId, table.playerId),
    }
  },
)
