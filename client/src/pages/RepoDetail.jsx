import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Github, ShieldAlert, CheckCircle2, X, Plus } from 'lucide-react';

import FolderUpload from '../components/FolderUpload.jsx';
import BranchSelector from '../components/BranchSelector.jsx';
import AppUpdater from '../components/AppUpdater.jsx';
import TextFileEditor from '../components/TextFileEditor.jsx';
import { io } from 'socket.io-client';
import { getRepoBranches, commitFolderUpload, createRepoBranch } from '../services/github.service.js';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

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
  const { me } = useSelector((state) => state.auth);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchesLoading, setBranchesLoading] = useState(true);
  
  const [files, setFiles] = useState([]);
  const [fileStats, setFileStats] = useState(null);
  
  const [includeDeletions, setIncludeDeletions] = useState(false);
  const [committing, setCommitting] = useState(false);
  
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

  const [socket, setSocket] = useState(null);
  const [logs, setLogs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('upload_progress', (data) => {
      setLogs((prev) => [...prev, data]);
    });

    newSocket.on('upload_progress_percent', (data) => {
      setUploadProgress(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Active workspace tab state ('upload' | 'flutter-rename')
  const [activeTab, setActiveTab] = useState('flutter-rename');

  // Flutter App Rename State
  const [flutterAppName, setFlutterAppName] = useState('');

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
    setSuccessResult(null);
    setError('');
    handleCommit(validFiles);
  };

  const handleCommit = async (uploadFiles = files) => {
    if (uploadFiles.length === 0) return;
    try {
      setUploading(true);
      setCommitting(true);
      setError('');
      setLogs([]);
      setUploadProgress(null);

      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12;
      h = h ? h : 12;
      const timeStr = `${h}:${m} ${ampm}`;
      const dateStr = `${dd}-${mm}-${yyyy}`;
      const autoCommitMsg = `${me?.name || me?.github_login || 'User'}_${dateStr}-${timeStr}`;

      const formData = new FormData();
      formData.append('branch', selectedBranch);
      formData.append('commitMessage', autoCommitMsg);
      formData.append('includeDeletions', includeDeletions.toString());
      formData.append('flutterAppName', flutterAppName.trim());
      if (socket) {
        formData.append('socketId', socket.id);
      }

      const relativePaths = [];
      uploadFiles.forEach((file) => {
        const cleanPath = getCleanRelativePath(file);
        formData.append('files', file);
        relativePaths.push(cleanPath);
      });
      formData.append('paths', JSON.stringify(relativePaths));

      const result = await commitFolderUpload(owner, repo, formData);
      setSuccessResult(result);
      setFiles([]);
      setFileStats(null);
    } catch (err) {
      setError(err.message || 'Failed to commit and push changes.');
      setLogs(prev => [...prev, { message: `Error: ${err.message}`, type: 'error', timestamp: new Date().toISOString() }]);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-(--bg) pb-12">
      <div className="max-w-5xl mx-auto px-6 mt-8">
        <Link
          to={me?.role === 'admin' ? `/admin/${me?.unique_id}` : `/id/${me?.unique_id}`}
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
            {/* <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-(--bg-secondary) hover:bg-(--bg-active) border border-(--border) text-(--text-primary) font-bold px-5 py-3 rounded-2xl transition duration-200 ease-in-out text-sm select-none"
            >
              <Github size={18} />
              Open on GitHub
            </a> */}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-(--danger-bg) border border-(--danger-border) text-(--danger) text-sm mb-8 flex items-start gap-3 select-none">
            <ShieldAlert className="shrink-0 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {/* Main Controls */}
          <div className="space-y-6">
            <div className="bg-(--bg-primary) border border-(--border) rounded-3xl p-6 shadow-xs space-y-6">
              {/* {branchesLoading ? (
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
                    loading={committing || branchesLoading}
                  />

                  {!showNewBranchInput ? (
                    <button
                      onClick={() => setShowNewBranchInput(true)}
                      disabled={committing || branchesLoading}
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
              )} */}

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
                  Flutter App Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('text-editor');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-black border-b-2 transition duration-200 cursor-pointer ${
                    activeTab === 'text-editor'
                      ? 'border-(--primary) text-(--primary)'
                      : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
                  }`}
                >
                  Profile Editor
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
                      onChange={(e) => setFlutterAppName(e.target.value)}
                      placeholder="e.g. utsav_vachhani"
                      disabled={committing}
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
                      onChange={(e) => setIncludeDeletions(e.target.checked)}
                      disabled={committing}
                      className="w-4.5 h-4.5 rounded border-(--border) bg-(--bg-secondary) text-(--primary) focus:ring-(--primary) cursor-pointer disabled:opacity-50"
                    />
                    <label
                      htmlFor="includeDeletions"
                      className="text-xs font-bold text-(--text-primary) cursor-pointer select-none disabled:opacity-50"
                    >
                      Enable Safe Delete (Remove missing local files on remote branch)
                    </label>
                  </div>
                </div>
              ) : activeTab === 'flutter-rename' ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <AppUpdater
                    owner={owner} 
                    repo={repo} 
                    currentBranch={selectedBranch}
                    setIsUploading={(val) => {
                      setUploading(val);
                      setCommitting(val);
                      if (val) {
                        setLogs([]);
                        setUploadProgress(null);
                        setSuccessResult(null);
                        setError('');
                      }
                    }}
                    setUploadStatus={(msg) => setLogs(prev => [...prev, { message: msg, type: 'info', timestamp: new Date().toISOString() }])}
                    setUploadProgress={(pct) => setUploadProgress({ percentage: pct })}
                    onComplete={() => {
                      setUploading(false);
                      setCommitting(false);
                      setSuccessResult({
                        commitUrl: `https://github.com/${owner}/${repo}/commit/HEAD`,
                        branchUrl: `https://github.com/${owner}/${repo}/tree/${selectedBranch}`,
                        summary: { added: 0, modified: 0, deleted: 0, unchanged: 0 } // Dummy data just to show success UI
                      });
                    }}
                  />
                </div>
              ) : activeTab === 'text-editor' ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <TextFileEditor 
                    owner={owner} 
                    repo={repo} 
                    currentBranch={selectedBranch}
                    setIsUploading={(val) => {
                      setUploading(val);
                      setCommitting(val);
                      if (val) {
                        setLogs([]);
                        setUploadProgress(null);
                        setSuccessResult(null);
                        setError('');
                      }
                    }}
                    setUploadStatus={(msg) => setLogs(prev => [...prev, { message: msg, type: 'info', timestamp: new Date().toISOString() }])}
                    onComplete={() => {
                      setUploading(false);
                      setCommitting(false);
                      setSuccessResult({
                        commitUrl: `https://github.com/${owner}/${repo}/commit/HEAD`,
                        branchUrl: `https://github.com/${owner}/${repo}/tree/${selectedBranch}`,
                        summary: { added: 0, modified: 1, deleted: 0, unchanged: 0 }
                      });
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Live Upload Status Modal popup */}
        {(uploading || logs.length > 0) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-(--bg-primary) border border-(--border) rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8 text-center">
              
              <div className="flex justify-center mb-6">
                {committing ? (
                  <div className="w-16 h-16 rounded-full bg-(--primary)/10 flex items-center justify-center text-(--primary) shadow-inner relative">
                    <Loader2 className="animate-spin" size={32} />
                  </div>
                ) : logs.length > 0 && logs[logs.length - 1].type === 'error' ? (
                  <div className="w-16 h-16 rounded-full bg-(--danger)/10 flex items-center justify-center text-(--danger) shadow-inner">
                    <X size={32} />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-(--success)/10 flex items-center justify-center text-(--success) shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-black text-(--text-primary) mb-2">
                {committing ? 'Uploading Project...' : logs.length > 0 && logs[logs.length - 1].type === 'error' ? 'Upload Failed' : 'Upload Complete!'}
              </h3>
              
              <p className="text-sm font-medium text-(--text-secondary) mb-8 min-h-[40px] flex items-center justify-center">
                {logs.length > 0 ? logs[logs.length - 1].message : 'Waiting for backend response...'}
              </p>

              {uploadProgress !== null && committing && (
                <div className="mb-8">
                  <div className="flex justify-between items-center text-xs font-bold text-(--text-secondary) mb-2">
                    <span>Progress</span>
                    <span>{uploadProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-(--bg-secondary) rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-(--primary) h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {!committing && (
                <button
                  onClick={() => {
                    setUploading(false);
                    setLogs([]);
                    setUploadProgress(null);
                  }}
                  className="w-full bg-(--bg-secondary) hover:bg-(--bg-active) border border-(--border) text-(--text-primary) font-bold py-3.5 rounded-xl transition duration-200 ease-in-out text-sm"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
