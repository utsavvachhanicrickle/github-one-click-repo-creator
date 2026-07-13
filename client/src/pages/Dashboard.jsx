import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, AlertCircle, FolderGit2, Plus, Rocket, X, GitFork, CheckCircle, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import RepoCard from '../components/RepoCard.jsx';
import { getMyRepos, getForkFamilies } from '../api/githubApi.js';
import { createRepo } from '../store/slices/repoSlice.js';

function normalizeRepoName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-');
}

function ForkFamilyCard({ family }) {
  const navigate = useNavigate();
  const { parent, summary } = family;

  return (
    <div
      onClick={() => navigate(`/dashboard/fork-families/${parent.owner}/${parent.repo}`)}
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
            {parent.fullName}
          </h3>
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

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { me } = useSelector((state) => state.auth);

  const [repos, setRepos] = useState([]);
  const [forkFamilies, setForkFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getUniqueSuggestedRepoName = () => 'repo-' + Math.floor(100000 + Math.random() * 900000);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [repoName, setRepoName] = useState(getUniqueSuggestedRepoName);
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState('Website generated from my builder');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const cleanRepoName = useMemo(() => normalizeRepoName(repoName), [repoName]);

  const loadRepos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [reposData, forksData] = await Promise.all([
        getMyRepos(),
        getForkFamilies()
      ]);
      
      setRepos(reposData || []);
      setForkFamilies(forksData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data from GitHub.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (cleanRepoName.length < 3) {
      setCreateError('Repository name must be at least 3 characters.');
      return;
    }

    try {
      setCreating(true);
      await dispatch(createRepo({
        repoName: cleanRepoName,
        isPrivate,
        description,
        templateType: 'blank'
      })).unwrap();

      // On success, reset form, close modal, and refresh list
      setRepoName(getUniqueSuggestedRepoName());
      setIsPrivate(false);
      setDescription('Website generated from my builder');
      setShowModal(false);
      await loadRepos();
    } catch (err) {
      setCreateError(err || 'Failed to create repository.');
    } finally {
      setCreating(false);
    }
  };

  const forkRepoNames = useMemo(() => {
    return new Set(
      forkFamilies.flatMap((family) => family.forks.map((f) => `${f.owner}/${f.repo}`))
    );
  }, [forkFamilies]);

  const normalRepos = useMemo(() => {
    return repos.filter((r) => !forkRepoNames.has(`${r.owner}/${r.name}`));
  }, [repos, forkRepoNames]);

  const filteredNormalRepos = useMemo(() => {
    return normalRepos.filter((repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [normalRepos, searchQuery]);

  const filteredForkFamilies = useMemo(() => {
    return forkFamilies.filter((family) =>
      family.parent.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [forkFamilies, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-(--bg) pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 mt-12 relative z-10">
        {/* Dashboard Title & Stats */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 select-none">
          <div>
            <h2 className="text-3xl font-black text-(--text-primary) tracking-tight">
              Your GitHub Repositories
            </h2>
            <p className="text-xs text-(--text-secondary) mt-1.5 font-semibold">
              Select a repository to manage files, branches, and commits.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
            {/* Repository search input */}
            <div className="relative w-full sm:w-64 md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-secondary)">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories..."
                className="w-full bg-(--bg-primary) border border-(--border) rounded-2xl pl-10 pr-4 py-3 text-sm text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition shadow-xs"
              />
            </div>

            {/* Create Repository Button */}
            <button
              onClick={() => setShowModal(true)}
              className="bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-extrabold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-(--primary)/10 select-none text-sm shrink-0"
            >
              <Plus size={18} />
              Create Repository
            </button>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-(--text-secondary) gap-3 select-none">
            <Loader2 className="animate-spin text-(--primary)" size={32} />
            <span className="font-extrabold text-sm">Loading your GitHub repositories...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-(--danger-bg) border border-(--danger-border) text-(--danger) flex items-start gap-3 select-none">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-extrabold text-sm">Error Loading Repositories</p>
              <p className="text-xs mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : (filteredNormalRepos.length > 0 || filteredForkFamilies.length > 0) ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Fork Families Section */}
            {filteredForkFamilies.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-(--border)/60">
                  <GitFork size={20} className="text-(--primary)" />
                  <h3 className="text-xl font-black text-(--text-primary) tracking-tight">Fork Families</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredForkFamilies.map((family) => (
                    <ForkFamilyCard key={family.parent.fullName} family={family} />
                  ))}
                </div>
              </div>
            )}

            {/* Independent Repositories Section */}
            {filteredNormalRepos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-(--border)/60">
                  <FolderGit2 size={20} className="text-(--primary)" />
                  <h3 className="text-xl font-black text-(--text-primary) tracking-tight">Independent Repositories</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNormalRepos.map((repo) => (
                    <RepoCard key={`${repo.owner}/${repo.name}`} repo={repo} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-(--border) rounded-3xl p-16 text-center text-(--text-secondary) bg-(--bg-primary)/40 select-none">
            <FolderGit2 className="mx-auto mb-3 text-(--text-secondary)/60" size={40} />
            <p className="font-extrabold text-base text-(--text-primary)">No Repositories Found</p>
            <p className="text-xs mt-1">
              {searchQuery ? `No matches found for "${searchQuery}".` : 'You do not have any repositories in your GitHub account yet.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Create Repository Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-(--bg-primary) border border-(--border) shadow-[0_10px_50px_rgba(0,0,0,0.15)] w-full max-w-[500px] rounded-[24px] overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 select-none">
              <h3 className="text-xl font-black text-(--text-primary) flex items-center gap-2">
                <Rocket size={20} className="text-(--primary)" />
                Create Blank Repository
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCreateError('');
                  setRepoName(getUniqueSuggestedRepoName());
                }}
                disabled={creating}
                className="text-(--text-secondary) hover:text-(--text-primary) hover:scale-110 active:scale-95 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRepo} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-(--text-primary) mb-2 select-none">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-new-repo"
                  disabled={creating}
                  className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3 text-sm text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                />
                <div className="mt-2.5 px-3 py-2 rounded-lg bg-(--bg-secondary) border border-(--border) text-(--text-secondary) text-[11px] font-mono break-all select-none">
                  Target: {me?.login}/<span className="font-bold text-(--text-primary)">{cleanRepoName || 'repo-name'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-(--text-primary) mb-2 select-none">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Repository description..."
                  rows={3}
                  disabled={creating}
                  className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3 text-sm text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition resize-none"
                />
              </div>

              <div className="flex items-center gap-3 select-none">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={creating}
                  className="w-4.5 h-4.5 rounded border-(--border) bg-(--bg-secondary) text-(--primary) focus:ring-(--primary) cursor-pointer"
                />
                <label
                  htmlFor="isPrivate"
                  className="text-xs font-bold text-(--text-primary) cursor-pointer"
                >
                  Create as private repository
                </label>
              </div>

              {createError && (
                <div className="p-3.5 rounded-xl bg-(--danger-bg) border border-(--danger-border) text-(--danger) text-xs font-semibold select-none flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-(--border) select-none">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setCreateError('');
                    setRepoName(getUniqueSuggestedRepoName());
                  }}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-xl border border-(--border) bg-(--bg-primary) text-xs font-bold text-(--text-secondary) hover:bg-(--bg-secondary) transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-(--primary) hover:bg-(--primary-hover) disabled:opacity-60 disabled:cursor-not-allowed text-(--text-inverse) text-xs font-extrabold transition cursor-pointer shadow-md shadow-(--primary)/10 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Creating...
                    </>
                  ) : (
                    'Create Repository'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
