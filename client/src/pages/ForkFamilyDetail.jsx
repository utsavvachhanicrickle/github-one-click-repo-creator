import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GitFork,
  ExternalLink,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Github
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { getForkFamilies, getRepoBranches, compareForkBranch, mergeForkBranch } from '../services/github.service.js';
import { useSelector } from 'react-redux';

// Helper to render status badge
const renderStatusBadge = (status) => {
  switch (status) {
    case 'same':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle size={12} /> Up to Date
        </span>
      );
    case 'ahead':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <ArrowUpCircle size={12} /> Ahead
        </span>
      );
    case 'behind':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <ArrowDownCircle size={12} /> Behind Parent
        </span>
      );
    case 'diverged':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
          <AlertTriangle size={12} /> Diverged
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
          <AlertCircle size={12} /> Unknown Status
        </span>
      );
  }
};

// Reactive Fork Row Component allowing custom branch comparisons
function ForkRow({ fork, parent }) {
  const navigate = useNavigate();

  const [parentBranch, setParentBranch] = useState(parent.defaultBranch);
  const [forkBranch, setForkBranch] = useState(fork.branch);
  const [parentBranches, setParentBranches] = useState([]);
  const [forkBranches, setForkBranches] = useState([]);

  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState('');

  // Localized comparison parameters initialized from endpoints
  const [status, setStatus] = useState(fork.status);
  const [aheadBy, setAheadBy] = useState(fork.aheadBy);
  const [behindBy, setBehindBy] = useState(fork.behindBy);
  const [changedFilesCount, setChangedFilesCount] = useState(fork.changedFilesCount);

  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState('');

  useEffect(() => {
    async function fetchBranches() {
      try {
        const [pBranches, fBranches] = await Promise.all([
          getRepoBranches(parent.owner, parent.repo),
          getRepoBranches(fork.owner, fork.repo)
        ]);
        setParentBranches(pBranches || []);
        setForkBranches(fBranches || []);
      } catch (err) {
        console.warn(`[fork-families] Failed to fetch branch lists for row ${fork.fullName}:`, err.message);
      }
    }
    fetchBranches();
  }, [parent, fork]);

  const triggerComparison = async (pBranch, fBranch) => {
    setCompLoading(true);
    setCompError('');
    try {
      const result = await compareForkBranch(
        parent.owner,
        parent.repo,
        pBranch,
        fork.owner,
        fork.repo,
        fBranch
      );
      setStatus(result.status);
      setAheadBy(result.aheadBy);
      setBehindBy(result.behindBy);
      setChangedFilesCount(result.changedFilesCount);
    } catch (err) {
      setCompError(err.message || 'Comparison check failed.');
      setStatus('unknown');
    } finally {
      setCompLoading(false);
    }
  };

  const handleSyncFork = async () => {
    setMergeLoading(true);
    setMergeSuccess('');
    setCompError('');
    try {
      const res = await mergeForkBranch(
        parent.owner,
        parent.repo,
        parentBranch,
        fork.owner,
        fork.repo,
        forkBranch
      );
      setMergeSuccess(res.message || 'Fork synced successfully!');
      await triggerComparison(parentBranch, forkBranch);
    } catch (err) {
      setCompError(err.message || 'Failed to sync fork.');
    } finally {
      setMergeLoading(false);
    }
  };

  const handleParentBranchChange = (e) => {
    const nextVal = e.target.value;
    setParentBranch(nextVal);
    triggerComparison(nextVal, forkBranch);
  };

  const handleForkBranchChange = (e) => {
    const nextVal = e.target.value;
    setForkBranch(nextVal);
    triggerComparison(parentBranch, nextVal);
  };

  return (
    <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:shadow-xs transition duration-200 text-left">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h4 className="text-lg font-black text-(--text-primary)">
            {fork.fullName}
          </h4>
          {compLoading ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-(--primary)/5 text-(--primary) border border-(--primary)/10">
              <Loader2 size={12} className="animate-spin" /> Comparing...
            </span>
          ) : (
            renderStatusBadge(status)
          )}
        </div>

        {/* Dynamic Branch Dropdowns Selection */}
        <div className="flex flex-wrap items-center gap-4 text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-(--text-secondary) uppercase tracking-wider text-[10px]">Base Parent Branch:</span>
            <select
              value={parentBranch}
              onChange={handleParentBranchChange}
              disabled={compLoading}
              className="bg-(--bg-secondary) text-(--text-primary) border border-(--border) rounded-xl px-3 py-1.5 focus:outline-none focus:border-(--primary) font-semibold"
            >
              {parentBranches.length === 0 ? (
                <option value={parent.defaultBranch}>{parent.defaultBranch}</option>
              ) : (
                parentBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-(--text-secondary) uppercase tracking-wider text-[10px]">Head Fork Branch:</span>
            <select
              value={forkBranch}
              onChange={handleForkBranchChange}
              disabled={compLoading}
              className="bg-(--bg-secondary) text-(--text-primary) border border-(--border) rounded-xl px-3 py-1.5 focus:outline-none focus:border-(--primary) font-semibold"
            >
              {forkBranches.length === 0 ? (
                <option value={fork.branch}>{fork.branch}</option>
              ) : (
                forkBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {compError && (
          <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
            <AlertCircle size={12} /> {compError}
          </p>
        )}

        {mergeSuccess && (
          <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
            <CheckCircle size={12} /> {mergeSuccess}
          </p>
        )}

        {/* Commits comparison info */}
        {status !== 'unknown' && !compLoading && (
          <div className="flex gap-4 items-center text-xs text-(--text-secondary) mt-2 flex-wrap">
            <span className="flex items-center gap-1 font-semibold">
              Ahead by: <strong className="text-(--text-primary) font-black">{aheadBy}</strong> commits
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-(--border)" />
            <span className="flex items-center gap-1 font-semibold">
              Behind by: <strong className="text-(--text-primary) font-black">{behindBy}</strong> commits
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-(--border)" />
            <span className="flex items-center gap-1 font-semibold">
              Modified files: <strong className="text-(--text-primary) font-black">{changedFilesCount}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        {/* Sync Fork button (enabled when behind or diverged) */}
        {(status === 'behind' || status === 'diverged') && (
          <button
            onClick={handleSyncFork}
            disabled={mergeLoading || compLoading}
            className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-xs font-black transition active:scale-95 shadow-md shadow-emerald-600/10 select-none cursor-pointer"
          >
            {mergeLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <CheckCircle size={12} />
                Sync Fork
              </>
            )}
          </button>
        )}

        {/* Create Pull Request button (enabled when ahead or diverged) */}
        {(status === 'ahead' || status === 'diverged') && (
          <a
            href={`https://github.com/${parent.owner}/${parent.repo}/compare/${parentBranch}...${fork.owner}:${forkBranch}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition active:scale-95 shadow-md shadow-indigo-600/10 select-none"
          >
            <GitFork size={12} />
            Create PR
            <ExternalLink size={12} />
          </a>
        )}

        <a
          href={fork.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-black text-(--text-primary) hover:border-(--primary) hover:text-(--primary) transition active:scale-95 select-none"
        >
          Open GitHub
          <ExternalLink size={12} />
        </a>
        <button
          onClick={() => navigate(`/dashboard/repos/${fork.owner}/${fork.repo}`)}
          className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-(--primary) text-(--text-inverse) text-xs font-black hover:bg-(--primary-hover) transition active:scale-95 shadow-md shadow-(--primary)/10 select-none"
        >
          <Eye size={12} />
          View Fork Detail
        </button>
      </div>
    </div>
  );
}

export default function ForkFamilyDetail() {
  const { parentOwner, parentRepo } = useParams();
  const navigate = useNavigate();

  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { me } = useSelector((state) => state.auth);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const families = await getForkFamilies();
      
      const matched = families.find(
        (fam) =>
          fam.parent.owner.toLowerCase() === parentOwner.toLowerCase() &&
          fam.parent.repo.toLowerCase() === parentRepo.toLowerCase()
      );

      if (matched) {
        setFamily(matched);
      } else {
        setError(`No fork family group found for parent repository ${parentOwner}/${parentRepo}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve fork family data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [parentOwner, parentRepo]);

  return (
    <div className="w-full min-h-screen bg-(--bg) pb-12">
      <div className="max-w-7xl mx-auto px-6 mt-12 relative z-10">
        {/* Back navigation & Header */}
        <button
          onClick={() => navigate(`/id/${me?.unique_id}`)}
          className="flex items-center gap-2 text-xs font-black text-(--text-secondary) hover:text-(--primary) transition mb-6 group select-none uppercase tracking-wider"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-(--text-secondary) gap-3 select-none">
            <Loader2 className="animate-spin text-(--primary)" size={36} />
            <span className="font-extrabold text-sm">Analyzing fork family configurations...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-(--danger-bg) border border-(--danger-border) text-(--danger) flex items-start gap-3 max-w-2xl mx-auto select-none">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-extrabold text-sm">Error Loading Fork Family</p>
              <p className="text-xs mt-1 leading-relaxed">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 px-4 py-1.5 rounded-lg bg-(--danger) text-white font-bold text-xs hover:opacity-90 active:scale-95 transition"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-8 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-(--primary)/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12 flex-1">
                  
                  {/* Original Repository */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-(--primary) tracking-wider flex items-center gap-1 select-none">
                      <GitFork size={10} />
                      Original Repository (Parent)
                    </span>
                    <h2 className="text-2xl font-black text-(--text-primary) tracking-tight">
                      {family.parent.fullName}
                    </h2>
                    <p className="text-xs text-(--text-secondary) font-semibold">
                      Branch: <span className="font-mono bg-(--bg-secondary) px-2 py-0.5 rounded text-(--text-primary) font-bold">{family.parent.defaultBranch}</span>
                    </p>
                  </div>

                  {/* Flow Arrow Connection */}
                  {family.forks.find((f) => me && f.owner.toLowerCase() === me.github_login.toLowerCase()) && (
                    <div className="hidden sm:flex items-center text-(--text-secondary) select-none">
                      <div className="w-8 h-[2px] bg-(--border) relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 border-t-2 border-r-2 border-(--border)" />
                      </div>
                    </div>
                  )}

                  {/* Your Forked Repository */}
                  {(() => {
                    const myFork = family.forks.find((f) => me && f.owner.toLowerCase() === me.github_login.toLowerCase());
                    return myFork ? (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider flex items-center gap-1 select-none">
                          <CheckCircle size={10} />
                          Your Repository (Fork)
                        </span>
                        <h2 className="text-2xl font-black text-(--text-primary) tracking-tight">
                          {myFork.fullName}
                        </h2>
                        <p className="text-xs text-(--text-secondary) font-semibold">
                          Branch: <span className="font-mono bg-(--bg-secondary) px-2 py-0.5 rounded text-(--text-primary) font-bold">{myFork.branch}</span>
                        </p>
                      </div>
                    ) : null;
                  })()}

                </div>

                <a
                  href={family.parent.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-(--border) bg-(--bg-secondary) text-sm font-black text-(--text-primary) hover:border-(--primary) hover:text-(--primary) transition active:scale-98 select-none shrink-0"
                >
                  <Github size={16} />
                  View Original GitHub
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Group stats summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8 pt-8 border-t border-(--border)/60 text-center">
                <div className="p-3 bg-(--bg-secondary) rounded-2xl border border-(--border)/40">
                  <p className="text-[10px] text-(--text-secondary) font-black uppercase tracking-wider">Total Forks</p>
                  <p className="text-2xl font-black text-(--text-primary) mt-1">{family.summary.totalForks}</p>
                </div>
                <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <p className="text-[10px] font-black uppercase tracking-wider">Up to Date</p>
                  <p className="text-2xl font-black mt-1">{family.summary.same}</p>
                </div>
                <div className="p-3 bg-(--primary)/5 rounded-2xl border border-(--primary)/10 text-(--primary)">
                  <p className="text-[10px] font-black uppercase tracking-wider">Ahead</p>
                  <p className="text-2xl font-black mt-1">{family.summary.ahead}</p>
                </div>
                <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-amber-600 dark:text-amber-400">
                  <p className="text-[10px] font-black uppercase tracking-wider">Behind</p>
                  <p className="text-2xl font-black mt-1">{family.summary.behind}</p>
                </div>
                <div className="p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-rose-500">
                  <p className="text-[10px] font-black uppercase tracking-wider">Diverged</p>
                  <p className="text-2xl font-black mt-1">{family.summary.diverged}</p>
                </div>
              </div>
            </div>

            {/* List of Forks */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-(--text-primary) tracking-tight flex items-center gap-2">
                <GitFork size={18} className="text-(--primary)" />
                Connected Fork Repositories
              </h3>

              <div className="space-y-4">
                {family.forks.map((fork) => (
                  <ForkRow key={fork.fullName} fork={fork} parent={family.parent} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
