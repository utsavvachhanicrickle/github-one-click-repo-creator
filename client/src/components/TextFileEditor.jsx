import React, { useState, useEffect } from 'react';
import { User, MapPin, Save, FileText } from 'lucide-react';
import { getRepoFile, commitFolderUpload } from '../services/github.service.js';

export default function TextFileEditor({ owner, repo, currentBranch, setIsUploading, setUploadStatus, onComplete }) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [address, setAddress] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReadme() {
      try {
        setLoading(true);
        const res = await getRepoFile(owner, repo, 'README.md', currentBranch);
        setOriginalContent(res.content);
        
        // Parse existing values
        const fnMatch = res.content.match(/First Name:\s*(.*)/i);
        const mnMatch = res.content.match(/Middle Name:\s*(.*)/i);
        const addMatch = res.content.match(/Address:\s*(.*)/i);
        
        if (fnMatch) setFirstName(fnMatch[1]);
        if (mnMatch) setMiddleName(mnMatch[1]);
        if (addMatch) setAddress(addMatch[1]);
        
      } catch (err) {
        if (err.response?.status === 404) {
          // File doesn't exist, start with empty content
          setOriginalContent(`# ${repo}\n\n`);
        } else {
          setError(err.response?.data?.message || "Failed to load README.md");
        }
      } finally {
        setLoading(false);
      }
    }
    loadReadme();
  }, [owner, repo, currentBranch]);

  const handleSave = async () => {
    setIsUploading(true);
    setUploadStatus("Updating README.md...");
    setError(null);
    
    try {
      let newContent = originalContent;
      
      const updateOrAppend = (content, key, value) => {
        const regex = new RegExp(`(${key}:)\\s*(.*)`, 'i');
        if (regex.test(content)) {
          return content.replace(regex, `$1 ${value}`);
        } else {
          return content + `\n${key}: ${value}`;
        }
      };

      if (firstName) newContent = updateOrAppend(newContent, 'First Name', firstName);
      if (middleName) newContent = updateOrAppend(newContent, 'Middle Name', middleName);
      if (address) newContent = updateOrAppend(newContent, 'Address', address);

      const blob = new Blob([newContent], { type: 'text/markdown' });
      const file = new File([blob], 'README.md', { type: 'text/markdown' });
      
      const formData = new FormData();
      formData.append('branch', currentBranch);
      formData.append('commitMessage', `Update profile information in README.md - ${new Date().toLocaleString()}`);
      formData.append('files', file);

      await commitFolderUpload(owner, repo, formData);
      onComplete();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--primary)"></div>
        <p className="text-(--text-secondary) font-medium animate-pulse">Reading README.md...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-(--text-primary)">
        <FileText className="text-(--primary)" size={24} />
        <h3 className="text-xl font-bold">Profile Details (README.md)</h3>
      </div>
      
      <p className="text-sm text-(--text-secondary) mb-6">
        Update your personal information below. Changes will be saved directly to the <code className="bg-(--bg-secondary) px-1 py-0.5 rounded text-xs">README.md</code> file on the <strong>{currentBranch}</strong> branch.
      </p>

      {error && (
        <div className="p-4 rounded-xl bg-(--danger-bg) text-(--danger) text-sm font-medium border border-(--danger-border)">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-(--text-secondary) mb-2 ml-1">First Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)" size={18} />
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Utsav"
              className="w-full bg-(--bg-secondary) border-2 border-(--border) text-(--text-primary) text-sm rounded-2xl focus:ring-4 focus:ring-(--primary-light) focus:border-(--primary) block pl-11 p-3.5 transition-all outline-none font-medium placeholder-(--text-secondary)/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-(--text-secondary) mb-2 ml-1">Middle Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)" size={18} />
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="e.g. Kumar"
              className="w-full bg-(--bg-secondary) border-2 border-(--border) text-(--text-primary) text-sm rounded-2xl focus:ring-4 focus:ring-(--primary-light) focus:border-(--primary) block pl-11 p-3.5 transition-all outline-none font-medium placeholder-(--text-secondary)/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-(--text-secondary) mb-2 ml-1">Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)" size={18} />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main St, City, Country"
              className="w-full bg-(--bg-secondary) border-2 border-(--border) text-(--text-primary) text-sm rounded-2xl focus:ring-4 focus:ring-(--primary-light) focus:border-(--primary) block pl-11 p-3.5 transition-all outline-none font-medium placeholder-(--text-secondary)/50"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-(--primary) hover:bg-(--primary-hover) text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Save size={18} />
          Save to README
        </button>
      </div>
    </div>
  );
}
