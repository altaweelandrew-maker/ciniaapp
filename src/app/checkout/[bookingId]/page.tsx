"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Lock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
  Ticket,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatShowtimeDate, formatShowtimeTime } from "@/lib/utils";

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  totalAmountCents: number;
  subtotalCents: number;
  feeCents: number;
  taxCents: number;
  holdExpiresAt: string;
  movie: {
    title: string;
    posterUrl: string;
    rating: string;
  };
  showtime: {
    startTime: string;
    format: string;
  };
  cinema: {
    name: string;
  };
  auditorium: {
    name: string;
  };
  items: Array<{
    id: string;
    seatLabel: string;
    seatType: string;
    priceCents: number;
  }>;
  tickets: Array<{
    id: string;
  }>;
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Form state
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");
  const [cardholderName, setCardholderName] = useState("Alex Mercer");
  const [isProcessing, setIsProcessing] = useState(false);

  // Hold Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load booking");
        return res.json();
      })
      .then((data) => {
        setBooking(data.booking);
        setLoading(false);

        // If already confirmed, redirect to ticket
        if (data.booking.status === "CONFIRMED" && data.booking.tickets?.[0]) {
          router.push(`/tickets/${data.booking.tickets[0].id}`);
        }
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setLoading(false);
      });
  }, [bookingId]);

  // Countdown timer logic
  useEffect(() => {
    if (!booking?.holdExpiresAt) return;

    const calculateRemaining = () => {
      const expires = new Date(booking.holdExpiresAt).getTime();
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsRemaining(diffSeconds);
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [booking]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const idempotencyKey = `pay_${booking.id}_${Date.now()}`;

    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          cardNumber,
          idempotencyKey,
          provider: "TEST_PROVIDER",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Payment was declined or failed.");
        setIsProcessing(false);
        return;
      }

      // Re-fetch booking to get newly minted ticket ID
      const updatedRes = await fetch(`/api/bookings/${booking.id}`);
      const updatedData = await updatedRes.json();

      if (updatedData.booking?.tickets?.[0]?.id) {
        router.push(`/tickets/${updatedData.booking.tickets[0].id}`);
      } else {
        router.push("/account/bookings");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during payment.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Preparing checkout session...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Booking Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">{errorMessage || "Invalid booking ID."}</p>
        <Link
          href="/movies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Return to Movies
        </Link>
      </div>
    );
  }

  const isHoldExpired = secondsRemaining !== null && secondsRemaining <= 0;
  const minutes = secondsRemaining ? Math.floor(secondsRemaining / 60) : 0;
  const seconds = secondsRemaining ? secondsRemaining % 60 : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hold Expiration Alert Bar */}
      <div
        className={`mb-8 p-4 rounded-2xl border flex items-center justify-between transition-all ${
          isHoldExpired
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
            : minutes < 3
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse"
            : "glass-panel border-white/10 text-zinc-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              {isHoldExpired ? "Seat Hold Expired" : "Temporary Seat Reservation"}
            </span>
            <span className="text-xs text-zinc-400">
              {isHoldExpired
                ? "Your seat reservation window has expired. These seats may be claimed by others."
                : "Your seats are held securely. Complete payment before the timer reaches zero."}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg md:text-xl font-mono font-bold tracking-widest text-amber-400">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-400" /> Order Summary
            </h2>

            {/* Movie Info */}
            <div className="flex gap-4 items-center">
              <div className="relative aspect-[2/3] w-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                <Image
                  src={booking.movie.posterUrl}
                  alt={booking.movie.title}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white line-clamp-1">{booking.movie.title}</h3>
                <p className="text-xs text-zinc-400">{booking.cinema.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300">{booking.auditorium.name}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {booking.showtime.format}
                  </span>
                </div>
              </div>
            </div>

            {/* Showtime details */}
            <div className="pt-3 border-t border-white/5 text-xs text-zinc-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Date & Time:</span>
                <span className="font-medium">
                  {formatShowtimeDate(booking.showtime.startTime)} at {formatShowtimeTime(booking.showtime.startTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Booking Ref:</span>
                <span className="font-mono font-bold text-amber-400">{booking.bookingReference}</span>
              </div>
            </div>

            {/* Itemized Price Breakdown (Strict Minor Units) */}
            <div className="pt-4 border-t border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>
                  Tickets ({booking.items.length} seats: {booking.items.map((i) => i.seatLabel).join(", ")})
                </span>
                <span className="font-medium">{formatCurrency(booking.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Convenience / Booking Fee</span>
                <span>{formatCurrency(booking.feeCents)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Estimated Taxes (8.25%)</span>
                <span>{formatCurrency(booking.taxCents)}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-xl text-amber-400">{formatCurrency(booking.totalAmountCents)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Form (Test Mode Provider) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" /> Payment Details
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Test payment provider enabled. No real charges will be made.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-3 h-3" /> Test Mode
              </span>
            </div>

            {/* Pre-fill Shortcuts for Testing */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Test Cards:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCardNumber("4242 4242 4242 4242")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 transition-colors"
                >
                  ✓ Successful Card (4242...)
                </button>
                <button
                  type="button"
                  onClick={() => setCardNumber("4000 0000 0000 0002")}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold border border-rose-500/30 transition-colors"
                >
                  ✕ Decline Simulator (...0002)
                </button>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isProcessing || isHoldExpired}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                    isProcessing || isHoldExpired
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-500/20 hover:scale-[1.02]"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying Payment & Issuing Tickets...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Pay {formatCurrency(booking.totalAmountCents)}
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-zinc-500 leading-relaxed pt-2">
                By clicking pay, you agree to the CineBook terms. Full refund available up to 2 hours before showtime.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
