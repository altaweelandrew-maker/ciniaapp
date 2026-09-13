export type SeatStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type ScreenType = "STANDARD" | "IMAX" | "DOLBY" | "VIP_LOUNGE";
export type SeatType = "STANDARD" | "VIP" | "RECLINER" | "ACCESSIBLE";
export type ShowtimeFormat = "2D" | "3D" | "IMAX" | "DOLBY";
export type UserRole = "user" | "admin";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SeatWithStatus {
  id: string; // seat.id
  showtimeSeatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
  priceMultiplier: number;
  status: SeatStatus;
  priceCents: number;
  holdExpiresAt?: string | null;
  heldByMe?: boolean;
}

export interface MovieWithGenres {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string | null;
  durationMinutes: number;
  rating: string;
  language: string;
  releaseDate: string;
  isFeatured: boolean;
  genres: string[];
}

export interface ShowtimeWithCinema {
  id: string;
  movieId: string;
  auditoriumId: string;
  auditoriumName: string;
  screenType: ScreenType;
  cinemaId: string;
  cinemaName: string;
  cinemaAddress: string;
  startTime: string;
  endTime: string;
  format: ShowtimeFormat;
  basePriceCents: number;
  status: string;
}
