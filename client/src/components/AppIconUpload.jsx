import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { updateAppIcon } from '../services/github.service.js';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function AppIconUpload({ owner, repo, currentBranch, setIsUploading, setUploadStatus, setUploadProgress, onComplete }) {
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
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading image to server...');
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
      await updateAppIcon(owner, repo, currentBranch, file);
      setUploadProgress(100);
      setUploadStatus('App icons successfully generated and committed!');
      setTimeout(() => {
        onComplete();
        clearSelection();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update app icons.');
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
          <ImageIcon className="text-(--primary)" /> Generate App Icons
        </h2>
        <p className="text-(--text-secondary) mt-1 text-sm">
          Upload a 1024x1024 image. This tool will automatically generate and commit all required Android (mipmap) and iOS (AppIcon.appiconset) icons directly to your flutter repository.
        </p>
      </div>

      {!file ? (
        <div 
          className="border-2 border-dashed border-(--border) hover:border-(--primary) transition-colors rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-(--surface-hover)"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="bg-(--bg) p-4 rounded-full mb-4">
            <Upload size={32} className="text-(--primary)" />
          </div>
          <p className="text-(--text-primary) font-semibold mb-1">Click to upload or drag and drop</p>
          <p className="text-(--text-secondary) text-sm mb-4">PNG, JPG or WEBP (Exactly 1024x1024px)</p>
        </div>
      ) : (
        <div className="border border-(--border) rounded-xl p-6 flex flex-col items-center bg-(--bg)">
          <div className="relative mb-4">
            <img src={previewUrl} alt="App Icon Preview" className="w-48 h-48 rounded-2xl shadow-lg border border-(--border) object-cover" />
            <button 
              onClick={clearSelection}
              className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-(--text-primary) font-medium">{file.name}</p>
          <p className="text-(--text-secondary) text-xs mt-1">Ready to generate icons</p>
          
          <button
            onClick={handleSubmit}
            className="mt-6 px-8 py-3 bg-(--primary) hover:bg-(--primary-hover) text-white font-bold rounded-lg transition-colors flex items-center gap-2 w-full justify-center"
          >
            <ImageIcon size={20} />
            Generate & Commit Icons to {currentBranch}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

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
