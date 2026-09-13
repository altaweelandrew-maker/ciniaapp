"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone, Film, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

interface Screen {
  id: string;
  name: string;
  screenType: string;
  totalSeats: number;
}

interface Cinema {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  amenities: string[];
  screens: Screen[];
}

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => {
        if (data.cinemas) setCinemas(data.cinemas);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5" /> Luxury Venues
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          CineBook Premiere Theaters
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          State-of-the-art cinematic destinations designed with acoustic architecture, ultra-high lumen laser projection, and gourmet dining amenities.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-zinc-900 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 hover:border-amber-500/30 transition-all duration-300 shadow-xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                      {cinema.name}
                    </h2>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}</span>
                    </p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                      <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span>{cinema.phone}</span>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      Auditoriums & Screen Formats
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cinema.screens.map((screen) => (
                        <div
                          key={screen.id}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-200 flex items-center gap-2"
                        >
                          <Film className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold">{screen.name}</span>
                          <span className="text-[10px] text-zinc-400">({screen.totalSeats} seats)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      Cinema Amenities & Services
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cinema.amenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-zinc-300 bg-white/5 px-3 py-2 rounded-xl"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/movies`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
                    >
                      View Movies at this Cinema <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
