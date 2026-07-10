import { useRef, useState } from 'react';
import { UploadCloud, FolderUp, Check, AlertCircle } from 'lucide-react';

export default function FolderUpload({ onFolderSelect }) {
  const fileInputRef = useRef(null);
  const [folderName, setFolderName] = useState('');
  const [stats, setStats] = useState(null);

  const ignoredNames = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.env',
    '.env.local',
    '.env.production',
    '.DS_Store'
  ]);

  const handleFolderChange = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Detect folder name from the first file's webkitRelativePath
    const firstPath = rawFiles[0].webkitRelativePath || '';
    const inferredFolderName = firstPath.split('/')[0] || 'Selected Folder';
    setFolderName(inferredFolderName);

    const validFiles = [];
    let ignoredCount = 0;

    rawFiles.forEach((file) => {
      const relPath = file.webkitRelativePath || file.name;
      const cleanPath = relPath.replace(/\\/g, '/');

      // Check for danger patterns
      if (
        cleanPath.includes('../') ||
        cleanPath.startsWith('/') ||
        cleanPath.trim() === ''
      ) {
        ignoredCount++;
        return;
      }

      // Check segments for ignored directories/files
      const segments = cleanPath.split('/');
      let isIgnored = false;

      for (const segment of segments) {
        if (ignoredNames.has(segment)) {
          isIgnored = true;
          break;
        }
        if (segment.startsWith('.') && segment !== '.gitignore') {
          isIgnored = true;
          break;
        }
      }

      if (isIgnored) {
        ignoredCount++;
      } else {
        validFiles.push(file);
      }
    });

    const calculatedStats = {
      total: rawFiles.length,
      valid: validFiles.length,
      ignored: ignoredCount,
    };

    setStats(calculatedStats);
    onFolderSelect(validFiles, calculatedStats);
  };

  const triggerInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-(--text-primary) mb-2 select-none">
        Upload Project Folder
      </label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFolderChange}
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />
      <div
        onClick={triggerInputClick}
        className="border-2 border-dashed border-(--border) hover:border-(--primary) rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition cursor-pointer bg-(--bg-secondary)/40 hover:bg-(--bg-secondary)/70 select-none group"
      >
        <div className="w-14 h-14 rounded-2xl bg-(--bg-primary) border border-(--border) flex items-center justify-center text-(--text-secondary) group-hover:text-(--primary) group-hover:border-(--primary) transition shadow-xs">
          <UploadCloud size={28} />
        </div>
        <div className="text-center">
          <p className="font-extrabold text-sm text-(--text-primary) flex items-center justify-center gap-1.5">
            <FolderUp size={16} /> Select a Folder to Upload
          </p>
          <p className="text-xs text-(--text-secondary) mt-1">
            Browser file picker will preserve full directory structures.
          </p>
        </div>
      </div>

      {stats && (
        <div className="mt-4 p-4 rounded-xl bg-(--bg-primary) border border-(--border) space-y-2 select-none animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-(--text-primary)">
            <span className="truncate max-w-[200px]" title={folderName}>Folder: {folderName}</span>
            <span className="text-(--primary) bg-(--primary)/10 px-2 py-0.5 rounded-md font-mono">
              {stats.valid} files
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-(--border) text-xs">
            <div className="flex items-center gap-1.5 text-(--success) font-bold">
              <Check size={14} />
              <span>{stats.valid} Allowed</span>
            </div>
            <div className="flex items-center gap-1.5 text-(--danger) font-bold">
              <AlertCircle size={14} />
              <span>{stats.ignored} Ignored</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
