"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  MapPin,
  ChevronLeft,
  Info,
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Accessibility,
} from "lucide-react";
import { formatCurrency, formatShowtimeDate, formatShowtimeTime } from "@/lib/utils";
import { BOOKING_FEE_CENTS_PER_SEAT, TAX_RATE } from "@/lib/constants";

interface Seat {
  id: string;
  showtimeSeatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: "STANDARD" | "VIP" | "RECLINER" | "ACCESSIBLE";
  priceMultiplier: number;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  priceCents: number;
  heldByMe?: boolean;
}

interface ShowtimeSeatData {
  showtime: {
    id: string;
    startTime: string;
    endTime: string;
    format: string;
    basePriceCents: number;
  };
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    rating: string;
    durationMinutes: number;
  };
  cinema: {
    id: string;
    name: string;
  };
  auditorium: {
    id: string;
    name: string;
    screenType: string;
    rowCount: number;
    columnCount: number;
    rowLabels: string[];
  };
  seats: Seat[];
}

export default function SeatSelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: showtimeId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<ShowtimeSeatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSeats = () => {
    fetch(`/api/showtimes/${showtimeId}/seats`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load showtime seat map");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSeats();
    // Auto-refresh seat status every 15 seconds to reflect other patrons' holds
    const interval = setInterval(fetchSeats, 15000);
    return () => clearInterval(interval);
  }, [showtimeId]);

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== "AVAILABLE" && !seat.heldByMe) return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.id));
      setErrorMessage(null);
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMessage("Maximum 8 seats allowed per booking transaction.");
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
      setErrorMessage(null);
    }
  };

  const selectedSeats = data?.seats.filter((s) => selectedSeatIds.includes(s.id)) || [];

  // Calculations
  const subtotalCents = selectedSeats.reduce((acc, s) => acc + s.priceCents, 0);
  const feeCents = selectedSeats.length * BOOKING_FEE_CENTS_PER_SEAT;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + feeCents + taxCents;

  const handleProceedToCheckout = async () => {
    if (selectedSeatIds.length === 0) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
          idempotencyKey: `hold_${showtimeId}_${selectedSeatIds.sort().join("_")}_${Date.now()}`,
        }),
      });

      const json = await res.json();

      if (res.status === 401) {
        // Redirect to login with callback
        router.push(`/login?redirect=/showtimes/${showtimeId}/seats`);
        return;
      }

      if (!res.ok) {
        setErrorMessage(
          json.error || "Some of your selected seats are no longer available. Please select different seats."
        );
        fetchSeats(); // Refresh seat layout immediately
        setSelectedSeatIds([]);
        setSubmitting(false);
        return;
      }

      // Success: redirect to checkout page
      router.push(`/checkout/${json.booking.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while reserving seats.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Loading auditorium layout and live seat availability...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Showtime Unavailable</h2>
        <p className="text-sm text-zinc-400 mb-6">{errorMessage || "Could not load seat map."}</p>
        <Link
          href="/movies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Return to Movies
        </Link>
      </div>
    );
  }

  const { movie, showtime, cinema, auditorium, seats } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col justify-between">
      {/* 1. Header Information */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              href={`/movies/${movie.id}`}
              className="p-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {movie.title}
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {movie.rating}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {showtime.format}
                </span>
              </h1>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                <span>{cinema.name}</span>
                <span>•</span>
                <span className="text-zinc-300 font-semibold">{auditorium.name}</span>
                <span>•</span>
                <span>{formatShowtimeDate(showtime.startTime)} at {formatShowtimeTime(showtime.startTime)}</span>
              </p>
            </div>
          </div>

          {/* Seat Status Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <div className="w-5 h-5 rounded-md bg-zinc-800 border border-white/20" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <div className="w-5 h-5 rounded-md bg-amber-500 text-black flex items-center justify-center font-bold text-[10px] shadow-md shadow-amber-500/40">
                ✓
              </div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <div className="w-5 h-5 rounded-md bg-zinc-800 border-2 border-amber-400/60" />
              <span>VIP ($)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <div className="w-5 h-5 rounded-md bg-zinc-800 border-2 border-purple-500/60" />
              <span>Recliner</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <div className="w-5 h-5 rounded-md bg-zinc-900/80 border border-zinc-800 text-zinc-700 flex items-center justify-center text-[10px]">
                ✕
              </div>
              <span>Booked</span>
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="my-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2. Interactive Cinema Auditorium & Seat Grid */}
        <div className="my-10 p-6 md:p-12 glass-panel rounded-3xl border border-white/10 flex flex-col items-center">
          {/* Curved Cinema Screen Graphic */}
          <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
            <div className="screen-curve mb-3" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-sky-400/80">
              Screen (Front of Auditorium)
            </p>
          </div>

          {/* Seat Map Grid */}
          <div className="w-full overflow-x-auto pb-4 flex justify-center no-scrollbar">
            <div className="flex flex-col gap-2.5 min-w-max">
              {auditorium.rowLabels.map((rowLabel) => {
                const rowSeats = seats
                  .filter((s) => s.rowLabel === rowLabel)
                  .sort((a, b) => a.seatNumber - b.seatNumber);

                return (
                  <div key={rowLabel} className="flex items-center gap-2">
                    {/* Left Row Label */}
                    <span className="w-6 text-xs font-bold text-zinc-400 text-center select-none">
                      {rowLabel}
                    </span>

                    {/* Row Seats */}
                    <div className="flex items-center gap-2">
                      {rowSeats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        const isBooked = seat.status === "BOOKED";
                        const isHeld = seat.status === "HELD" && !seat.heldByMe;

                        let buttonStyles = "bg-zinc-800 border-zinc-700 hover:border-amber-400 hover:scale-110";

                        if (isSelected) {
                          buttonStyles = "bg-amber-500 text-black border-amber-300 scale-110 shadow-lg shadow-amber-500/40 font-bold";
                        } else if (isBooked) {
                          buttonStyles = "bg-zinc-950/80 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-40";
                        } else if (isHeld) {
                          buttonStyles = "bg-amber-950/60 border-amber-900/60 text-amber-700 cursor-not-allowed opacity-60";
                        } else if (seat.seatType === "VIP") {
                          buttonStyles = "bg-zinc-900 border-2 border-amber-400/60 text-amber-300 hover:bg-amber-500/20";
                        } else if (seat.seatType === "RECLINER") {
                          buttonStyles = "bg-zinc-900 border-2 border-purple-400/60 text-purple-300 hover:bg-purple-500/20";
                        } else if (seat.seatType === "ACCESSIBLE") {
                          buttonStyles = "bg-zinc-900 border border-sky-400/60 text-sky-300 hover:bg-sky-500/20";
                        }

                        // Add gap between seat 6 and 7 to simulate aisle
                        const hasAisleGap = seat.seatNumber === 6;

                        return (
                          <div key={seat.id} className={`relative group ${hasAisleGap ? "mr-6" : ""}`}>
                            <button
                              disabled={isBooked || isHeld}
                              onClick={() => toggleSeat(seat)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold border transition-all duration-150 ${buttonStyles}`}
                              title={`${seat.rowLabel}${seat.seatNumber} - ${seat.seatType} (${formatCurrency(seat.priceCents)})`}
                            >
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : seat.seatType === "ACCESSIBLE" ? (
                                <Accessibility className="w-3 h-3" />
                              ) : (
                                seat.seatNumber
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Row Label */}
                    <span className="w-6 text-xs font-bold text-zinc-400 text-center select-none">
                      {rowLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Checkout Bar */}
      <div className="sticky bottom-4 z-40 w-full glass-panel p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Selected seats list & info */}
          <div className="w-full md:w-auto">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Selected Seats ({selectedSeats.length})
            </span>
            {selectedSeats.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Please click on the seats above to make your selection.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedSeats.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30"
                  >
                    {s.rowLabel}{s.seatNumber} ({formatCurrency(s.priceCents)})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing breakdown & Action */}
          <div className="flex items-center justify-between w-full md:w-auto gap-6">
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 block">Total (incl. fees & tax)</span>
              <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                {formatCurrency(totalCents)}
              </span>
            </div>

            <button
              disabled={selectedSeats.length === 0 || submitting}
              onClick={handleProceedToCheckout}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs md:text-sm shadow-xl transition-all ${
                selectedSeats.length === 0 || submitting
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-500/20 hover:scale-105"
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Locking Seats...
                </>
              ) : (
                <>
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
