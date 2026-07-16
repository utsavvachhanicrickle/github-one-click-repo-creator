import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ImageIcon, Type } from 'lucide-react';
import { updateFlutterApp } from '../services/github.service.js';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function AppUpdater({ owner, repo, currentBranch, setIsUploading, setUploadStatus, setUploadProgress, onComplete }) {
  const [appName, setAppName] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selectedFile.type)) {
      setError('Please upload a valid PNG, JPG, or WEBP image.');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(selectedFile);
    
    img.onload = () => {
      if (img.width !== 1024 || img.height !== 1024) {
        setError(`Image must be exactly 1024x1024 pixels. Got ${img.width}x${img.height}.`);
        setFile(null);
        setPreviewUrl(null);
      } else {
        setFile(selectedFile);
        setPreviewUrl(objectUrl);
      }
    };
    img.src = objectUrl;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!appName.trim() && !file) {
      setError('Please provide either a new App Name or an App Icon to update.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Initializing update...');
    setUploadProgress(0);

    const repoFullName = `${owner}/${repo}`;
    
    const logHandler = (data) => {
      if (data.repoFullName === repoFullName) {
        setUploadStatus(data.message);
      }
    };
    const progressHandler = (data) => {
      if (data.repoFullName === repoFullName) {
        setUploadProgress(data.progress);
        if (data.status) setUploadStatus(data.status);
      }
    };

    socket.on('upload_log', logHandler);
    socket.on('upload_progress', progressHandler);

    try {
      await updateFlutterApp(owner, repo, currentBranch, appName.trim(), file);
      setUploadProgress(100);
      setUploadStatus('App settings successfully updated and committed!');
      setTimeout(() => {
        onComplete();
        setAppName('');
        clearSelection();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update app settings.');
      setIsUploading(false);
    } finally {
      socket.off('upload_log', logHandler);
      socket.off('upload_progress', progressHandler);
    }
  };

  return (
    <div className="bg-(--surface) border border-(--border) rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-(--text-primary) flex items-center gap-2">
           Flutter App Settings
        </h2>
        <p className="text-(--text-secondary) mt-1 text-sm">
          Update your Flutter app's name and auto-generate app icons. Fill out one or both. They will be committed together.
        </p>
      </div>

      <div className="space-y-6">
        {/* App Name Section */}
        <div>
          <label className="text-sm font-semibold text-(--text-primary) mb-2 flex items-center gap-2">
            <Type size={16} className="text-(--primary)"/> New App Name
          </label>
          <input
            type="text"
            className="w-full bg-(--bg) border border-(--border) rounded-lg px-4 py-3 text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary) transition-colors"
            placeholder="e.g. My Awesome App"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />
          <p className="text-(--text-secondary) text-xs mt-2">
            This will update PRODUCT_NAME in Xcode and android:label in AndroidManifest.
          </p>
        </div>

        <div className="border-t border-(--border) pt-6">
          <label className="text-sm font-semibold text-(--text-primary) mb-2 flex items-center gap-2">
            <ImageIcon size={16} className="text-(--primary)"/> New App Icon (1024x1024)
          </label>
          
          {!file ? (
            <div 
              className="border-2 border-dashed border-(--border) hover:border-(--primary) transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-(--surface-hover)"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="bg-(--bg) p-3 rounded-full mb-3">
                <Upload size={24} className="text-(--primary)" />
              </div>
              <p className="text-(--text-primary) font-semibold mb-1">Click to upload icon or drag and drop</p>
              <p className="text-(--text-secondary) text-sm">PNG, JPG or WEBP (Exactly 1024x1024px)</p>
            </div>
          ) : (
            <div className="border border-(--border) rounded-xl p-6 flex items-center gap-6 bg-(--bg)">
              <div className="relative shrink-0">
                <img src={previewUrl} alt="App Icon Preview" className="w-24 h-24 rounded-2xl shadow-md border border-(--border) object-cover" />
                <button 
                  onClick={clearSelection}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div>
                <p className="text-(--text-primary) font-medium truncate max-w-xs">{file.name}</p>
                <p className="text-(--text-secondary) text-xs mt-1 font-semibold">1024x1024 - Validated</p>
                <p className="text-(--text-secondary) text-xs mt-1">Will generate 21 icons for iOS and Android</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!appName.trim() && !file}
        className={`mt-6 px-8 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 w-full justify-center ${
          (!appName.trim() && !file) 
            ? 'bg-(--border) text-(--text-secondary) cursor-not-allowed'
            : 'bg-(--primary) hover:bg-(--primary-hover) text-white'
        }`}
      >
        Update App Settings
      </button>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
        onChange={handleFileChange} 
      />
    </div>
  );
}
