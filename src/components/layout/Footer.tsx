import Link from "next/link";
import { Film, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#050608] border-t border-white/5 pt-12 pb-8 mt-20 text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/5">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">CineBook</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Next-generation cinema ticketing platform with real-time seat reservation, atomic concurrency control, and instant digital passes.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Neon Postgres
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Sparkles className="w-3 h-3" /> GitHub Pages Ready
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/movies" className="hover:text-amber-400 transition-colors">
                  Now Showing Movies
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-amber-400 transition-colors">
                  Cinemas & Theaters
                </Link>
              </li>
              <li>
                <Link href="/account/bookings" className="hover:text-amber-400 transition-colors">
                  My Tickets & Passes
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Cinema Experiences */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Premium Formats
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>IMAX® Laser 4K 1.43:1</li>
              <li>Dolby Cinema™ 64-Channel Atmos</li>
              <li>VIP Luxe Lounge & In-Seat Dining</li>
              <li>RealD™ 3D High Frame Rate</li>
            </ul>
          </div>

          {/* Col 4: Safe Checkout */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Secure Transactions
            </h4>
            <p className="text-xs leading-relaxed text-zinc-400 mb-3">
              Transactions are protected with atomic row locking and payment idempotency. All prices stored strictly in minor units (cents).
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Stripe Test Mode Enabled</span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-400">Privacy Policy</span>
            <span className="hover:text-zinc-400">Terms of Service</span>
            <span className="hover:text-zinc-400">Ticket Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
