"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Ticket,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Film,
} from "lucide-react";
import { formatCurrency, formatShowtimeDate, formatShowtimeTime } from "@/lib/utils";

interface Booking {
  id: string;
  bookingReference: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  totalAmountCents: number;
  createdAt: string;
  movie: {
    title: string;
    posterUrl: string;
    rating: string;
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
  seats: string[];
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: string;
  }>;
}

export default function BookingsHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchBookings = () => {
    fetch("/api/bookings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load bookings");
        return res.json();
      })
      .then((data) => {
        setBookings(data.bookings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/bookings/${cancelModalBooking.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setActionMessage({ text: data.error || "Failed to cancel booking", isError: true });
        setIsCancelling(false);
        return;
      }

      setActionMessage({ text: "Booking successfully cancelled and seats released." });
      setCancelModalBooking(null);
      setIsCancelling(false);
      fetchBookings();
    } catch (err: any) {
      setActionMessage({ text: err.message || "An error occurred", isError: true });
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "PENDING":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "CANCELLED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "EXPIRED":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-3 mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Ticket className="w-7 h-7 text-amber-500" /> My Cinema Bookings
        </h1>
        <p className="text-xs md:text-sm text-zinc-400">
          View all your confirmed admissions, digital passes, and manage reservation cancellations.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2 border ${
            actionMessage.isError
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          {actionMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-40 rounded-2xl bg-zinc-900 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-white/5 space-y-4">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-base font-bold text-white">No Bookings Yet</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You haven't reserved any cinema tickets yet. Explore current movies and pick your seats.
          </p>
          <div className="pt-2">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
            >
              Browse Now Showing Movies <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isEligibleForCancel =
              (b.status === "CONFIRMED" || b.status === "PENDING") &&
              new Date(b.showtime.startTime).getTime() - Date.now() > 2 * 60 * 60 * 1000;

            return (
              <div
                key={b.id}
                className="glass-panel p-5 md:p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Movie & Showtime info */}
                <div className="flex items-center gap-4">
                  <div className="relative aspect-[2/3] w-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                    <Image
                      src={b.movie.posterUrl}
                      alt={b.movie.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-tight">{b.movie.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">
                      {b.cinema.name} • <span className="text-zinc-300 font-semibold">{b.cinema.auditoriumName}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {formatShowtimeDate(b.showtime.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {formatShowtimeTime(b.showtime.startTime)}
                      </span>
                      <span className="text-zinc-300 font-bold">
                        Seats: {b.seats.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-2 md:pt-0 border-t md:border-0 border-white/5">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-zinc-500 block font-mono">Ref: {b.bookingReference}</span>
                    <span className="text-base font-extrabold text-white">
                      {formatCurrency(b.totalAmountCents)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === "CONFIRMED" && b.tickets?.[0] && (
                      <Link
                        href={`/tickets/${b.tickets[0].id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
                      >
                        View Ticket Pass
                      </Link>
                    )}

                    {b.status === "PENDING" && (
                      <Link
                        href={`/checkout/${b.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all"
                      >
                        Complete Payment
                      </Link>
                    )}

                    {isEligibleForCancel && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 text-xs font-semibold border border-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Cancel Booking?</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to cancel your reservation for{" "}
              <strong className="text-white">{cancelModalBooking.movie.title}</strong> (Booking Ref:{" "}
              <span className="font-mono text-amber-400">{cancelModalBooking.bookingReference}</span>)?
            </p>

            <p className="text-[11px] text-zinc-400">
              Your seats ({cancelModalBooking.seats.join(", ")}) will be released back to the general audience immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                disabled={isCancelling}
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Keep Booking
              </button>
              <button
                disabled={isCancelling}
                onClick={handleCancelBooking}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-colors"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
