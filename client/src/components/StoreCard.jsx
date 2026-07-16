import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FolderGit2, Calendar, ExternalLink, User } from "lucide-react";

export default function StoreCard({ store }) {
  const navigate = useNavigate();
  const { me } = useSelector((state) => state.auth);
  
  const { store_name, repo_name, github_link, created_at, creator_id } = store;

  let owner = "";
  try {
    const urlParts = new URL(github_link).pathname.split("/").filter(Boolean);
    owner = urlParts[0] || "";
  } catch (e) {
    // silently fail
  }

  const linkTo = me?.role === "admin"
    ? `/admin/${me?.unique_id}/repos/${owner}/${repo_name}`
    : `/id/${me?.unique_id}/repos/${owner}/${repo_name}`;

  const handleCardClick = (e) => {
    if (e.target.closest("a") || e.target.closest("button")) {
      return;
    }
    if (owner && repo_name) {
      navigate(linkTo);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) hover:border-(--primary) transition shadow-xs hover:shadow-md flex flex-col justify-between h-full group relative overflow-hidden select-none cursor-pointer"
    >
      {/* Glow background indicator on hover */}
      <div className="absolute inset-0 bg-linear-to-tr from-(--primary) to-(--accent) opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-4 mb-4 select-none">
          <div className="p-3 rounded-2xl bg-(--bg-secondary) border border-(--border) text-(--primary) shrink-0 group-hover:bg-(--primary) group-hover:text-(--text-inverse) transition-all duration-300">
            <FolderGit2 size={22} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-(--success) bg-(--success-bg) border border-(--success-border) px-2.5 py-0.5 rounded-full">
            Active Store
          </span>
        </div>

        <h4 className="text-xl font-black text-(--text-primary) tracking-tight mb-1 truncate group-hover:text-(--primary) transition-colors">
          {store_name}
        </h4>
        <p className="text-xs text-(--text-secondary) font-mono mb-4 truncate" title={repo_name}>
          Repository: <span className="font-semibold text-(--text-primary)">{repo_name}</span>
        </p>

        {creator_id && (
          <div className="flex items-center gap-1.5 text-xs text-(--text-secondary) mb-2">
            <User size={13} />
            <span>Creator: <span className="font-semibold text-(--text-primary) font-mono">{creator_id.substring(0, 8)}...</span></span>
          </div>
        )}
      </div>
{/* 
      <div>
        <div className="mt-4 pt-4 border-t border-(--border) flex items-center justify-between text-xs text-(--text-secondary) font-semibold">
          <div className="flex items-center gap-1.5" title="Creation Date">
            <Calendar size={14} />
            <span>{new Date(created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <a
          href={github_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full bg-(--bg-secondary) hover:bg-(--primary) text-(--text-primary) hover:text-(--text-inverse) font-bold py-3.5 rounded-xl border border-(--border) hover:border-transparent flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer shadow-xs select-none"
        >
          View on GitHub
          <ExternalLink size={16} />
        </a>
      </div> */}
    </div>
  );
}
