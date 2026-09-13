import bcrypt from "bcryptjs";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/cinebook";

export async function runSeed() {
  console.log("🌱 [Agent 2 - Database Engine] Starting CineBook database seeding...");

  const isNeon = connectionString.includes("neon.tech") || connectionString.includes("sslmode=require");
  const pool = new Pool({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Seed Users (Admin & Regular Customer)
    const adminPasswordHash = await bcrypt.hash("AdminPass123!", 10);
    const userPasswordHash = await bcrypt.hash("UserPass123!", 10);

    const adminUserRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id;`,
      ["Cinema Administrator", "admin@cinebook.com", adminPasswordHash, "admin"]
    );
    const adminId = adminUserRes.rows[0].id;

    const testUserRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id;`,
      ["Alex Mercer", "user@cinebook.com", userPasswordHash, "user"]
    );
    const userId = testUserRes.rows[0].id;

    // 2. Seed Genres
    const genresList = [
      { name: "Sci-Fi", slug: "sci-fi" },
      { name: "Action", slug: "action" },
      { name: "Drama", slug: "drama" },
      { name: "Thriller", slug: "thriller" },
      { name: "Adventure", slug: "adventure" },
      { name: "Animation", slug: "animation" },
      { name: "Romance", slug: "romance" },
      { name: "Mystery", slug: "mystery" },
    ];

    const genreMap = new Map<string, string>();
    for (const g of genresList) {
      const gRes = await client.query(
        `INSERT INTO genres (name, slug)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug
         RETURNING id;`,
        [g.name, g.slug]
      );
      genreMap.set(g.slug, gRes.rows[0].id);
    }

    // 3. Seed Movies
    const moviesList = [
      {
        title: "Dune: Part Two",
        slug: "dune-part-two",
        synopsis:
          "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
        posterUrl:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        durationMinutes: 166,
        rating: "PG-13",
        language: "English",
        releaseDate: "2024-03-01",
        isFeatured: true,
        genres: ["sci-fi", "adventure", "action"],
      },
      {
        title: "Oppenheimer",
        slug: "oppenheimer",
        synopsis:
          "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, examining the moral weight of technological advancement.",
        posterUrl:
          "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
        durationMinutes: 180,
        rating: "R",
        language: "English",
        releaseDate: "2023-07-21",
        isFeatured: true,
        genres: ["drama", "thriller"],
      },
      {
        title: "Interstellar: 10th Anniversary IMAX",
        slug: "interstellar-10th-anniversary",
        synopsis:
          "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        posterUrl:
          "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        durationMinutes: 169,
        rating: "PG-13",
        language: "English",
        releaseDate: "2024-12-06",
        isFeatured: true,
        genres: ["sci-fi", "drama", "adventure"],
      },
      {
        title: "Spider-Man: Beyond the Spider-Verse",
        slug: "spider-man-beyond-the-spider-verse",
        synopsis:
          "Miles Morales is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
        posterUrl:
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
        durationMinutes: 140,
        rating: "PG",
        language: "English",
        releaseDate: "2025-05-15",
        isFeatured: false,
        genres: ["animation", "action", "adventure"],
      },
      {
        title: "The Batman: Part II",
        slug: "the-batman-part-ii",
        synopsis:
          "Batman ventures into Gotham City's underworld when a sadistic killer leaves behind a trail of cryptic clues, forcing him to forge new alliances in the shadows.",
        posterUrl:
          "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=mqqft2x_Aa4",
        durationMinutes: 175,
        rating: "PG-13",
        language: "English",
        releaseDate: "2026-10-02",
        isFeatured: true,
        genres: ["action", "mystery", "thriller"],
      },
      {
        title: "Gladiator II",
        slug: "gladiator-ii",
        synopsis:
          "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors.",
        posterUrl:
          "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=4rgYUipGJNo",
        durationMinutes: 148,
        rating: "R",
        language: "English",
        releaseDate: "2024-11-22",
        isFeatured: false,
        genres: ["action", "drama", "adventure"],
      },
      {
        title: "Cyberpunk: Neon Horizon",
        slug: "cyberpunk-neon-horizon",
        synopsis:
          "In a rain-soaked megalopolis ruled by corporate synthetic syndicates, a rogue memory-runner discovers a forbidden archive that could restore human consciousness.",
        posterUrl:
          "https://images.unsplash.com/photo-1515260268569-9271009adfdb?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=dummy",
        durationMinutes: 135,
        rating: "R",
        language: "English",
        releaseDate: "2025-08-10",
        isFeatured: false,
        genres: ["sci-fi", "action"],
      },
      {
        title: "Past Lives",
        slug: "past-lives",
        synopsis:
          "Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora's family emigrates from South Korea. Two decades later, they are reunited in New York for one fateful week.",
        posterUrl:
          "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=1000&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1800&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=kA244xewjcI",
        durationMinutes: 105,
        rating: "PG-13",
        language: "Korean / English",
        releaseDate: "2023-06-23",
        isFeatured: false,
        genres: ["romance", "drama"],
      },
    ];

    const movieMap = new Map<string, string>();
    for (const m of moviesList) {
      const mRes = await client.query(
        `INSERT INTO movies (title, slug, synopsis, poster_url, backdrop_url, trailer_url, duration_minutes, rating, language, release_date, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           synopsis = EXCLUDED.synopsis,
           poster_url = EXCLUDED.poster_url,
           backdrop_url = EXCLUDED.backdrop_url,
           is_featured = EXCLUDED.is_featured
         RETURNING id;`,
        [
          m.title,
          m.slug,
          m.synopsis,
          m.posterUrl,
          m.backdropUrl,
          m.trailerUrl,
          m.durationMinutes,
          m.rating,
          m.language,
          m.releaseDate,
          m.isFeatured,
        ]
      );
      const movieId = mRes.rows[0].id;
      movieMap.set(m.slug, movieId);

      // Link genres
      for (const gSlug of m.genres) {
        const genreId = genreMap.get(gSlug);
        if (genreId) {
          await client.query(
            `INSERT INTO movie_genres (movie_id, genre_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [movieId, genreId]
          );
        }
      }
    }

    // 4. Seed Cinemas
    const cinemasList = [
      {
        name: "Grand Horizon Cineplex - Downtown",
        slug: "grand-horizon-downtown",
        address: "742 Broadway Avenue",
        city: "New York",
        state: "NY",
        postalCode: "10003",
        phone: "+1 (212) 555-0192",
        amenities: ["IMAX Laser", "Dolby Atmos", "VIP Reclining Chairs", "Full Bistro & Bar", "In-Seat Dining"],
      },
      {
        name: "Starlight IMAX & Lounge - Uptown",
        slug: "starlight-imax-uptown",
        address: "1050 Market Street",
        city: "San Francisco",
        state: "CA",
        postalCode: "94103",
        phone: "+1 (415) 555-0144",
        amenities: ["70mm Film Projection", "IMAX Dual Laser", "Cocktail Bar", "Valet Parking"],
      },
      {
        name: "Beacon Dolby Cinema - Westside",
        slug: "beacon-dolby-westside",
        address: "2100 Ocean Boulevard",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90401",
        phone: "+1 (310) 555-0188",
        amenities: ["Dolby Cinema", "64-channel Atmos", "Heated Loungers", "Artisan Concessions"],
      },
    ];

    const cinemaMap = new Map<string, string>();
    for (const c of cinemasList) {
      const cRes = await client.query(
        `INSERT INTO cinemas (name, slug, address, city, state, postal_code, phone, amenities)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           amenities = EXCLUDED.amenities
         RETURNING id;`,
        [c.name, c.slug, c.address, c.city, c.state, c.postalCode, c.phone, JSON.stringify(c.amenities)]
      );
      cinemaMap.set(c.slug, cRes.rows[0].id);
    }

    // 5. Seed Auditoriums and Seats
    const auditoriumsList = [
      {
        cinemaSlug: "grand-horizon-downtown",
        name: "Auditorium 1 - IMAX Laser",
        screenType: "IMAX",
        rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
        cols: 12,
      },
      {
        cinemaSlug: "grand-horizon-downtown",
        name: "Auditorium 2 - Dolby Prime",
        screenType: "DOLBY",
        rows: ["A", "B", "C", "D", "E", "F"],
        cols: 10,
      },
      {
        cinemaSlug: "starlight-imax-uptown",
        name: "Screen 1 - Grand IMAX",
        screenType: "IMAX",
        rows: ["A", "B", "C", "D", "E", "F", "G"],
        cols: 12,
      },
      {
        cinemaSlug: "beacon-dolby-westside",
        name: "Cinema 1 - Dolby Atmos Luxe",
        screenType: "DOLBY",
        rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
        cols: 12,
      },
    ];

    const auditoriumMap = new Map<string, { id: string; seatIds: string[] }>();

    for (const aud of auditoriumsList) {
      const cinemaId = cinemaMap.get(aud.cinemaSlug);
      if (!cinemaId) continue;

      const totalSeats = aud.rows.length * aud.cols;
      const audRes = await client.query(
        `INSERT INTO auditoriums (cinema_id, name, screen_type, total_seats, row_count, column_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (cinema_id, name) DO UPDATE SET
           screen_type = EXCLUDED.screen_type,
           total_seats = EXCLUDED.total_seats
         RETURNING id;`,
        [cinemaId, aud.name, aud.screenType, totalSeats, aud.rows.length, aud.cols]
      );
      const audId = audRes.rows[0].id;
      const seatIds: string[] = [];

      // Generate Seats
      for (let r = 0; r < aud.rows.length; r++) {
        const row = aud.rows[r];
        for (let c = 1; c <= aud.cols; c++) {
          let seatType = "STANDARD";
          let priceMultiplier = 100;

          // Row A has wheelchair accessibility
          if (row === "A" && (c === 1 || c === 12)) {
            seatType = "ACCESSIBLE";
            priceMultiplier = 100;
          } else if (r >= 3 && r <= 5) {
            // Center rows are VIP
            seatType = "VIP";
            priceMultiplier = 125;
          } else if (r >= 6) {
            // Back rows are luxury recliners
            seatType = "RECLINER";
            priceMultiplier = 150;
          }

          const sRes = await client.query(
            `INSERT INTO seats (auditorium_id, row_label, seat_number, seat_type, price_multiplier, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (auditorium_id, row_label, seat_number) DO UPDATE SET
               seat_type = EXCLUDED.seat_type,
               price_multiplier = EXCLUDED.price_multiplier
             RETURNING id;`,
            [audId, row, c, seatType, priceMultiplier, "ACTIVE"]
          );
          seatIds.push(sRes.rows[0].id);
        }
      }

      auditoriumMap.set(aud.name, { id: audId, seatIds });
    }

    // 6. Seed Showtimes and Showtime Seats
    const baseDate = new Date();
    baseDate.setHours(12, 0, 0, 0);

    const showtimesConfig = [
      {
        movieSlug: "dune-part-two",
        auditoriumName: "Auditorium 1 - IMAX Laser",
        dayOffset: 0,
        hour: 14,
        minute: 0,
        format: "IMAX",
        basePriceCents: 1950, // $19.50
      },
      {
        movieSlug: "dune-part-two",
        auditoriumName: "Auditorium 1 - IMAX Laser",
        dayOffset: 0,
        hour: 18,
        minute: 30,
        format: "IMAX",
        basePriceCents: 2150, // $21.50 evening
      },
      {
        movieSlug: "oppenheimer",
        auditoriumName: "Auditorium 2 - Dolby Prime",
        dayOffset: 0,
        hour: 16,
        minute: 15,
        format: "DOLBY",
        basePriceCents: 1800, // $18.00
      },
      {
        movieSlug: "interstellar-10th-anniversary",
        auditoriumName: "Screen 1 - Grand IMAX",
        dayOffset: 0,
        hour: 19,
        minute: 0,
        format: "IMAX",
        basePriceCents: 2200, // $22.00
      },
      {
        movieSlug: "the-batman-part-ii",
        auditoriumName: "Cinema 1 - Dolby Atmos Luxe",
        dayOffset: 0,
        hour: 20,
        minute: 0,
        format: "DOLBY",
        basePriceCents: 1900,
      },
      // Tomorrow showtimes
      {
        movieSlug: "dune-part-two",
        auditoriumName: "Auditorium 1 - IMAX Laser",
        dayOffset: 1,
        hour: 15,
        minute: 0,
        format: "IMAX",
        basePriceCents: 1950,
      },
      {
        movieSlug: "spider-man-beyond-the-spider-verse",
        auditoriumName: "Auditorium 2 - Dolby Prime",
        dayOffset: 1,
        hour: 13,
        minute: 30,
        format: "2D",
        basePriceCents: 1550,
      },
    ];

    for (const st of showtimesConfig) {
      const movieId = movieMap.get(st.movieSlug);
      const audInfo = auditoriumMap.get(st.auditoriumName);
      if (!movieId || !audInfo) continue;

      const startTime = new Date(baseDate);
      startTime.setDate(startTime.getDate() + st.dayOffset);
      startTime.setHours(st.hour, st.minute, 0, 0);

      const endTime = new Date(startTime.getTime() + 150 * 60 * 1000);

      const stRes = await client.query(
        `INSERT INTO showtimes (movie_id, auditorium_id, start_time, end_time, format, base_price_cents, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED')
         RETURNING id;`,
        [movieId, audInfo.id, startTime.toISOString(), endTime.toISOString(), st.format, st.basePriceCents]
      );
      const showtimeId = stRes.rows[0].id;

      // Populate Showtime Seats
      for (const seatId of audInfo.seatIds) {
        await client.query(
          `INSERT INTO showtime_seats (showtime_id, seat_id, status, price_cents)
           VALUES ($1, $2, 'AVAILABLE', $3)
           ON CONFLICT (showtime_id, seat_id) DO NOTHING;`,
          [showtimeId, seatId, st.basePriceCents]
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅ [Agent 2 - Database Engine] Seeding completed successfully with rich movies, cinemas, auditoriums, seats, and showtimes!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [Agent 2 - Database Engine] Seeding failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed().catch(() => process.exit(1));
}
