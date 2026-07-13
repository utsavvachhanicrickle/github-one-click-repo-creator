import { Github } from 'lucide-react';
import { loginWithGitHub } from '../services/auth.service.js';

export default function Login() {
  return (
    <div className="flex items-center justify-center p-6 relative min-h-[calc(100vh-2rem)]">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-(--glow-1) rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-(--glow-2) rounded-full blur-[120px] pointer-events-none" />

      <section className="max-w-3xl mx-auto text-center relative z-10 py-12">
        <div className="inline-block px-4 py-1.5 rounded-full bg-(--bg-secondary) border border-(--border) text-(--text-secondary) text-xs font-bold uppercase tracking-wider mb-6">
          GitHub OAuth + Node + Vite + Tailwind
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-(--text-primary) mb-6 leading-tight">
          Create instant GitHub repos for your web templates.
        </h1>
        <p className="text-lg md:text-xl text-(--text-secondary) mb-10 leading-relaxed max-w-2xl mx-auto">
          Authenticate via GitHub and deploy a fully configured, production-ready website repository with just one click.
        </p>
        <button
          className="inline-flex items-center justify-center gap-3 bg-(--primary) text-(--text-inverse) font-bold px-8 py-4 rounded-2xl hover:bg-(--primary-hover) transition shadow-xl active:scale-95 cursor-pointer"
          onClick={loginWithGitHub}
        >
          <Github size={22} />
          Login with GitHub
        </button>
      </section>
    </div>
  );
}
