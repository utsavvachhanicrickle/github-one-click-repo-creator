import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, Search, AlertCircle, FolderGit2, Plus, Rocket, X } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import RepoCard from '../components/RepoCard.jsx';
import { getMyRepos } from '../api/githubApi.js';
import { createRepo } from '../store/slices/repoSlice.js';

function normalizeRepoName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-');
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.auth);

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [repoName, setRepoName] = useState('my-new-repo');
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState('Website generated from my builder');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const cleanRepoName = useMemo(() => normalizeRepoName(repoName), [repoName]);

  const loadRepos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyRepos();
      setRepos(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories from GitHub.');
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
      setRepoName('my-new-repo');
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

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        ) : filteredRepos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filteredRepos.map((repo) => (
              <RepoCard key={`${repo.owner}/${repo.name}`} repo={repo} />
            ))}
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
