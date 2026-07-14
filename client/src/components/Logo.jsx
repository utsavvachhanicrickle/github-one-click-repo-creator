import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3.5 select-none hover:opacity-90 active:scale-[0.98] transition duration-200 ease-in-out cursor-pointer group"
    >
      <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-(--bg-secondary) border border-(--border) shadow-xs shrink-0 group-hover:border-(--primary) transition duration-300">
        {/* Glow indicator behind logo */}
        <div className="absolute inset-0.5 rounded-lg bg-linear-to-tr from-(--primary) to-(--accent) opacity-5 blur-xs group-hover:opacity-15 transition duration-300" />

        {/* Modern Minimalistic Heavy Stroke Sync Icon */}
        <svg
          className="w-6 h-6 relative z-10"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <path
            d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l.73-.79"
            stroke="url(#logo-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Premium Dual-Color Sans-Serif Typography */}
      <span className="font-sans font-black text-2xl tracking-wider uppercase text-(--text-primary)">
        Repo
        <span className="text-(--primary) group-hover:text-(--accent) transition duration-300">
          Sync
        </span>
      </span>
    </Link>
  );
}
