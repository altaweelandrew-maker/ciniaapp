"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Film, Ticket, ShieldCheck, User, LogOut, Clapperboard } from "lucide-react";
import { UserSession } from "@/lib/types";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-rose-300 to-white">
              CineBook
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest -mt-1 font-medium">
              Cinema Tickets
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors hover:text-amber-400 ${
              pathname === "/" ? "text-amber-400 font-semibold" : "text-zinc-300"
            }`}
          >
            Now Showing
          </Link>
          <Link
            href="/movies"
            className={`transition-colors hover:text-amber-400 ${
              pathname === "/movies" ? "text-amber-400 font-semibold" : "text-zinc-300"
            }`}
          >
            All Movies
          </Link>
          <Link
            href="/cinemas"
            className={`transition-colors hover:text-amber-400 ${
              pathname === "/cinemas" ? "text-amber-400 font-semibold" : "text-zinc-300"
            }`}
          >
            Cinemas
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors ${
                pathname.startsWith("/admin") ? "ring-2 ring-amber-400" : ""
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* User / Auth Actions */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/account/bookings"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 transition-all"
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">My Bookings</span>
              </Link>

              <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900/90 py-1 px-2.5 rounded-full border border-white/10">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium max-w-[100px] truncate">{user.name}</span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="text-zinc-400 hover:text-rose-400 transition-colors ml-1 p-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 px-4 py-2 rounded-lg shadow-md shadow-amber-500/20 transition-all hover:scale-105"
              >
                Join CineBook
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
