"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Film, Clock, Sparkles } from "lucide-react";
import { ClientStore } from "@/lib/client-store";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  durationMinutes: number;
  rating: string;
  language: string;
  genres: string[];
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  const genres = ["all", "sci-fi", "action", "drama", "thriller", "animation", "romance", "mystery"];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedGenre !== "all") params.set("genre", selectedGenre);

    fetch(`/api/movies?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.movies && data.movies.length > 0) setMovies(data.movies);
        else setMovies(ClientStore.getMovies(searchTerm, selectedGenre));
        setLoading(false);
      })
      .catch(() => {
        setMovies(ClientStore.getMovies(searchTerm, selectedGenre));
        setLoading(false);
      });
  }, [searchTerm, selectedGenre]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Film className="w-8 h-8 text-amber-500" /> Explore Movies
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl">
          Browse our complete catalog of current and upcoming blockbuster releases, award winners, and cinematic experiences.
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by movie title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize shrink-0 transition-all ${
                  selectedGenre === g
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-zinc-900 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-white/5">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No movies match your criteria</h3>
          <p className="text-xs text-zinc-400">Try changing your search term or genre filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <Link
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="glass-card group rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                  {movie.rating}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{movie.durationMinutes} min</span>
                    <span>•</span>
                    <span className="line-clamp-1">{movie.genres.join(", ")}</span>
                  </p>
                </div>
                <div className="pt-2">
                  <span className="block w-full py-2 rounded-lg bg-zinc-800 text-center text-xs font-semibold text-zinc-200 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                    Book Seats
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
