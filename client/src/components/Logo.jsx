import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Logo() {
  const location = useLocation();
  const { me } = useSelector((state) => state.auth);

  let logoLink = "/";
  let labelText = "";
  let labelColor = "";

  if (me) {
    if (location.pathname.startsWith("/admin")) {
      logoLink = `/admin/${me.unique_id}`;
      labelText = "Admin";
      labelColor = "bg-indigo-500/10 border-indigo-500/20 text-indigo-500";
    } else if (location.pathname.startsWith("/id")) {
      logoLink = `/id/${me.unique_id}`;
      labelText = "Portal";
      labelColor = "bg-(--primary)/10 border-(--primary)/20 text-(--primary)";
    }
  }

  return (
    <Link
      to={logoLink}
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
      <span className="font-sans font-black text-2xl tracking-wider uppercase text-(--text-primary) flex items-center gap-2">
        Repo
        <span className="text-(--primary) group-hover:text-(--accent) transition duration-300">
          Sync
        </span>
        {labelText && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${labelColor} select-none`}>
            {labelText}
          </span>
        )}
      </span>
    </Link>
  );
}
