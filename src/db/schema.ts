import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// 1. Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
  ]
);

// 2. Movies Table
export const movies = pgTable(
  "movies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    synopsis: text("synopsis").notNull(),
    posterUrl: text("poster_url").notNull(),
    backdropUrl: text("backdrop_url").notNull(),
    trailerUrl: text("trailer_url"),
    durationMinutes: integer("duration_minutes").notNull(),
    rating: text("rating").notNull(), // 'PG', 'PG-13', 'R', 'NC-17'
    language: text("language").default("English").notNull(),
    releaseDate: text("release_date").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("movies_slug_idx").on(table.slug),
    index("movies_featured_idx").on(table.isFeatured),
  ]
);

// 3. Genres Table
export const genres = pgTable(
  "genres",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// 4. Movie Genres Table (Junction)
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
  ]
);

// 5. Cinemas Table
export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    phone: text("phone").notNull(),
    amenities: jsonb("amenities").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("cinemas_city_idx").on(table.city),
  ]
);

// 6. Auditoriums Table (Screens)
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    screenType: text("screen_type", {
      enum: ["STANDARD", "IMAX", "DOLBY", "VIP_LOUNGE"],
    })
      .default("STANDARD")
      .notNull(),
    totalSeats: integer("total_seats").notNull(),
    rowCount: integer("row_count").notNull(),
    columnCount: integer("column_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("auditoriums_cinema_id_name_unique").on(table.cinemaId, table.name),
    index("auditoriums_cinema_idx").on(table.cinemaId),
  ]
);

// 7. Seats Table
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    rowLabel: text("row_label").notNull(), // A, B, C...
    seatNumber: integer("seat_number").notNull(), // 1, 2, 3...
    seatType: text("seat_type", {
      enum: ["STANDARD", "VIP", "RECLINER", "ACCESSIBLE"],
    })
      .default("STANDARD")
      .notNull(),
    priceMultiplier: integer("price_multiplier").default(100).notNull(), // 100 = 1.0x, 150 = 1.5x
    status: text("status", { enum: ["ACTIVE", "BLOCKED"] })
      .default("ACTIVE")
      .notNull(),
  },
  (table) => [
    unique("seats_auditorium_row_number_unique").on(
      table.auditoriumId,
      table.rowLabel,
      table.seatNumber
    ),
    index("seats_auditorium_idx").on(table.auditoriumId),
  ]
);

// 8. Showtimes Table
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    format: text("format", { enum: ["2D", "3D", "IMAX", "DOLBY"] })
      .default("2D")
      .notNull(),
    basePriceCents: integer("base_price_cents").notNull(), // e.g., 1400 = $14.00
    status: text("status", {
      enum: ["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"],
    })
      .default("SCHEDULED")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("showtimes_movie_idx").on(table.movieId),
    index("showtimes_auditorium_idx").on(table.auditoriumId),
    index("showtimes_start_time_idx").on(table.startTime),
  ]
);

// 9. Showtime Seats Table
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["AVAILABLE", "HELD", "BOOKED", "BLOCKED"],
    })
      .default("AVAILABLE")
      .notNull(),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    bookingId: uuid("booking_id"), // Soft reference to prevent circular FK constraint issues during initialization
    priceCents: integer("price_cents").notNull(), // computed price at generation
    version: integer("version").default(1).notNull(), // optimistic concurrency version
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("showtime_seats_showtime_seat_unique").on(
      table.showtimeId,
      table.seatId
    ),
    index("showtime_seats_showtime_status_idx").on(
      table.showtimeId,
      table.status
    ),
    index("showtime_seats_hold_expires_idx").on(table.holdExpiresAt),
  ]
);

// 10. Bookings Table
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingReference: text("booking_reference").notNull().unique(), // e.g. "CB-849201"
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED", "REFUNDED"],
    })
      .default("PENDING")
      .notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    feeCents: integer("fee_cents").notNull(), // e.g. 150 per ticket
    taxCents: integer("tax_cents").notNull(), // e.g. 8.25%
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key").unique(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bookings_user_idx").on(table.userId),
    index("bookings_status_idx").on(table.status),
    index("bookings_reference_idx").on(table.bookingReference),
    index("bookings_idempotency_idx").on(table.idempotencyKey),
  ]
);

// 11. Booking Items Table
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("booking_items_booking_seat_unique").on(
      table.bookingId,
      table.showtimeSeatId
    ),
  ]
);

// 12. Payments Table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    paymentIntentId: text("payment_intent_id").unique(),
    provider: text("provider", { enum: ["STRIPE", "TEST_PROVIDER"] })
      .default("STRIPE")
      .notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    status: text("status", {
      enum: ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"],
    })
      .default("PENDING")
      .notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    receiptUrl: text("receipt_url"),
    metadata: jsonb("metadata").$type<Record<string, any>>().default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payments_booking_idx").on(table.bookingId),
    index("payments_idempotency_idx").on(table.idempotencyKey),
  ]
);

// 13. Tickets Table
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    bookingItemId: uuid("booking_item_id")
      .notNull()
      .unique()
      .references(() => bookingItems.id, { onDelete: "cascade" }),
    ticketCode: text("ticket_code").notNull().unique(), // e.g. "TK-9823-XYZ"
    qrCodeData: text("qr_code_data").notNull(),
    status: text("status", {
      enum: ["VALID", "CHECKED_IN", "CANCELLED", "EXPIRED"],
    })
      .default("VALID")
      .notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tickets_code_idx").on(table.ticketCode),
    index("tickets_booking_idx").on(table.bookingId),
  ]
);

// 14. Audit Logs Table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(), // 'booking', 'payment', 'showtime_seat'
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(), // 'HOLD_SEAT', 'RELEASE_SEAT', 'CONFIRM_PAYMENT', 'CANCEL_BOOKING'
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    details: jsonb("details").$type<Record<string, any>>().default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_idx").on(table.createdAt),
  ]
);

// Relations definitions for Drizzle relational queries
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
  heldByUser: one(users, {
    fields: [showtimeSeats.heldByUserId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  bookingItems: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
  ticket: one(tickets, {
    fields: [bookingItems.id],
    references: [tickets.bookingItemId],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
  bookingItem: one(bookingItems, {
    fields: [tickets.bookingItemId],
    references: [bookingItems.id],
  }),
}));
