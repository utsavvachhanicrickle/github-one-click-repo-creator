import { Link } from 'react-router-dom';
import { FolderGit2, Calendar, GitFork, ArrowUpRight } from 'lucide-react';

export default function RepoCard({ repo }) {
  return (
    <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) hover:border-(--primary) transition shadow-xs hover:shadow-md flex flex-col justify-between h-full group relative overflow-hidden">
      {/* Glow background indicator on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-(--primary) to-(--accent) opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-4 mb-4 select-none">
          <div className="p-3 rounded-2xl bg-(--bg-secondary) border border-(--border) text-(--primary) shrink-0 group-hover:bg-(--primary) group-hover:text-(--text-inverse) transition-all duration-300">
            <FolderGit2 size={22} />
          </div>
          <div className="flex items-center gap-2">
            {repo.isPrivate ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-(--danger) bg-(--danger-bg) border border-(--danger-border) px-2.5 py-0.5 rounded-full">
                Private
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-(--success) bg-(--success-bg) border border-(--success-border) px-2.5 py-0.5 rounded-full">
                Public
              </span>
            )}
          </div>
        </div>

        <h4 className="text-lg font-extrabold text-(--text-primary) tracking-tight mb-2 truncate group-hover:text-(--primary) transition-colors">
          {repo.name}
        </h4>
        
        <p className="text-xs text-(--text-secondary) font-mono mb-4">
          Owner: <span className="font-semibold text-(--text-primary)">@{repo.owner}</span>
        </p>

        {repo.language && (
          <span className="inline-block text-[11px] font-bold bg-(--bg-secondary) border border-(--border) text-(--text-secondary) px-2.5 py-1 rounded-lg mb-4">
            {repo.language}
          </span>
        )}
      </div>

      <div>
        <div className="mt-4 pt-4 border-t border-(--border) flex items-center justify-between text-xs text-(--text-secondary) font-semibold">
          <div className="flex items-center gap-1.5" title="Default Branch">
            <GitFork size={14} />
            <span>{repo.defaultBranch}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Last Updated">
            <Calendar size={14} />
            <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <Link
          to={`/dashboard/repos/${repo.owner}/${repo.name}`}
          className="mt-6 w-full bg-(--bg-secondary) hover:bg-(--primary) text-(--text-primary) hover:text-(--text-inverse) font-bold py-3.5 rounded-xl border border-(--border) hover:border-transparent flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer shadow-xs select-none"
        >
          Open Repository
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}
