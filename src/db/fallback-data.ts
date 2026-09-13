// In-memory resilient data store populated with rich seed data for local preview & offline dev
// When a live Neon PostgreSQL DATABASE_URL is configured, the Postgres engine is used.

export interface SeedMovie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  durationMinutes: number;
  rating: string;
  language: string;
  releaseDate: string;
  isFeatured: boolean;
  genres: string[];
}

export const FALLBACK_MOVIES: SeedMovie[] = [
  {
    id: "m-dune-2",
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
    genres: ["Sci-Fi", "Adventure", "Action"],
  },
  {
    id: "m-oppenheimer",
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
    genres: ["Drama", "Thriller"],
  },
  {
    id: "m-interstellar",
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
    genres: ["Sci-Fi", "Drama", "Adventure"],
  },
  {
    id: "m-spiderman",
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
    genres: ["Animation", "Action", "Adventure"],
  },
  {
    id: "m-batman-2",
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
    genres: ["Action", "Mystery", "Thriller"],
  },
  {
    id: "m-gladiator-2",
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
    genres: ["Action", "Drama", "Adventure"],
  },
  {
    id: "m-cyberpunk",
    title: "Cyberpunk: Neon Horizon",
    slug: "cyberpunk-neon-horizon",
    synopsis:
      "In a rain-soaked megalopolis ruled by corporate synthetic syndicates, a rogue memory-runner discovers a forbidden archive that could restore human consciousness.",
    posterUrl:
      "https://images.unsplash.com/photo-1515260268569-9271009adfdb?q=80&w=1000&auto=format&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1800&auto=format&fit=crop",
    durationMinutes: 135,
    rating: "R",
    language: "English",
    releaseDate: "2025-08-10",
    isFeatured: false,
    genres: ["Sci-Fi", "Action"],
  },
  {
    id: "m-past-lives",
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
    genres: ["Romance", "Drama"],
  },
];

export const FALLBACK_CINEMAS = [
  {
    id: "c-horizon",
    name: "Grand Horizon Cineplex - Downtown",
    slug: "grand-horizon-downtown",
    address: "742 Broadway Avenue",
    city: "New York",
    state: "NY",
    postalCode: "10003",
    phone: "+1 (212) 555-0192",
    amenities: ["IMAX Laser", "Dolby Atmos", "VIP Reclining Chairs", "Full Bistro & Bar", "In-Seat Dining"],
    screens: [
      { id: "aud-1", name: "Auditorium 1 - IMAX Laser", screenType: "IMAX", totalSeats: 96 },
      { id: "aud-2", name: "Auditorium 2 - Dolby Prime", screenType: "DOLBY", totalSeats: 72 },
    ],
  },
  {
    id: "c-starlight",
    name: "Starlight IMAX & Lounge - Uptown",
    slug: "starlight-imax-uptown",
    address: "1050 Market Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94103",
    phone: "+1 (415) 555-0144",
    amenities: ["70mm Film Projection", "IMAX Dual Laser", "Cocktail Bar", "Valet Parking"],
    screens: [
      { id: "aud-3", name: "Screen 1 - Grand IMAX", screenType: "IMAX", totalSeats: 84 },
    ],
  },
  {
    id: "c-beacon",
    name: "Beacon Dolby Cinema - Westside",
    slug: "beacon-dolby-westside",
    address: "2100 Ocean Boulevard",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90401",
    phone: "+1 (310) 555-0188",
    amenities: ["Dolby Cinema", "64-channel Atmos", "Heated Loungers", "Artisan Concessions"],
    screens: [
      { id: "aud-4", name: "Cinema 1 - Dolby Atmos Luxe", screenType: "DOLBY", totalSeats: 96 },
    ],
  },
];

export function getFallbackShowtimes() {
  const baseDate = new Date();
  baseDate.setHours(12, 0, 0, 0);

  return [
    {
      id: "st-dune-imax-1",
      movieId: "m-dune-2",
      cinemaId: "c-horizon",
      cinemaName: "Grand Horizon Cineplex - Downtown",
      cinemaAddress: "742 Broadway Avenue",
      city: "New York",
      auditoriumId: "aud-1",
      auditoriumName: "Auditorium 1 - IMAX Laser",
      screenType: "IMAX",
      startTime: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(baseDate.getTime() + 4.5 * 60 * 60 * 1000).toISOString(),
      format: "IMAX",
      basePriceCents: 1950,
      status: "SCHEDULED",
    },
    {
      id: "st-dune-imax-2",
      movieId: "m-dune-2",
      cinemaId: "c-horizon",
      cinemaName: "Grand Horizon Cineplex - Downtown",
      cinemaAddress: "742 Broadway Avenue",
      city: "New York",
      auditoriumId: "aud-1",
      auditoriumName: "Auditorium 1 - IMAX Laser",
      screenType: "IMAX",
      startTime: new Date(baseDate.getTime() + 6.5 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(baseDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
      format: "IMAX",
      basePriceCents: 2150,
      status: "SCHEDULED",
    },
    {
      id: "st-oppenheimer-1",
      movieId: "m-oppenheimer",
      cinemaId: "c-horizon",
      cinemaName: "Grand Horizon Cineplex - Downtown",
      cinemaAddress: "742 Broadway Avenue",
      city: "New York",
      auditoriumId: "aud-2",
      auditoriumName: "Auditorium 2 - Dolby Prime",
      screenType: "DOLBY",
      startTime: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(baseDate.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      format: "DOLBY",
      basePriceCents: 1800,
      status: "SCHEDULED",
    },
    {
      id: "st-interstellar-1",
      movieId: "m-interstellar",
      cinemaId: "c-starlight",
      cinemaName: "Starlight IMAX & Lounge - Uptown",
      cinemaAddress: "1050 Market Street",
      city: "San Francisco",
      auditoriumId: "aud-3",
      auditoriumName: "Screen 1 - Grand IMAX",
      screenType: "IMAX",
      startTime: new Date(baseDate.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(baseDate.getTime() + 10 * 60 * 60 * 1000).toISOString(),
      format: "IMAX",
      basePriceCents: 2200,
      status: "SCHEDULED",
    },
    {
      id: "st-batman-1",
      movieId: "m-batman-2",
      cinemaId: "c-beacon",
      cinemaName: "Beacon Dolby Cinema - Westside",
      cinemaAddress: "2100 Ocean Boulevard",
      city: "Los Angeles",
      auditoriumId: "aud-4",
      auditoriumName: "Cinema 1 - Dolby Atmos Luxe",
      screenType: "DOLBY",
      startTime: new Date(baseDate.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(baseDate.getTime() + 11 * 60 * 60 * 1000).toISOString(),
      format: "DOLBY",
      basePriceCents: 1900,
      status: "SCHEDULED",
    },
  ];
}

export function generateSeatsForShowtime(basePriceCents: number) {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const cols = 12;
  const seats = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 1; c <= cols; c++) {
      let seatType: "STANDARD" | "VIP" | "RECLINER" | "ACCESSIBLE" = "STANDARD";
      let priceMultiplier = 100;

      if (row === "A" && (c === 1 || c === 12)) {
        seatType = "ACCESSIBLE";
        priceMultiplier = 100;
      } else if (r >= 3 && r <= 5) {
        seatType = "VIP";
        priceMultiplier = 125;
      } else if (r >= 6) {
        seatType = "RECLINER";
        priceMultiplier = 150;
      }

      // Pre-book a few sample seats for realism (e.g. D5, D6, F7)
      let status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED" = "AVAILABLE";
      if ((row === "D" && (c === 5 || c === 6)) || (row === "F" && c === 7)) {
        status = "BOOKED";
      }

      const priceCents = Math.round((basePriceCents * priceMultiplier) / 100);

      seats.push({
        id: `seat-${row}-${c}`,
        showtimeSeatId: `st-seat-${row}-${c}`,
        rowLabel: row,
        seatNumber: c,
        seatType,
        priceMultiplier,
        status,
        priceCents,
      });
    }
  }

  return { rows, seats };
}

// Global runtime stores for preview sessions
export const RUNTIME_BOOKINGS = new Map<string, any>();
export const RUNTIME_TICKETS = new Map<string, any>();
export const RUNTIME_HELD_SEATS = new Map<string, { userId: string; expiresAt: number; bookingId: string }>();
