import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Github, Rocket, FolderGit2, GitBranch, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { loginWithGitHub } from '../services/api.js';

export default function Home() {
  const { me } = useSelector((state) => state.auth);

  return (
    <div className="w-full min-h-screen bg-(--bg) pb-20 relative overflow-hidden flex flex-col">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-(--glow-1) rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-(--glow-2) rounded-full blur-[150px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 text-center mt-20 relative z-10 space-y-8 flex-1 flex flex-col justify-center items-center select-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-(--bg-secondary) border border-(--border) text-(--text-secondary) text-xs font-black uppercase tracking-wider">
          <Zap size={14} className="text-(--primary)" />
          GitHub Repository Sync Engine
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-(--text-primary) leading-[1.1] max-w-4xl">
          Compare and push folders to GitHub in{' '}
          <span className="bg-linear-to-r from-(--primary) to-(--accent) bg-clip-text text-transparent">
            One Click
          </span>
        </h1>
        
        <p className="text-base md:text-lg text-(--text-secondary) leading-relaxed max-w-2xl mx-auto font-medium">
          Create repositories, compare local files against remote trees, rewrite Flutter app names, and deploy atomic commits instantly using the GitHub Git Database REST API.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center">
          {me ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--text-inverse) font-extrabold px-8 py-4.5 rounded-2xl hover:bg-(--primary-hover) transition duration-200 ease-in-out shadow-lg shadow-(--primary)/15 active:scale-95 cursor-pointer text-sm"
            >
              <Rocket size={18} />
              Go to Dashboard
            </Link>
          ) : (
            <button
              onClick={loginWithGitHub}
              className="inline-flex items-center justify-center gap-2.5 bg-(--primary) text-(--text-inverse) font-extrabold px-8 py-4.5 rounded-2xl hover:bg-(--primary-hover) transition duration-200 ease-in-out shadow-lg shadow-(--primary)/15 active:scale-95 cursor-pointer text-sm"
            >
              <Github size={20} />
              Login with GitHub
            </button>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-(--bg-primary) border border-(--border) text-(--text-primary) hover:bg-(--bg-secondary) font-bold px-8 py-4.5 rounded-2xl transition duration-200 ease-in-out active:scale-95 cursor-pointer text-sm"
          >
            Explore GitHub
          </a>
        </div>
      </header>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 mt-28 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs hover:border-(--primary) hover:shadow-md transition duration-300 ease-in-out group relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-(--primary) to-(--accent) opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-(--bg-secondary) border border-(--border) text-(--primary) flex items-center justify-center mb-6 group-hover:bg-(--primary) group-hover:text-(--text-inverse) transition-all duration-300">
            <FolderGit2 size={22} />
          </div>
          <h3 className="text-lg font-black text-(--text-primary) mb-2">Folder Compare & Sync</h3>
          <p className="text-xs text-(--text-secondary) leading-relaxed">
            Drag & drop or select local directories to compare SHA-1 checksums with remote repositories. Highlights added, modified, and deleted files.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs hover:border-(--primary) hover:shadow-md transition duration-300 ease-in-out group relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-(--primary) to-(--accent) opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-(--bg-secondary) border border-(--border) text-(--primary) flex items-center justify-center mb-6 group-hover:bg-(--primary) group-hover:text-(--text-inverse) transition-all duration-300">
            <RefreshCw size={22} />
          </div>
          <h3 className="text-lg font-black text-(--text-primary) mb-2">Flutter App Renamer</h3>
          <p className="text-xs text-(--text-secondary) leading-relaxed">
            Rewrite project settings inline. Automatically re-maps PRODUCT_NAME inside AppInfo.xcconfig and android:label inside AndroidManifest.xml before commit.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs hover:border-(--primary) hover:shadow-md transition duration-300 ease-in-out group relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-(--primary) to-(--accent) opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-(--bg-secondary) border border-(--border) text-(--primary) flex items-center justify-center mb-6 group-hover:bg-(--primary) group-hover:text-(--text-inverse) transition-all duration-300">
            <ShieldCheck size={22} />
          </div>
          <h3 className="text-lg font-black text-(--text-primary) mb-2">Atomic Git Pushes</h3>
          <p className="text-xs text-(--text-secondary) leading-relaxed">
            Pushes changes recursively using recursive database tree trees. Automatically supports root commit creation on empty repositories.
          </p>
        </div>
      </section>
    </div>
  );
}
