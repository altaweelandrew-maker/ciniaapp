"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Ticket,
  Play,
  Film,
  Star,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { formatCurrency, formatShowtimeTime } from "@/lib/utils";

interface Movie {
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

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const genres = ["all", "sci-fi", "action", "drama", "thriller", "animation", "romance"];

  // Generate next 5 days for date selector
  const dateOptions = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { dateStr, label };
  });

  useEffect(() => {
    // Fetch cinemas
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => {
        if (data.cinemas) setCinemas(data.cinemas);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedGenre && selectedGenre !== "all") params.set("genre", selectedGenre);
    if (selectedCinema) params.set("cinemaId", selectedCinema);
    if (selectedDate) params.set("date", selectedDate);

    fetch(`/api/movies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.movies) setMovies(data.movies);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [searchTerm, selectedGenre, selectedCinema, selectedDate]);

  const featuredMovie = movies.find((m) => m.isFeatured) || movies[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      {featuredMovie && (
        <section className="relative w-full h-[540px] md:h-[640px] flex items-end overflow-hidden">
          {/* Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              fill
              priority
              className="object-cover object-center scale-105 transform hover:scale-100 transition-transform duration-1000 brightness-50"
              sizes="100vw"
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080C] via-[#07080C]/40 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Featured Premiere
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-zinc-800/90 text-zinc-300 border border-white/10">
                  {featuredMovie.rating}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {featuredMovie.durationMinutes} min
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                {featuredMovie.title}
              </h1>

              <p className="text-sm md:text-base text-zinc-300 line-clamp-3 leading-relaxed">
                {featuredMovie.synopsis}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {featuredMovie.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-zinc-200 backdrop-blur-sm"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Link
                  href={`/movies/${featuredMovie.id}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
                >
                  <Ticket className="w-4 h-4" /> Book Tickets Now
                </Link>
                {featuredMovie.trailerUrl && (
                  <a
                    href={featuredMovie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/10 backdrop-blur-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" /> Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. SEARCH & FILTER BAR */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 w-full">
        <div className="glass-panel p-4 md:p-6 rounded-2xl shadow-2xl border border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search movies by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* Cinema Selector */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-3.5 w-4 h-4 text-zinc-400" />
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
              >
                <option value="">All Cinema Locations</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div className="relative flex items-center">
              <Calendar className="absolute left-3.5 w-4 h-4 text-zinc-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
              >
                <option value="">Any Showing Date</option>
                {dateOptions.map((d) => (
                  <option key={d.dateStr} value={d.dateStr}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 no-scrollbar">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mr-2 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Genres:
            </span>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize shrink-0 transition-all ${
                  selectedGenre === genre
                    ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                    : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 hover:text-white"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. NOW PLAYING GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Film className="w-6 h-6 text-amber-500" /> Now Showing in Theaters
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Select a movie to pick your cinema, showtime, and reserve your seats in real-time.
            </p>
          </div>
          <Link
            href="/movies"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
          >
            View All Movies <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-96 rounded-2xl bg-zinc-900 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl border border-white/5 max-w-md mx-auto">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No movies found</h3>
            <p className="text-xs text-zinc-400 mb-4">
              We couldn't find any movie matching your current filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedGenre("all");
                setSelectedCinema("");
                setSelectedDate("");
              }}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-amber-400 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.id}`}
                className="glass-card group rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Poster container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Rating Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                    {movie.rating}
                  </div>
                  {/* Language */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-amber-500/90 text-black text-[10px] font-bold">
                    {movie.language}
                  </div>
                  {/* Hover Overlay with Book Action */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs text-center shadow-lg">
                      View Showtimes & Seats
                    </span>
                  </div>
                </div>

                {/* Movie Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-1">
                      <span>{movie.durationMinutes} min</span>
                      <span>•</span>
                      <span className="line-clamp-1">{movie.genres.join(", ")}</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. PREMIUM EXPERIENCE HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Star className="w-3.5 h-3.5 fill-rose-300" /> Premium Cinema Technologies
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Immerse in IMAX® Laser & Dolby Atmos®
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Experience the pinnacle of cinema. Crystal clear 4K laser projection, 64-channel spatial sound, and luxury heated recliners with in-seat artisan bistro service.
            </p>
            <div className="pt-2">
              <Link
                href="/cinemas"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                Explore Cinema Auditoriums <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
