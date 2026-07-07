import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Rocket, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import {
  fetchHistory,
  fetchGitHubRepos,
  createRepo,
  clearCreatedRepo,
  clearRepoError,
} from "../store/slices/repoSlice.js";
import Navbar from "../components/Navbar.jsx";

function normalizeRepoName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
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
    error,
  } = useSelector((state) => state.repos);

  const [repoName, setRepoName] = useState("my-generated-website");
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState(
    "Website generated from my builder",
  );
  const [templateType] = useState("blank"); // Hardcoded to blank repo creation

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
      dispatch({
        type: "toast/showToast",
        payload: { message: "Please enter a valid repo name.", type: "error" },
      });
      return;
    }

    dispatch(
      createRepo({
        repoName: cleanRepoName,
        isPrivate,
        description,
        templateType,
      }),
    );
  };

  return (
    <div className="w-full">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Form */}
          <div className="lg:col-span-7 bg-(--bg-primary) border border-(--border) rounded-3xl p-8 backdrop-blur-md shadow-lg dark:shadow-2xl">
            <div className="flex gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-(--bg-secondary) border border-(--border) flex items-center justify-center text-(--primary) shrink-0">
                <Rocket size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-(--text-primary)">
                  Create Blank Repository
                </h2>
                <p className="text-(--text-secondary) text-sm mt-1">
                  This repository will be created under{" "}
                  <span className="text-(--primary) font-medium">
                    @{me?.login}
                  </span>
                  .
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRepo} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-(--text-primary) mb-2">
                  Repository Name
                </label>
                <input
                  value={repoName}
                  onChange={(event) => setRepoName(event.target.value)}
                  placeholder="my-generated-website"
                  className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3 text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                />
                <div className="mt-3 px-4 py-2.5 rounded-lg bg-(--bg-secondary) border border-(--border) text-(--text-secondary) text-xs font-mono break-all">
                  Target repo: {me?.login}/
                  <span className="font-bold">
                    {cleanRepoName || "repo-name"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-(--text-primary) mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3 text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(event) => setIsPrivate(event.target.checked)}
                  className="w-4.5 h-4.5 rounded border-(--border) bg-(--bg-secondary) text-(--primary) focus:ring-(--primary) cursor-pointer"
                />
                <label
                  htmlFor="isPrivate"
                  className="text-sm font-semibold text-(--text-primary) select-none cursor-pointer"
                >
                  Create as private repository
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-(--danger-bg) border border-(--danger-border) text-(--danger) text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-bold py-4 rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none shadow-lg shadow-(--primary)/20 cursor-pointer"
              >
                {creating ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Rocket size={20} />
                )}
                {creating
                  ? "Creating Repository..."
                  : "Create Blank Repository"}
              </button>
            </form>
          </div>

          {/* Right Panel: How it works & history stacked */}
          <div className="lg:col-span-5 space-y-6">
            {/* Repository Process Info */}
            <div className="bg-(--bg-secondary) border border-(--border) rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-(--text-primary) mb-4">
                Repository Creation Process
              </h3>
              <ol className="list-decimal list-inside text-sm text-(--text-secondary) space-y-2.5">
                <li>Validate active GitHub session.</li>
                <li>Verify repository name availability.</li>
                <li>Create blank repository on your GitHub account.</li>
              </ol>
            </div>

            {/* Success Alert */}
            {createdRepo && (
              <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--accent) text-(--text-primary) flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="text-(--accent)"
                    size={24}
                  />
                  <span className="font-bold text-(--text-primary)">
                    Repository Created Successfully!
                  </span>
                </div>
                <p className="text-sm text-(--text-secondary) font-mono">
                  {createdRepo.owner}/{createdRepo.repoName}
                </p>
                <a
                  href={createdRepo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-(--primary) font-bold hover:underline"
                >
                  Open on GitHub <ExternalLink size={14} />
                </a>
              </div>
            )}
            
            {/* Generated Website History List */}
            <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-6 backdrop-blur-md shadow-lg">
              <h3 className="text-lg font-bold text-(--text-primary) mb-4">
                Your Generated Repositories
              </h3>
              {historyLoading ? (
                <div className="flex items-center gap-3 text-(--text-secondary) text-sm py-4">
                  <Loader2 className="animate-spin text-(--primary)" size={18} />
                  Loading repository list...
                </div>
              ) : historyRepos.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {historyRepos.map((repo) => (
                    <div
                      key={repo._id}
                      className="p-4 rounded-2xl bg-(--bg-secondary) border border-(--border) flex items-center justify-between gap-4 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-(--text-primary) truncate block">
                            {repo.repoName}
                          </span>
                          {repo.isPrivate ? (
                            <span className="text-[10px] font-bold text-(--danger) bg-(--danger-bg) border border-(--danger-border) px-1.5 py-0.5 rounded">
                              private
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-(--success) bg-(--success-bg) border border-(--success-border) px-1.5 py-0.5 rounded">
                              public
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-(--text-secondary) truncate mt-1">
                          {repo.description || "No description provided"}
                        </p>
                        <span className="text-[10px] text-(--text-secondary) mt-2 block">
                          {new Date(repo.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg) hover:text-(--text-primary) border border-(--border) transition shrink-0"
                        title="Open repo on GitHub"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-(--border) rounded-2xl text-(--text-secondary) text-sm">
                  No repositories created yet.
                </div>
              )}
            </div>
            
            {/* Live GitHub Repositories List */}
            <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-6 backdrop-blur-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-(--text-primary)">
                  Live GitHub Repositories
                </h3>
                <button
                  onClick={() => dispatch(fetchGitHubRepos())}
                  disabled={gitHubLoading}
                  className="text-xs text-(--primary) hover:text-(--primary-hover) font-bold transition select-none disabled:opacity-50 cursor-pointer"
                >
                  {gitHubLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              {gitHubLoading ? (
                <div className="flex items-center gap-3 text-(--text-secondary) text-sm py-4">
                  <Loader2 className="animate-spin text-(--primary)" size={18} />
                  Fetching live GitHub repositories...
                </div>
              ) : allGitHubRepos.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {allGitHubRepos.map((repo) => (
                    <div
                      key={repo.name}
                      className="p-4 rounded-2xl bg-(--bg-secondary) border border-(--border) flex items-center justify-between gap-4 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-(--text-primary) truncate block">
                            {repo.name}
                          </span>
                          {repo.isPrivate ? (
                            <span className="text-[10px] font-bold text-(--danger) bg-(--danger-bg) border border-(--danger-border) px-1.5 py-0.5 rounded">
                              private
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-(--success) bg-(--success-bg) border border-(--success-border) px-1.5 py-0.5 rounded">
                              public
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-(--text-secondary) truncate mt-1">
                          {repo.description || "No description"}
                        </p>
                        <span className="text-[10px] text-(--text-secondary) mt-2 block">
                          Last updated:{" "}
                          {new Date(repo.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg) hover:text-(--text-primary) border border-(--border) transition shrink-0"
                        title="Open repo on GitHub"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-(--border) rounded-2xl text-(--text-secondary) text-sm">
                  No repositories found on GitHub.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
