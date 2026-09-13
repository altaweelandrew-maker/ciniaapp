import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/cinebook";

async function runMigration() {
  console.log("⚡ [Agent 2 - Database Engine] Starting Neon PostgreSQL migration...");
  const isNeon = connectionString.includes("neon.tech") || connectionString.includes("sslmode=require");

  const pool = new Pool({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Enable uuid-ossp or pgcrypto for gen_random_uuid
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    `);

    // 2. Movies
    await client.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        synopsis TEXT NOT NULL,
        poster_url TEXT NOT NULL,
        backdrop_url TEXT NOT NULL,
        trailer_url TEXT,
        duration_minutes INTEGER NOT NULL,
        rating TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'English',
        release_date TEXT NOT NULL,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS movies_slug_idx ON movies(slug);
      CREATE INDEX IF NOT EXISTS movies_featured_idx ON movies(is_featured);
    `);

    // 3. Genres
    await client.query(`
      CREATE TABLE IF NOT EXISTS genres (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Movie Genres
    await client.query(`
      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
        PRIMARY KEY (movie_id, genre_id)
      );
    `);

    // 5. Cinemas
    await client.query(`
      CREATE TABLE IF NOT EXISTS cinemas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        phone TEXT NOT NULL,
        amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS cinemas_city_idx ON cinemas(city);
    `);

    // 6. Auditoriums
    await client.query(`
      CREATE TABLE IF NOT EXISTS auditoriums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cinema_id UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        screen_type TEXT NOT NULL DEFAULT 'STANDARD',
        total_seats INTEGER NOT NULL,
        row_count INTEGER NOT NULL,
        column_count INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT auditoriums_cinema_id_name_unique UNIQUE (cinema_id, name)
      );
      CREATE INDEX IF NOT EXISTS auditoriums_cinema_idx ON auditoriums(cinema_id);
    `);

    // 7. Seats
    await client.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auditorium_id UUID NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
        row_label TEXT NOT NULL,
        seat_number INTEGER NOT NULL,
        seat_type TEXT NOT NULL DEFAULT 'STANDARD',
        price_multiplier INTEGER NOT NULL DEFAULT 100,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT seats_auditorium_row_number_unique UNIQUE (auditorium_id, row_label, seat_number)
      );
      CREATE INDEX IF NOT EXISTS seats_auditorium_idx ON seats(auditorium_id);
    `);

    // 8. Showtimes
    await client.query(`
      CREATE TABLE IF NOT EXISTS showtimes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        auditorium_id UUID NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        format TEXT NOT NULL DEFAULT '2D',
        base_price_cents INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'SCHEDULED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS showtimes_movie_idx ON showtimes(movie_id);
      CREATE INDEX IF NOT EXISTS showtimes_auditorium_idx ON showtimes(auditorium_id);
      CREATE INDEX IF NOT EXISTS showtimes_start_time_idx ON showtimes(start_time);
    `);

    // 9. Showtime Seats
    await client.query(`
      CREATE TABLE IF NOT EXISTS showtime_seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
        seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'AVAILABLE',
        hold_expires_at TIMESTAMPTZ,
        held_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        booking_id UUID,
        price_cents INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT showtime_seats_showtime_seat_unique UNIQUE (showtime_id, seat_id)
      );
      CREATE INDEX IF NOT EXISTS showtime_seats_showtime_status_idx ON showtime_seats(showtime_id, status);
      CREATE INDEX IF NOT EXISTS showtime_seats_hold_expires_idx ON showtime_seats(hold_expires_at);
    `);

    // 10. Bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_reference TEXT NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        total_amount_cents INTEGER NOT NULL,
        subtotal_cents INTEGER NOT NULL,
        fee_cents INTEGER NOT NULL,
        tax_cents INTEGER NOT NULL,
        hold_expires_at TIMESTAMPTZ,
        idempotency_key TEXT UNIQUE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
      CREATE INDEX IF NOT EXISTS bookings_reference_idx ON bookings(booking_reference);
      CREATE INDEX IF NOT EXISTS bookings_idempotency_idx ON bookings(idempotency_key);
    `);

    // 11. Booking Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        showtime_seat_id UUID NOT NULL REFERENCES showtime_seats(id) ON DELETE CASCADE,
        price_cents INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT booking_items_booking_seat_unique UNIQUE (booking_id, showtime_seat_id)
      );
    `);

    // 12. Payments
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        payment_intent_id TEXT UNIQUE,
        provider TEXT NOT NULL DEFAULT 'STRIPE',
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'PENDING',
        idempotency_key TEXT NOT NULL UNIQUE,
        receipt_url TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS payments_booking_idx ON payments(booking_id);
      CREATE INDEX IF NOT EXISTS payments_idempotency_idx ON payments(idempotency_key);
    `);

    // 13. Tickets
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        booking_item_id UUID NOT NULL UNIQUE REFERENCES booking_items(id) ON DELETE CASCADE,
        ticket_code TEXT NOT NULL UNIQUE,
        qr_code_data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'VALID',
        checked_in_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS tickets_code_idx ON tickets(ticket_code);
      CREATE INDEX IF NOT EXISTS tickets_booking_idx ON tickets(booking_id);
    `);

    // 14. Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        action TEXT NOT NULL,
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at);
    `);

    await client.query("COMMIT");
    console.log("✅ [Agent 2 - Database Engine] All 14 tables, constraints, and indexes migrated successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [Agent 2 - Database Engine] Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration().catch(() => process.exit(1));
}

export { runMigration };
