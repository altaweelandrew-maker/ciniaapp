"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Calendar,
  Sparkles,
  Ticket,
  MapPin,
  Play,
  Film,
  ChevronLeft,
  X,
} from "lucide-react";
import { formatCurrency, formatShowtimeDate, formatShowtimeTime } from "@/lib/utils";
import { ClientStore } from "@/lib/client-store";

interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  format: string;
  basePriceCents: number;
  status: string;
  auditorium: {
    id: string;
    name: string;
    screenType: string;
    totalSeats: number;
  };
  cinema: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

interface MovieDetails {
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
  genres: string[];
  showtimes: Showtime[];
}

export function MovieDetailClient({ id }: { id: string }) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    // Try API first, fallback to ClientStore
    fetch(`/api/movies/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.movie) setMovie(data.movie);
        else setMovie(ClientStore.getMovieById(id));
        setLoading(false);
      })
      .catch(() => {
        setMovie(ClientStore.getMovieById(id));
        setLoading(false);
      });
  }, [id]);

  if (loading || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Loading movie details and showtimes...</p>
      </div>
    );
  }

  const cinemasGroup: Record<string, { cinema: Showtime["cinema"]; showtimes: Showtime[] }> = {};

  const filteredShowtimes = selectedDate
    ? movie.showtimes.filter((st) => new Date(st.startTime).toISOString().split("T")[0] === selectedDate)
    : movie.showtimes;

  for (const st of filteredShowtimes) {
    if (!cinemasGroup[st.cinema.id]) {
      cinemasGroup[st.cinema.id] = { cinema: st.cinema, showtimes: [] };
    }
    cinemasGroup[st.cinema.id].showtimes.push(st);
  }

  const availableDates = Array.from(
    new Set(movie.showtimes.map((st) => new Date(st.startTime).toISOString().split("T")[0]))
  ).sort();

  return (
    <div className="min-h-screen">
      {/* 1. Backdrop Hero */}
      <div className="relative w-full h-[400px] md:h-[500px]">
        <Image
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          fill
          priority
          className="object-cover object-center brightness-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/70 to-transparent" />

        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <Link
            href="/movies"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-xs font-medium text-zinc-300 hover:text-white border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> All Movies
          </Link>
        </div>
      </div>

      {/* 2. Movie Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Poster & Quick Info */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <div className="relative aspect-[2/3] w-64 md:w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                priority
                className="object-cover object-center"
                sizes="300px"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                {movie.rating}
              </div>
            </div>

            {movie.trailerUrl && (
              <button
                onClick={() => setShowTrailerModal(true)}
                className="w-64 md:w-72 mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors backdrop-blur-sm"
              >
                <Play className="w-4 h-4 fill-white text-white" /> Watch Official Trailer
              </button>
            )}
          </div>

          {/* Details & Showtimes */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  >
                    {g}
                  </span>
                ))}
                <span className="text-xs text-zinc-400 flex items-center gap-1 ml-2">
                  <Clock className="w-3.5 h-3.5" /> {movie.durationMinutes} min
                </span>
                <span className="text-xs text-zinc-400">• {movie.language}</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>

              <p className="text-sm md:text-base text-zinc-300 leading-relaxed max-w-3xl pt-2">
                {movie.synopsis}
              </p>
            </div>

            {/* 3. SHOWTIMES SELECTOR */}
            <div className="pt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-500" /> Select Showtime & Screen
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Click any time slot below to launch the interactive seat reservation screen.
                  </p>
                </div>

                {/* Date Picker Buttons */}
                {availableDates.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setSelectedDate("")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedDate === ""
                          ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      All Dates
                    </button>
                    {availableDates.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                          selectedDate === d
                            ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {formatShowtimeDate(d)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cinema Groupings */}
              {Object.keys(cinemasGroup).length === 0 ? (
                <div className="glass-panel p-8 text-center rounded-2xl border border-white/5">
                  <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">
                    No showtimes currently scheduled for the selected date. Please check another day.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.values(cinemasGroup).map(({ cinema, showtimes: stList }) => (
                    <div
                      key={cinema.id}
                      className="glass-panel p-5 md:p-6 rounded-2xl border border-white/10 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-amber-400" /> {cinema.name}
                          </h3>
                          <p className="text-xs text-zinc-400 pl-6">{cinema.address}, {cinema.city}</p>
                        </div>
                      </div>

                      {/* Showtime Buttons Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                        {stList.map((st) => (
                          <Link
                            key={st.id}
                            href={`/showtimes/${st.id}/seats`}
                            className="group p-3 rounded-xl bg-zinc-900/90 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/40 transition-all flex flex-col justify-between text-left"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                {formatShowtimeTime(st.startTime)}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                  st.format === "IMAX"
                                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                    : st.format === "DOLBY"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : "bg-zinc-800 text-zinc-300"
                                }`}
                              >
                                {st.format}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="truncate max-w-[110px]">{st.auditorium.name}</span>
                              <span className="font-semibold text-zinc-300">
                                {formatCurrency(st.basePriceCents)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Trailer Video Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-zinc-950 rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">{movie.title} - Official Trailer</h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerUrl?.split("v=")[1] || ""}?autoplay=1`}
                title={`${movie.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
