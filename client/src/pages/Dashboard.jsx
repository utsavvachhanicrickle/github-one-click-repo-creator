import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Rocket, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { fetchHistory, fetchGitHubRepos, createRepo, clearCreatedRepo, clearRepoError } from '../store/slices/repoSlice.js';
import Navbar from '../components/Navbar.jsx';

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
  const { 
    historyRepos, 
    historyLoading, 
    allGitHubRepos, 
    gitHubLoading, 
    creating, 
    createdRepo, 
    error 
  } = useSelector((state) => state.repos);

  const [repoName, setRepoName] = useState('my-generated-website');
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState('Website generated from my builder');
  const [templateType] = useState('blank'); // Hardcoded to blank repo creation

  const cleanRepoName = useMemo(() => normalizeRepoName(repoName), [repoName]);

  useEffect(() => {
    dispatch(fetchHistory());
    dispatch(fetchGitHubRepos());

    // Cleanup created repo state on unmount
    return () => {
      dispatch(clearCreatedRepo());
      dispatch(clearRepoError());
    };
  }, [dispatch]);

  const handleCreateRepo = (event) => {
    event.preventDefault();
    dispatch(clearRepoError());
    dispatch(clearCreatedRepo());

    if (cleanRepoName.length < 3) {
      dispatch({ type: 'toast/showToast', payload: { message: 'Please enter a valid repo name.', type: 'error' } });
      return;
    }

    dispatch(createRepo({
      repoName: cleanRepoName,
      isPrivate,
      description,
      templateType
    }));
  };

  return (
    <div className="w-full">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-lg dark:shadow-2xl">
            <div className="flex gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-550/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Rocket size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create Blank Repository</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  This repository will be created under <span className="text-indigo-600 dark:text-indigo-400 font-medium">@{me?.login}</span>.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRepo} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Repository Name
                </label>
                <input
                  value={repoName}
                  onChange={(event) => setRepoName(event.target.value)}
                  placeholder="my-generated-website"
                  className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                />
                <div className="mt-3 px-4 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-750 dark:text-indigo-300 text-xs font-mono break-all">
                  Target repo: {me?.login}/<span className="font-bold">{cleanRepoName || 'repo-name'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="isPrivate" className="text-sm font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                  Create as private repository
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                {creating ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
                {creating ? 'Creating Repository...' : 'Create Blank Repository'}
              </button>
            </form>
          </div>

          {/* Right Panel: How it works & history stacked */}
          <div className="lg:col-span-5 space-y-6">
            {/* Repository Process Info */}
            <div className="bg-slate-200/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Repository Creation Process</h3>
              <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-2.5">
                <li>Validate active GitHub session.</li>
                <li>Verify repository name availability.</li>
                <li>Create blank repository on your GitHub account.</li>
              </ol>
            </div>

            {/* Success Alert */}
            {createdRepo && (
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
                  <span className="font-bold text-slate-900 dark:text-white">Repository Created Successfully!</span>
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-mono">
                  {createdRepo.owner}/{createdRepo.repoName}
                </p>
                <a
                  href={createdRepo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-white font-bold hover:underline"
                >
                  Open on GitHub <ExternalLink size={14} />
                </a>
              </div>
            )}

            {/* Live GitHub Repositories List */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live GitHub Repositories</h3>
                <button 
                  onClick={() => dispatch(fetchGitHubRepos())} 
                  disabled={gitHubLoading}
                  className="text-xs text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold transition select-none disabled:opacity-50 cursor-pointer"
                >
                  {gitHubLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {gitHubLoading ? (
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm py-4">
                  <Loader2 className="animate-spin text-indigo-500" size={18} />
                  Fetching live GitHub repositories...
                </div>
              ) : allGitHubRepos.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {allGitHubRepos.map((repo) => (
                    <div
                      key={repo.name}
                      className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/65 flex items-center justify-between gap-4 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-850 dark:text-slate-200 truncate block">
                            {repo.name}
                          </span>
                          {repo.isPrivate ? (
                            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                              private
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              public
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                          {repo.description || 'No description'}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block">
                          Last updated: {new Date(repo.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-200 dark:bg-slate-900 hover:bg-slate-350 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition shrink-0"
                        title="Open repo on GitHub"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 text-sm">
                  No repositories found on GitHub.
                </div>
              )}
            </div>

            {/* Generated Website History List */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-md shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Your Generated Websites</h3>
              {historyLoading ? (
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm py-4">
                  <Loader2 className="animate-spin text-indigo-500" size={18} />
                  Loading repository list...
                </div>
              ) : historyRepos.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {historyRepos.map((repo) => (
                    <div
                      key={repo._id}
                      className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/65 flex items-center justify-between gap-4 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-850 dark:text-slate-200 truncate block">
                            {repo.repoName}
                          </span>
                          {repo.isPrivate ? (
                            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                              private
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              public
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                          {repo.description || 'No description provided'}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block">
                          {new Date(repo.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-200 dark:bg-slate-900 hover:bg-slate-350 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition shrink-0"
                        title="Open repo on GitHub"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 text-sm">
                  No repositories created yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
