import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 select-none hover:opacity-90 transition duration-200 ease-in-out cursor-pointer">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-(--bg-secondary) border border-(--border) shadow-xs shrink-0">
        {/* Glow indicator behind logo */}
        <div className="absolute inset-0.5 rounded-lg bg-linear-to-tr from-(--primary) to-(--accent) opacity-10 blur-xs" />
        
        {/* Modern SVG Isometric Box / Rocket Connector Icon */}
        <svg className="w-5.5 h-5.5 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          {/* Top isometric plane */}
          <path d="M12 3L4 7.5L12 12L20 7.5L12 3Z" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Left panel */}
          <path d="M4 11.5V16L12 20.5" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          {/* Right panel */}
          <path d="M20 11.5V16L12 20.5" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          {/* Vertical axis line */}
          <path d="M12 12V20.5" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          {/* Center glowing core point */}
          <circle cx="12" cy="7.5" r="1.5" fill="var(--accent)" />
        </svg>
      </div>
      
      {/* Premium Gradient Typography */}
      <span className="font-black text-2xl tracking-tight bg-linear-to-r from-(--primary) to-(--accent) bg-clip-text text-transparent">
        RepoCreator
      </span>
    </Link>
  );
}
