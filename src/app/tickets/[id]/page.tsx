"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Ticket as TicketIcon,
  MapPin,
  Calendar,
  Clock,
  Printer,
  ChevronLeft,
  CheckCircle2,
  Share2,
  Film,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatShowtimeDate, formatShowtimeTime } from "@/lib/utils";

interface TicketDetails {
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

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Ticket not found or unauthorized");
        return res.json();
      })
      .then((data) => {
        setTicket(data.ticket);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Rendering digital cinema ticket...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <TicketIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Ticket Unavailable</h2>
        <p className="text-sm text-zinc-400 mb-6">{error || "Could not locate this ticket."}</p>
        <Link
          href="/account/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> View My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Action Header */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href="/account/bookings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white border border-white/5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> My Bookings
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Pass
          </button>
        </div>
      </div>

      {/* Digital Cinema Ticket Card */}
      <div className="relative bg-[#0F111A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden print:border-black print:text-black print:bg-white">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 p-4 text-center text-white">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Film className="w-4 h-4" /> Official Cinema Admission Pass
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Booking Reference
              </span>
              <span className="text-2xl md:text-3xl font-mono font-black text-white tracking-wider">
                {ticket.bookingReference}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> {ticket.status}
              </span>
            </div>
          </div>

          {/* Movie Details */}
          <div className="flex gap-4 items-center p-4 rounded-2xl bg-zinc-900/80 border border-white/5">
            <div className="relative aspect-[2/3] w-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0">
              <Image
                src={ticket.movie.posterUrl}
                alt={ticket.movie.title}
                fill
                className="object-cover"
                sizes="100px"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight">{ticket.movie.title}</h2>
              <p className="text-xs text-zinc-400">{ticket.cinema.name}</p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                <span className="font-semibold">{ticket.auditorium.name}</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                  {ticket.showtime.format}
                </span>
              </div>
            </div>
          </div>

          {/* Key Showtime & Seat Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-center">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Date</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {formatShowtimeDate(ticket.showtime.startTime)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Time</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {formatShowtimeTime(ticket.showtime.startTime)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Seat</span>
              <span className="text-base font-extrabold text-amber-400 mt-0.5 block">
                {ticket.seat.label}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Tier</span>
              <span className="text-xs font-bold text-zinc-200 mt-0.5 block capitalize">
                {ticket.seat.type.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Tear Line / Notch Perforation Effect */}
          <div className="relative flex items-center justify-between my-6">
            <div className="absolute -left-10 w-6 h-6 rounded-full bg-[#07080C]" />
            <div className="w-full border-t-2 border-dashed border-zinc-800" />
            <div className="absolute -right-10 w-6 h-6 rounded-full bg-[#07080C]" />
          </div>

          {/* QR Code Validation Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold text-white block">Present at Usher Scanner</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs">
                Scan this high-resolution QR pass directly from your phone screen at the auditorium entryway.
              </p>
              <div className="pt-2">
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Ticket Code: {ticket.ticketCode}
                </span>
              </div>
            </div>

            {/* Generated QR Code Image */}
            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
              <Image
                src={ticket.qrCodeDataUrl}
                alt="Ticket QR Code"
                width={140}
                height={140}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
