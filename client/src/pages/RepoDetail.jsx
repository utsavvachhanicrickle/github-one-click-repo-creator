import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Github, GitBranch, ShieldAlert, CheckCircle2, ExternalLink, Plus, X, Rocket } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import BranchSelector from '../components/BranchSelector.jsx';
import FolderUpload from '../components/FolderUpload.jsx';
import ChangesPreview from '../components/ChangesPreview.jsx';
import { getRepoBranches, compareFolderUpload, commitFolderUpload, createRepoBranch, renameRemoteFlutterApp } from '../services/github.service.js';

function getCleanRelativePath(file) {
  const cleanPath = (file.webkitRelativePath || file.name).replace(/\\/g, '/');
  const parts = cleanPath.split('/');
  if (parts.length > 1) {
    return parts.slice(1).join('/');
  }
  return cleanPath;
}

export default function RepoDetail() {
  const { owner, repo } = useParams();
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchesLoading, setBranchesLoading] = useState(true);
  
  const [files, setFiles] = useState([]);
  const [fileStats, setFileStats] = useState(null);
  
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  
  const [includeDeletions, setIncludeDeletions] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

  // Active workspace tab state ('upload' | 'flutter-rename')
  const [activeTab, setActiveTab] = useState('upload');

  // Flutter App Rename State
  const [flutterAppName, setFlutterAppName] = useState('');
  const [selectedPaths, setSelectedPaths] = useState(new Set());

  const handleTogglePath = (path) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Create Branch States
  const [showNewBranchInput, setShowNewBranchInput] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [creatingBranch, setCreatingBranch] = useState(false);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    const cleanName = newBranchName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._/-]/g, '');
    if (!cleanName) return;

    try {
      setCreatingBranch(true);
      setError('');
      
      await createRepoBranch(owner, repo, cleanName, selectedBranch || 'main');
      
      // Refresh branches list
      const branchList = await getRepoBranches(owner, repo);
      setBranches(branchList);
      
      // Select the new branch
      setSelectedBranch(cleanName);
      
      // Reset form
      setNewBranchName('');
      setShowNewBranchInput(false);
    } catch (err) {
      setError(err.message || 'Failed to create new branch.');
    } finally {
      setCreatingBranch(false);
    }
  };

  const [renamingRemote, setRenamingRemote] = useState(false);

  const handleRemoteRename = async () => {
    if (!flutterAppName.trim()) {
      setError('Please enter a new Flutter application name first.');
      return;
    }
    try {
      setRenamingRemote(true);
      setError('');
      setSuccessResult(null);
      setComparisonResult(null);

      const result = await renameRemoteFlutterApp(owner, repo, selectedBranch, flutterAppName.trim());
      setSuccessResult(result);
      setFlutterAppName('');
    } catch (err) {
      setError(err.message || 'Failed to rename remote Flutter application.');
    } finally {
      setRenamingRemote(false);
    }
  };

  useEffect(() => {
    async function loadBranches() {
      try {
        setBranchesLoading(true);
        setError('');
        const branchList = await getRepoBranches(owner, repo);
        setBranches(branchList);
        if (branchList.length > 0) {
          const defaultBr = branchList.includes('main') ? 'main' : (branchList.includes('master') ? 'master' : branchList[0]);
          setSelectedBranch(defaultBr);
        } else {
          setSelectedBranch('main');
        }
      } catch (err) {
        setError(err.message || 'Failed to load repository branches.');
      } finally {
        setBranchesLoading(false);
      }
    }
    loadBranches();
  }, [owner, repo]);

  const handleFolderSelect = (validFiles, stats) => {
    setFiles(validFiles);
    setFileStats(stats);
    setComparisonResult(null);
    setSuccessResult(null);
    setError('');
  };

  const handleCompare = async () => {
    if (files.length === 0) {
      setError('Please select a folder to upload first.');
      return;
    }
    try {
      setComparing(true);
      setError('');
      setComparisonResult(null);
      setSuccessResult(null);

      const formData = new FormData();
      formData.append('branch', selectedBranch);
      formData.append('includeDeletions', includeDeletions.toString());
      formData.append('flutterAppName', flutterAppName.trim());
      
      const relativePaths = [];
      files.forEach((file) => {
        formData.append('files', file);
        relativePaths.push(getCleanRelativePath(file));
      });
      formData.append('paths', JSON.stringify(relativePaths));

      const result = await compareFolderUpload(owner, repo, formData);
      setComparisonResult(result.summary);

      // Select all files by default
      const allPaths = new Set([
        ...result.summary.added,
        ...result.summary.modified,
        ...result.summary.deleted
      ]);
      setSelectedPaths(allPaths);

      // Auto-prefill unique commit message suggestion
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCommitMessage(`Sync upload - ${timeStr}`);
    } catch (err) {
      setError(err.message || 'Failed to compare local folder with GitHub branch.');
    } finally {
      setComparing(false);
    }
  };

  const handleCommit = async () => {
    try {
      setCommitting(true);
      setError('');

      const formData = new FormData();
      formData.append('branch', selectedBranch);
      formData.append('commitMessage', commitMessage.trim() || 'Upload project files from dashboard');
      formData.append('includeDeletions', includeDeletions.toString());
      formData.append('flutterAppName', flutterAppName.trim());

      const relativePaths = [];
      files.forEach((file) => {
        const cleanPath = getCleanRelativePath(file);
        if (selectedPaths.has(cleanPath)) {
          formData.append('files', file);
          relativePaths.push(cleanPath);
        }
      });
      formData.append('paths', JSON.stringify(relativePaths));
      formData.append('selectedPaths', JSON.stringify(Array.from(selectedPaths)));

      const result = await commitFolderUpload(owner, repo, formData);
      setSuccessResult(result);
      setFiles([]);
      setFileStats(null);
      setComparisonResult(null);
      setSelectedPaths(new Set());
      setCommitMessage('');
    } catch (err) {
      setError(err.message || 'Failed to commit and push changes.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-(--bg) pb-12">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 mt-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-(--text-secondary) hover:text-(--primary) transition duration-200 ease-in-out mb-6 select-none"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Repository Header Card */}
        <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-8 mb-8 shadow-xs relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-tr from-(--primary) to-(--accent) opacity-[0.02] pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <h2 className="text-3xl font-black text-(--text-primary) tracking-tight mb-2">
                {repo}
              </h2>
              <p className="text-xs text-(--text-secondary) font-mono">
                Owner: <span className="font-semibold text-(--text-primary)">@{owner}</span>
              </p>
            </div>
            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-(--bg-secondary) hover:bg-(--bg-active) border border-(--border) text-(--text-primary) font-bold px-5 py-3 rounded-2xl transition duration-200 ease-in-out text-sm select-none"
            >
              <Github size={18} />
              Open on GitHub
            </a>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-(--danger-bg) border border-(--danger-border) text-(--danger) text-sm mb-8 flex items-start gap-3 select-none">
            <ShieldAlert className="shrink-0 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}

        {successResult && (
          <div className="p-6 rounded-3xl bg-(--success-bg) border border-(--success-border) text-(--text-primary) mb-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="text-(--success) shrink-0" size={24} />
              <span className="font-extrabold text-lg">Push Completed Successfully!</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-(--text-secondary)">
                Successfully created one Git commit with all changes and updated the branch.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-(--bg-primary) border border-(--border) text-xs select-none">
                <div>
                  <span className="text-(--text-secondary) block mb-1">Files Added</span>
                  <span className="text-base font-extrabold text-(--success)">+{successResult.summary.added}</span>
                </div>
                <div>
                  <span className="text-(--text-secondary) block mb-1">Files Modified</span>
                  <span className="text-base font-extrabold text-amber-500">~{successResult.summary.modified}</span>
                </div>
                <div>
                  <span className="text-(--text-secondary) block mb-1">Files Deleted</span>
                  <span className="text-base font-extrabold text-(--danger)">-{successResult.summary.deleted}</span>
                </div>
                <div>
                  <span className="text-(--text-secondary) block mb-1">Unchanged files</span>
                  <span className="text-base font-extrabold text-(--text-primary)">{successResult.summary.unchanged}</span>
                </div>
              </div>

              {successResult.summary.renamedTo && (
                <div className="p-4 rounded-2xl bg-(--primary)/10 border border-(--primary)/20 text-xs font-bold text-(--primary) flex items-center gap-2 select-none">
                  <Rocket size={16} />
                  <span>Flutter application renamed to: <span className="font-mono text-xs underline bg-(--bg-secondary) px-2 py-0.5 rounded-md text-(--text-primary)">{successResult.summary.renamedTo}</span></span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2 select-none">
                <a
                  href={successResult.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-(--primary) text-(--text-inverse) hover:bg-(--primary-hover) font-bold py-3.5 rounded-xl transition duration-200 ease-in-out text-xs shadow-xs"
                >
                  View Commit <ExternalLink size={14} />
                </a>
                <a
                  href={successResult.branchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-(--bg-secondary) hover:bg-(--bg-active) text-(--text-primary) font-bold py-3.5 rounded-xl border border-(--border) transition duration-200 ease-in-out text-xs"
                >
                  Browse Branch <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Inputs Column */}
          <div className="md:col-span-6 space-y-6">
            <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-6 shadow-xs space-y-6">
              {branchesLoading ? (
                <div className="flex items-center gap-3 text-sm text-(--text-secondary) py-4 select-none">
                  <Loader2 className="animate-spin text-(--primary)" size={20} />
                  Loading branches...
                </div>
              ) : (
                <div className="space-y-3">
                  <BranchSelector
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onSelectBranch={setSelectedBranch}
                    loading={committing || comparing}
                  />

                  {/* Create Branch Option */}
                  {!showNewBranchInput ? (
                    <button
                      onClick={() => setShowNewBranchInput(true)}
                      disabled={committing || comparing}
                      className="text-xs font-bold text-(--primary) hover:text-(--primary-hover) flex items-center gap-1.5 transition select-none disabled:opacity-50 cursor-pointer"
                    >
                      <Plus size={14} />
                      Create New Branch
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-(--bg-secondary)/40 border border-(--border) space-y-3 animate-in slide-in-from-top-1 duration-200">
                      <div className="flex justify-between items-center select-none">
                        <span className="text-xs font-bold text-(--text-primary)">
                          Create New Branch
                        </span>
                        <button
                          onClick={() => {
                            setShowNewBranchInput(false);
                            setNewBranchName('');
                          }}
                          className="text-(--text-secondary) hover:text-(--text-primary)"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          placeholder="new-branch-name"
                          className="flex-1 bg-(--bg-primary) border border-(--border) rounded-xl px-3 py-2 text-xs text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                        />
                        <button
                          onClick={handleCreateBranch}
                          disabled={creatingBranch || !newBranchName.trim()}
                          className="bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-extrabold px-3 py-2 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {creatingBranch ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                      <p className="text-[10px] text-(--text-secondary) font-mono select-none">
                        Base branch: <span className="font-bold text-(--text-primary)">{selectedBranch}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Workspace Tabs */}
              <div className="flex border-b border-(--border) select-none pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-black border-b-2 transition duration-200 cursor-pointer ${
                    activeTab === 'upload'
                      ? 'border-(--primary) text-(--primary)'
                      : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
                  }`}
                >
                  Upload Project Folder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('flutter-rename');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-black border-b-2 transition duration-200 cursor-pointer ${
                    activeTab === 'flutter-rename'
                      ? 'border-(--primary) text-(--primary)'
                      : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
                  }`}
                >
                  Rename Flutter App (Remote)
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <FolderUpload onFolderSelect={handleFolderSelect} />

                  {/* Flutter App Rename Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-(--text-primary) select-none">
                      Flutter App Rename (Optional)
                    </label>
                    <input
                      type="text"
                      value={flutterAppName}
                      onChange={(e) => {
                        setFlutterAppName(e.target.value);
                        setComparisonResult(null);
                      }}
                      placeholder="e.g. utsav_vachhani"
                      disabled={committing || comparing}
                      className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3.5 text-xs text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                    />
                    <p className="text-[10px] text-(--text-secondary) select-none leading-relaxed">
                      If uploaded files contain a Flutter application, this automatically renames the app inside <code className="font-bold text-(--text-primary)">AppInfo.xcconfig</code> and <code className="font-bold text-(--text-primary)">AndroidManifest.xml</code> on commit.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 select-none">
                    <input
                      type="checkbox"
                      id="includeDeletions"
                      checked={includeDeletions}
                      onChange={(e) => {
                        setIncludeDeletions(e.target.checked);
                        setComparisonResult(null);
                      }}
                      disabled={committing || comparing}
                      className="w-4.5 h-4.5 rounded border-(--border) bg-(--bg-secondary) text-(--primary) focus:ring-(--primary) cursor-pointer disabled:opacity-50"
                    />
                    <label
                      htmlFor="includeDeletions"
                      className="text-xs font-bold text-(--text-primary) cursor-pointer select-none disabled:opacity-50"
                    >
                      Enable Safe Delete (Remove missing local files on remote branch)
                    </label>
                  </div>

                  <button
                    onClick={handleCompare}
                    disabled={files.length === 0 || comparing || committing || branchesLoading}
                    className="w-full bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-extrabold py-4 rounded-xl flex items-center justify-center gap-2.5 transition duration-200 ease-in-out active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none shadow-xs cursor-pointer select-none text-sm"
                  >
                    {comparing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Comparing Changes...
                      </>
                    ) : (
                      'Compare Changes'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-(--text-primary) select-none">
                      New Flutter Application Name
                    </label>
                    <input
                      type="text"
                      value={flutterAppName}
                      onChange={(e) => setFlutterAppName(e.target.value)}
                      placeholder="e.g. utsav_vachhani"
                      disabled={renamingRemote}
                      className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3.5 text-xs text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                    />
                    <p className="text-[10px] text-(--text-secondary) select-none leading-relaxed">
                      Directly renames the application inside <code className="font-bold text-(--text-primary)">AppInfo.xcconfig</code> and <code className="font-bold text-(--text-primary)">AndroidManifest.xml</code> on the remote branch <code className="font-bold text-(--text-primary)">{selectedBranch}</code> without uploading any local files.
                    </p>
                  </div>

                  <button
                    onClick={handleRemoteRename}
                    disabled={renamingRemote || !flutterAppName.trim() || branchesLoading}
                    className="w-full bg-(--accent) hover:bg-(--accent-hover) text-(--text-inverse) font-extrabold py-4 rounded-xl flex items-center justify-center gap-2.5 transition duration-200 ease-in-out active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none shadow-xs cursor-pointer select-none text-sm animate-pulse-slow"
                  >
                    {renamingRemote ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Renaming Remote Flutter App...
                      </>
                    ) : (
                      'Rename Remote Flutter App Only'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Preview/Commit Column */}
          <div className="md:col-span-6">
            {comparisonResult ? (
              <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-6 shadow-xs space-y-6">
                <ChangesPreview
                  summary={comparisonResult}
                  selectedPaths={selectedPaths}
                  onTogglePath={handleTogglePath}
                />

                {(comparisonResult.added.length > 0 ||
                  comparisonResult.modified.length > 0 ||
                  (includeDeletions && comparisonResult.deleted.length > 0)) ? (
                  <div className="space-y-4 pt-4 border-t border-(--border)">
                    <div>
                      <label className="block text-xs font-bold text-(--text-primary) mb-2 select-none">
                        Commit Message
                      </label>
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Upload project files from dashboard"
                        disabled={committing}
                        className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3.5 text-xs text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                      />
                    </div>

                    <button
                      onClick={handleCommit}
                      disabled={committing}
                      className="w-full bg-(--accent) hover:bg-(--accent-hover) text-(--text-inverse) hover:text-(--text-primary) font-black py-4 rounded-xl flex items-center justify-center gap-2.5 transition duration-200 ease-in-out active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none shadow-xs cursor-pointer select-none text-sm"
                    >
                      {committing ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Committing & Pushing...
                        </>
                      ) : (
                        'Commit & Push Changes'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center select-none text-xs text-(--text-primary) leading-relaxed">
                    <span className="font-extrabold text-amber-600 block mb-1">No Changes Detected</span>
                    Local folder matches the remote branch exactly. To force a commit, add a unique file (e.g. <code className="font-bold underline text-amber-700 font-mono text-[10px]">unique-sync.txt</code>) or modify any file in your folder.
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-(--border) rounded-3xl p-12 text-center text-(--text-secondary) select-none bg-(--bg-primary)/40">
                <GitBranch className="mx-auto mb-3 text-(--text-secondary)/60" size={32} />
                <p className="text-sm font-bold text-(--text-primary)">Preview Changes</p>
                <p className="text-xs mt-1">
                  Upload a folder and click "Compare Changes" to preview file updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
