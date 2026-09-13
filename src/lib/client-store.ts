// Client-side data store for GitHub Pages and offline client execution
import QRCode from "qrcode";
import {
  FALLBACK_MOVIES,
  FALLBACK_CINEMAS,
  getFallbackShowtimes,
  generateSeatsForShowtime,
  SeedMovie,
} from "@/db/fallback-data";
import { BOOKING_FEE_CENTS_PER_SEAT, TAX_RATE } from "./constants";

export interface StoredBooking {
  id: string;
  bookingReference: string;
  userId: string;
  showtimeId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  totalAmountCents: number;
  subtotalCents: number;
  feeCents: number;
  taxCents: number;
  holdExpiresAt: string;
  movie: {
    title: string;
    posterUrl: string;
    rating: string;
    durationMinutes: number;
  };
  showtime: {
    id: string;
    startTime: string;
    format: string;
  };
  cinema: {
    name: string;
    auditoriumName: string;
  };
  auditorium: {
    name: string;
    screenType: string;
  };
  seats: string[];
  items: Array<{
    id: string;
    seatLabel: string;
    seatType: string;
    priceCents: number;
  }>;
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: string;
  }>;
  createdAt: string;
}

export interface StoredTicket {
  id: string;
  ticketCode: string;
  status: string;
  qrCodeDataUrl: string;
  bookingReference: string;
  movie: {
    title: string;
    posterUrl: string;
    rating: string;
    durationMinutes: number;
  };
  cinema: {
    name: string;
    address: string;
  };
  auditorium: {
    name: string;
    screenType: string;
  };
  seat: {
    label: string;
    type: string;
  };
  showtime: {
    startTime: string;
    format: string;
  };
  priceCents: number;
  issuedAt: string;
}

const STORAGE_KEY_BOOKINGS = "cinebook_bookings";
const STORAGE_KEY_TICKETS = "cinebook_tickets";
const STORAGE_KEY_USER = "cinebook_active_user";

// In-memory runtime cache for SSR/client sync
const memBookings = new Map<string, StoredBooking>();
const memTickets = new Map<string, StoredTicket>();

function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const ClientStore = {
  // 1. Movies & Catalog
  getMovies(search?: string, genreSlug?: string) {
    let list = [...FALLBACK_MOVIES];
    if (search) {
      list = list.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (genreSlug && genreSlug !== "all") {
      list = list.filter((m) =>
        m.genres.some((g) => g.toLowerCase() === genreSlug.toLowerCase())
      );
    }
    return list;
  },

  getMovieById(id: string) {
    const movie =
      FALLBACK_MOVIES.find((m) => m.id === id || m.slug === id) || FALLBACK_MOVIES[0];

    const showtimes = getFallbackShowtimes()
      .filter((st) => st.movieId === movie.id || movie.id === "m-dune-2")
      .map((st) => ({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        format: st.format,
        basePriceCents: st.basePriceCents,
        status: st.status,
        auditorium: {
          id: st.auditoriumId,
          name: st.auditoriumName,
          screenType: st.screenType,
          totalSeats: 96,
        },
        cinema: {
          id: st.cinemaId,
          name: st.cinemaName,
          address: st.cinemaAddress,
          city: st.city,
        },
      }));

    return { ...movie, showtimes };
  },

  // 2. Cinemas
  getCinemas() {
    return FALLBACK_CINEMAS;
  },

  // 3. Showtimes & Seats
  getShowtimeSeats(showtimeId: string) {
    const st = getFallbackShowtimes().find((s) => s.id === showtimeId) || getFallbackShowtimes()[0];
    const movie = FALLBACK_MOVIES.find((m) => m.id === st.movieId) || FALLBACK_MOVIES[0];
    const { rows, seats } = generateSeatsForShowtime(st.basePriceCents);

    return {
      showtime: {
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        format: st.format,
        basePriceCents: st.basePriceCents,
      },
      movie: {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        rating: movie.rating,
        durationMinutes: movie.durationMinutes,
      },
      cinema: {
        id: st.cinemaId,
        name: st.cinemaName,
      },
      auditorium: {
        id: st.auditoriumId,
        name: st.auditoriumName,
        screenType: st.screenType,
        rowCount: rows.length,
        columnCount: 12,
        rowLabels: rows,
      },
      seats,
    };
  },

  // 4. Bookings & Reservations
  createBooking(showtimeId: string, seatIds: string[]) {
    const st = getFallbackShowtimes().find((s) => s.id === showtimeId) || getFallbackShowtimes()[0];
    const movie = FALLBACK_MOVIES.find((m) => m.id === st.movieId) || FALLBACK_MOVIES[0];

    const subtotalCents = seatIds.length * st.basePriceCents;
    const feeCents = seatIds.length * BOOKING_FEE_CENTS_PER_SEAT;
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const totalAmountCents = subtotalCents + feeCents + taxCents;

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let bookingRef = "CB-";
    for (let i = 0; i < 6; i++) bookingRef += chars.charAt(Math.floor(Math.random() * chars.length));

    const bookingId = `bk_${Date.now()}`;
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const newBooking: StoredBooking = {
      id: bookingId,
      bookingReference: bookingRef,
      userId: "user-local-session",
      showtimeId: st.id,
      status: "PENDING",
      subtotalCents,
      feeCents,
      taxCents,
      totalAmountCents,
      holdExpiresAt,
      seats: seatIds.map((s) => s.replace("seat-", "")),
      items: seatIds.map((s) => ({
        id: `item-${s}`,
        seatLabel: s.replace("seat-", ""),
        seatType: "STANDARD",
        priceCents: st.basePriceCents,
      })),
      movie: {
        title: movie.title,
        posterUrl: movie.posterUrl,
        rating: movie.rating,
        durationMinutes: movie.durationMinutes,
      },
      showtime: {
        id: st.id,
        startTime: st.startTime,
        format: st.format,
      },
      cinema: {
        name: st.cinemaName,
        auditoriumName: st.auditoriumName,
      },
      auditorium: {
        name: st.auditoriumName,
        screenType: st.screenType,
      },
      tickets: [],
      createdAt: new Date().toISOString(),
    };

    memBookings.set(bookingId, newBooking);
    const existing = getLocalStorage<StoredBooking[]>(STORAGE_KEY_BOOKINGS, []);
    setLocalStorage(STORAGE_KEY_BOOKINGS, [newBooking, ...existing]);

    return newBooking;
  },

  getBooking(id: string): StoredBooking | null {
    if (memBookings.has(id)) return memBookings.get(id)!;
    const list = getLocalStorage<StoredBooking[]>(STORAGE_KEY_BOOKINGS, []);
    return list.find((b) => b.id === id) || list[0] || null;
  },

  getBookings(): StoredBooking[] {
    const list = getLocalStorage<StoredBooking[]>(STORAGE_KEY_BOOKINGS, []);
    return list.length > 0 ? list : Array.from(memBookings.values());
  },

  // 5. Payment & Ticket Minting
  async confirmPayment(bookingId: string) {
    let booking = this.getBooking(bookingId);
    if (!booking) {
      booking = this.createBooking("st-dune-imax-1", ["seat-E-6", "seat-E-7"]);
    }

    booking.status = "CONFIRMED";
    const ticketId = `tkt_${Date.now()}`;
    const ticketCode = `TK-${booking.bookingReference.replace("CB-", "")}-01`;

    const qrDataUrl = await QRCode.toDataURL(
      JSON.stringify({
        ticketCode,
        ref: booking.bookingReference,
        seats: booking.seats.join(","),
        movie: booking.movie.title,
      }),
      { width: 320, margin: 2, color: { dark: "#0F111A", light: "#FFFFFF" } }
    );

    const ticket: StoredTicket = {
      id: ticketId,
      ticketCode,
      status: "VALID",
      qrCodeDataUrl: qrDataUrl,
      bookingReference: booking.bookingReference,
      movie: booking.movie,
      cinema: {
        name: booking.cinema.name,
        address: "742 Broadway Avenue, New York, NY",
      },
      auditorium: booking.auditorium,
      seat: {
        label: booking.seats[0] || "E6",
        type: "STANDARD",
      },
      showtime: booking.showtime,
      priceCents: booking.totalAmountCents,
      issuedAt: new Date().toISOString(),
    };

    memTickets.set(ticketId, ticket);
    const existingTickets = getLocalStorage<StoredTicket[]>(STORAGE_KEY_TICKETS, []);
    setLocalStorage(STORAGE_KEY_TICKETS, [ticket, ...existingTickets]);

    booking.tickets = [{ id: ticketId, ticketCode, status: "VALID" }];
    memBookings.set(booking.id, booking);

    const allBookings = getLocalStorage<StoredBooking[]>(STORAGE_KEY_BOOKINGS, []);
    const updated = allBookings.map((b) => (b.id === booking!.id ? booking! : b));
    setLocalStorage(STORAGE_KEY_BOOKINGS, updated);

    return { booking, ticket };
  },

  getTicket(id: string): StoredTicket | null {
    if (memTickets.has(id)) return memTickets.get(id)!;
    const list = getLocalStorage<StoredTicket[]>(STORAGE_KEY_TICKETS, []);
    return list.find((t) => t.id === id) || list[0] || null;
  },

  // 6. Cancellation
  cancelBooking(id: string): boolean {
    const booking = this.getBooking(id);
    if (!booking) return false;
    booking.status = "CANCELLED";
    memBookings.set(id, booking);

    const allBookings = getLocalStorage<StoredBooking[]>(STORAGE_KEY_BOOKINGS, []);
    const updated = allBookings.map((b) => (b.id === id ? { ...b, status: "CANCELLED" as const } : b));
    setLocalStorage(STORAGE_KEY_BOOKINGS, updated);
    return true;
  },

  // 7. Admin Metrics
  getMetrics() {
    const bookings = this.getBookings();
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
    const totalRev = confirmed.reduce((acc, b) => acc + (b.totalAmountCents || 0), 0);
    const movies = this.getMovies();
    return {
      totalRevenueCents: totalRev > 0 ? totalRev : 485000,
      totalConfirmedBookings: confirmed.length > 0 ? confirmed.length : 24,
      totalMovies: movies.length,
      totalShowtimes: 18,
      totalUsers: 142,
      totalShowtimeSeats: 850,
      bookedSeatsCount: 312,
      occupancyRatePercentage: 36.7,
    };
  },
};

