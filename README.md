# CineBook - Production-Ready Cinema Ticket-Booking Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=flat&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment-000000?style=flat&logo=vercel)](https://vercel.com/)

**CineBook** is a full-stack, production-ready cinema ticket-booking web application engineered for high-concurrency environments and prepared for zero-downtime deployment on Vercel with Neon Serverless PostgreSQL.

---

## 👥 Multi-Agent Team Architecture

The platform was built collaboratively under the **CineBook Team** structure across three specialized agent roles:

```
                          ┌──────────────────────────┐
                          │     CineBook Platform    │
                          └─────────────┬────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
┌──────────────────────┐   ┌────────────────────────┐   ┌──────────────────────┐
│  Agent 1: App Agent  │   │ Agent 2: Database Eng  │   │  Agent 3: QA Agent   │
├──────────────────────┤   ├────────────────────────┤   ├──────────────────────┤
│ • Next.js App Router │   │ • 14 Neon DB Tables    │   │ • Race Condition Test│
│ • Cinema Dark Theme  │   │ • Drizzle Migrations   │   │ • Hold Release Test  │
│ • Curved Seat Map    │   │ • 10-Step Transaction  │   │ • Minor Unit Pricing │
│ • QR Digital Tickets │   │ • Expired Hold Cron    │   │ • Webhook Idempotency│
│ • Admin Portal       │   │ • Integer Minor Units  │   │ • Access Control Test│
└──────────────────────┘   └────────────────────────┘   └──────────────────────┘
```

---

## 🌟 Key Features

- **Dynamic Interactive Seat Map**: Curved illuminated auditorium screen with color-coded availability, seat tiers (Standard, VIP Lounge, Heated Recliners, Wheelchair Accessible), and selection limit enforcement.
- **Atomic 10-Step Booking Transaction**: Prevents race conditions and double-booking using row-level locking, versioning, and temporary 10-minute seat holds.
- **Strict Integer Minor Unit Pricing**: Monetary values (subtotal, convenience fees, tax, total) are strictly processed and stored in cents—never floating point—eliminating rounding discrepancies.
- **Automated Hold Release Cron**: An idempotent server-side route (`/api/cron/release-holds`) protected by `CRON_SECRET` and scheduled via `vercel.json` to automatically release abandoned seat holds every minute.
- **Payment Provider with Idempotency**: Complete payment processing pipeline supporting test cards (`4242...`), decline simulation (`...0002`), idempotency keys, and duplicate webhook deduplication.
- **Digital Ticket Pass with QR Code**: Generates boarding-pass style cinema tickets with unique references (e.g. `CB-849201`), auditorium screen tags, and high-resolution QR codes for scanner entry.
- **Cancellation Management**: Self-service booking cancellation with automatic seat release, enforcing cancellation window policies (up to 2 hours prior to showtime).
- **Executive Admin Portal**: Overview metrics (Gross revenue in minor units, tickets sold, occupancy rate %, active showtimes), movie catalog manager, and showtime scheduler.

---

## 🗄️ Database Architecture (14 Tables)

All tables use UUID primary keys (`gen_random_uuid()`), UTC timestamps (`timestamp with time zone`), and strict foreign key cascade rules:

1. **`users`**: Customer and administrator credentials, roles, and profiles.
2. **`movies`**: Titles, synopses, posters, backdrops, trailer URLs, ratings, languages, and durations.
3. **`genres`**: Movie genres with slugs (Sci-Fi, Action, Drama, Thriller, Animation, etc.).
4. **`movie_genres`**: Composite primary key junction table.
5. **`cinemas`**: Locations, addresses, contact details, and JSONB amenities.
6. **`auditoriums`**: Cinema screens (IMAX Laser, Dolby Atmos, Standard) with `UNIQUE(cinema_id, name)`.
7. **`seats`**: Auditorium seating layout with `UNIQUE(auditorium_id, row_label, seat_number)` and multipliers.
8. **`showtimes`**: Screenings scheduled by date, format, and integer base price in cents.
9. **`showtime_seats`**: Live seat availability with `UNIQUE(showtime_id, seat_id)` ensuring **double bookings are mathematically impossible**.
10. **`bookings`**: Booking orders, references (`CB-XXXXXX`), hold expiration, subtotal, fees, tax, and total in cents.
11. **`booking_items`**: Line items linking bookings to showtime seats with `UNIQUE(booking_id, showtime_seat_id)`.
12. **`payments`**: Payment records with provider, status, receipt URLs, and `UNIQUE(idempotency_key)`.
13. **`tickets`**: Individual digital tickets with unique alphanumeric codes and QR code payloads.
14. **`audit_logs`**: System audit trail tracking seat holds, cancellations, payments, and cron cleanups.

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 1. Clone & Install
```bash
git clone <repo-url> cinebook
cd cinebook
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Neon pooled connection string for application queries |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string for running Drizzle migrations |
| `JWT_SECRET` | 32+ character secret for signing authentication sessions |
| `CRON_SECRET` | Secret bearer token protecting `/api/cron/release-holds` |
| `STRIPE_SECRET_KEY` | Stripe test mode secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for Stripe webhooks |

### 3. Database Migrations & Seeding
Generate and run migrations against your Neon PostgreSQL instance:
```bash
# Generate SQL migrations from schema
npm run db:generate

# Execute migration
npm run db:migrate

# Seed sample movies, cinemas, auditoriums, seats, showtimes, and demo accounts
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Customer** | `user@cinebook.com` | `UserPass123!` | Seat reservation, checkout, digital passes, history |
| **Administrator** | `admin@cinebook.com` | `AdminPass123!` | Full admin dashboard, metrics, movie management, audit |

---

## 🧪 QA Agent Automated Test Suite

Run the full QA test suite verifying concurrency, pricing, holds, and security:
```bash
npm test
```

### Included QA Test Modules:
1. **`tests/auth.test.ts`**: Bcrypt password verification, JWT session cookie encoding/decoding, role authorization.
2. **`tests/pricing.test.ts`**: Verifies exact integer minor unit calculations (seats, fees, taxes) with 0 floating point errors.
3. **`tests/concurrency.test.ts`**: Simulates two simultaneous asynchronous workers requesting the exact same seat at `t=0ms`. Confirms **exactly 1 booking succeeds** and the second receives a conflict rejection.
4. **`tests/seat-hold-release.test.ts`**: Simulates expired seat holds, tests cleanup endpoint, and verifies idempotency of repeat runs.
5. **`tests/payment-idempotency.test.ts`**: Verifies idempotency keys, duplicate webhook deduplication, and card decline simulations.
6. **`tests/access-control.test.ts`**: Confirms cross-user data isolation (User A cannot read or cancel User B's bookings or tickets).

---

## ☁️ Vercel Deployment Instructions

### 1. Provision Neon Serverless PostgreSQL
1. In your Vercel Dashboard, go to the **Storage** tab.
2. Click **Create Database** and choose **Neon (Serverless Postgres)** from Vercel Marketplace.
3. Select your preferred region (e.g. `us-east-1` or `us-east-2`).
4. Link the database to your CineBook project. Vercel automatically configures `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.

### 2. Configure Environment Variables in Vercel
Under **Settings > Environment Variables**, add:
- `JWT_SECRET`: Random 32+ character string.
- `CRON_SECRET`: Random alphanumeric token.
- `STRIPE_SECRET_KEY`: Stripe test key (or test simulator).
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret.

### 3. Automatic Vercel Cron
CineBook includes `vercel.json` configuring Vercel Cron to automatically invoke `/api/cron/release-holds` every minute:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-holds",
      "schedule": "* * * * *"
    }
  ]
}
```
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when invoking the endpoint.

### 4. Deploy
Push to GitHub or deploy via Vercel CLI:
```bash
vercel --prod
```
The Next.js App Router application will build and deploy instantly with global edge caching and serverless functions.
