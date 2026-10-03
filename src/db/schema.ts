import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "SUPER_ADMIN",
  "DIRECTOR",
  "AGENT",
  "BROKER",
  "STAFF",
]);

export const userStatus = pgEnum("user_status", [
  "ACTIVE",
  "INVITED",
  "SUSPENDED",
]);

export const propertyType = pgEnum("property_type", [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "MAISONETTE",
  "TOWNHOUSE",
  "LAND",
  "COMMERCIAL",
  "OFFICE",
  "SHOP",
  "WAREHOUSE",
  "DEVELOPMENT_PROJECT",
]);

export const propertyPurpose = pgEnum("property_purpose", [
  "SALE",
  "RENT",
  "INVEST",
]);

export const propertyStatus = pgEnum("property_status", [
  "DRAFT",
  "ACTIVE",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
  "ARCHIVED",
]);

export const leadType = pgEnum("lead_type", ["PERSON", "PROJECT"]);

export const leadStatus = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING_SCHEDULED",
  "NEGOTIATING",
  "WON",
  "LOST",
  "SPAM",
]);

export const leadIntent = pgEnum("lead_intent", [
  "BUY",
  "RENT",
  "INVEST",
  "SELL",
]);

export const leadPriority = pgEnum("lead_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export const leadActivityType = pgEnum("lead_activity_type", [
  "CREATED",
  "NOTE",
  "STATUS_CHANGE",
  "ASSIGNMENT",
  "CALL",
  "EMAIL",
  "WHATSAPP",
]);

export const transactionStatus = pgEnum("transaction_status", [
  "SOLD",
  "RENTED",
]);

export const stallStatus = pgEnum("stall_status", [
  "AVAILABLE",
  "BLOCKED",
  "RESERVED",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: userRole("role").default("STAFF"),
  phone: text("phone"),
  status: userStatus("status").default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    propertyType: propertyType("property_type").notNull(),
    purpose: propertyPurpose("purpose").notNull(),
    price: bigint("price", { mode: "number" }).notNull(),
    buyingPrice: bigint("buying_price", { mode: "number" }),
    currency: varchar("currency", { length: 3 }).notNull().default("KES"),
    county: text("county"),
    town: text("town"),
    neighborhood: text("neighborhood"),
    address: text("address"),
    mapUrl: text("map_url"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    size: numeric("size", { mode: "number", precision: 12, scale: 2 }),
    sizeUnit: text("size_unit"),
    parking: integer("parking"),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    featured: boolean("featured").notNull().default(false),
    status: propertyStatus("status").notNull().default("DRAFT"),
    rentalExpiresAt: timestamp("rental_expires_at", { withTimezone: true }),
    agentId: text("agent_id").references(() => user.id, {
      onDelete: "set null",
    }),
    projectId: text("project_id"),
    unitId: text("unit_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("properties_slug_idx").on(table.slug),
    index("properties_status_idx").on(table.status),
    index("properties_featured_idx").on(table.featured),
    index("properties_type_idx").on(table.propertyType),
    index("properties_purpose_idx").on(table.purpose),
    index("properties_location_idx").on(table.county, table.town),
    index("properties_price_idx").on(table.price),
    index("properties_created_at_idx").on(table.createdAt),
  ],
);

export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("property_images_property_id_idx").on(table.propertyId)],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    email: text("email"),
    message: text("message"),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    propertyTitle: text("property_title"),
    type: leadType("type").notNull().default("PERSON"),
    source: text("source").notNull(),
    status: leadStatus("status").notNull().default("NEW"),
    intent: leadIntent("intent"),
    priority: leadPriority("priority").notNull().default("MEDIUM"),
    assignedAgentId: text("assigned_agent_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("leads_status_idx").on(table.status),
    index("leads_source_idx").on(table.source),
    index("leads_assigned_agent_idx").on(table.assignedAgentId),
    index("leads_created_at_idx").on(table.createdAt),
    index("leads_phone_idx").on(table.phone),
  ],
);

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    type: leadActivityType("type").notNull(),
    body: text("body"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("lead_activities_lead_id_idx").on(table.leadId),
    index("lead_activities_created_at_idx").on(table.createdAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_resource_idx").on(table.resource),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    status: transactionStatus("status").notNull(),
    buyerName: text("buyer_name").notNull(),
    buyerPhone: varchar("buyer_phone", { length: 32 }),
    buyerEmail: text("buyer_email"),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("KES"),
    transactionDate: timestamp("transaction_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    rentalExpiresAt: timestamp("rental_expires_at", { withTimezone: true }),
    notes: text("notes"),
    recordedById: text("recorded_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transactions_property_id_idx").on(table.propertyId),
    index("transactions_status_idx").on(table.status),
    index("transactions_transaction_date_idx").on(table.transactionDate),
    index("transactions_recorded_by_idx").on(table.recordedById),
  ],
);

export const towers = pgTable(
  "towers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    location: text("location"),
    description: text("description"),
    images: jsonb("images").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("towers_name_idx").on(table.name)],
);

export const floors = pgTable(
  "floors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    towerId: uuid("tower_id")
      .notNull()
      .references(() => towers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    level: integer("level"),
    description: text("description"),
    images: jsonb("images").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("floors_tower_id_idx").on(table.towerId)],
);

export const stalls = pgTable(
  "stalls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    towerId: uuid("tower_id")
      .notNull()
      .references(() => towers.id, { onDelete: "cascade" }),
    floorId: uuid("floor_id")
      .notNull()
      .references(() => floors.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name"),
    status: stallStatus("status").notNull().default("AVAILABLE"),
    price: bigint("price", { mode: "number" }),
    area: numeric("area", { mode: "number", precision: 10, scale: 2 }),
    description: text("description"),
    images: jsonb("images").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("stalls_tower_id_idx").on(table.towerId),
    index("stalls_floor_id_idx").on(table.floorId),
    index("stalls_status_idx").on(table.status),
  ],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type NewPropertyImage = typeof propertyImages.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type NewLeadActivity = typeof leadActivities.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Tower = typeof towers.$inferSelect;
export type NewTower = typeof towers.$inferInsert;
export type Floor = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;
export type Stall = typeof stalls.$inferSelect;
export type NewStall = typeof stalls.$inferInsert;
