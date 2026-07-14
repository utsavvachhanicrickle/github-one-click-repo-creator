import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { GitFork } from "lucide-react";

export default function ForkFamilyCard({ family }) {
  const navigate = useNavigate();
  const { me } = useSelector((state) => state.auth);
  const { parent, forks, summary } = family;

  const myFork = forks.find(
    (f) => me && f.owner.toLowerCase() === me.login.toLowerCase()
  );

  return (
    <div
      onClick={() => navigate(`/id/${me?.unique_id}/fork-families/${parent.owner}/${parent.repo}`)}
      className="bg-(--bg-primary) border border-(--border) rounded-3xl p-6 shadow-xs hover:border-(--primary) hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer select-none group relative overflow-hidden text-left"
    >
      <div className="absolute inset-0 bg-linear-to-tr from-(--primary) to-(--accent) opacity-0 group-hover:opacity-[0.01] transition-opacity duration-300 pointer-events-none" />
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-black text-(--primary) tracking-wider flex items-center gap-1">
            <GitFork size={10} />
            Fork Family Group
          </span>
          <h3 className="text-lg font-black text-(--text-primary) group-hover:text-(--primary) transition duration-200 truncate max-w-[280px]">
            {myFork.fullName}
          </h3>
          {myFork && (
            <p className="text-xs font-semibold text-(--text-secondary) select-none">
              Fork From: <span className="font-bold text-(--primary)">{parent.fullName}</span>
            </p>
          )}
          <p className="text-[10px] text-(--text-secondary) font-mono">
            Default Branch: <span className="font-bold text-(--text-primary)">{parent.defaultBranch}</span>
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-(--primary)/10 text-(--primary) text-[11px] font-black shrink-0">
          {summary.totalForks} {summary.totalForks === 1 ? 'Fork' : 'Forks'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-(--border)/60 text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <span className="font-bold">Same</span>
          <span className="font-black text-sm">{summary.same}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-(--primary)/5 border border-(--primary)/10 text-(--primary)">
          <span className="font-bold">Ahead</span>
          <span className="font-black text-sm">{summary.ahead}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400">
          <span className="font-bold">Behind</span>
          <span className="font-black text-sm">{summary.behind}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500">
          <span className="font-bold">Diverged</span>
          <span className="font-black text-sm">{summary.diverged}</span>
        </div>
      </div>
    </div>
  );
}
