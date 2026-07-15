import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, AlertCircle, FolderGit2, Plus, Rocket, X, Github } from 'lucide-react';
import StoreCard from '../../../components/StoreCard.jsx';
import { fetchStores, createStore } from '../../../store/slices/storeSlice.js';

export default function AdminStoreList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { me } = useSelector((state) => state.auth);
  const { stores, loading, error, creating } = useSelector((state) => state.store);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (me?.github_login) {
      dispatch(fetchStores());
    }
  }, [me, dispatch]);

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setCreateError('');

    const cleanStoreName = storeName.trim();
    if (cleanStoreName.length < 3) {
      setCreateError('Store name must be at least 3 characters.');
      return;
    }

    try {
      await dispatch(createStore(cleanStoreName)).unwrap();
      setStoreName('');
      setShowModal(false);
    } catch (err) {
      setCreateError(err || 'Failed to create store.');
    }
  };

  const filteredStores = useMemo(() => {
    return stores.filter((store) =>
      store.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.repo_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stores, searchQuery]);

  // If Admin has not linked their GitHub profile
  if (me && !me.github_login) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center select-none relative z-10">
        <div className="inline-block px-4.5 py-1.5 rounded-full bg-linear-to-tr from-(--primary)/10 to-(--accent)/10 border border-(--border)/60 text-(--primary) text-[11px] font-black uppercase tracking-wider mb-6">
          GitHub Connection Required
        </div>
        <h2 className="text-4xl font-black text-(--text-primary) tracking-tight mb-4">
          Connect your GitHub Profile
        </h2>
        <p className="text-sm text-(--text-secondary) leading-relaxed max-w-lg mx-auto mb-8 font-medium">
          To create and manage store repositories, you need to connect your organizational or administrative GitHub account.
        </p>

        <button
          onClick={() => navigate(`/admin/${me.unique_id}/settings`)}
          className="inline-flex items-center justify-center gap-2.5 bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-extrabold px-8 py-4.5 rounded-2xl transition shadow-xl shadow-(--primary)/15 active:scale-95 cursor-pointer text-sm"
        >
          <Github size={20} />
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-(--bg) pb-12">
      <div className="max-w-7xl mx-auto px-6 mt-12 relative z-10">
        
        {/* Header & Actions */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 select-none">
          <div>
            <h2 className="text-3xl font-black text-(--text-primary) tracking-tight">
              All Stores
            </h2>
            <p className="text-xs text-(--text-secondary) mt-1.5 font-semibold">
              View, search, and manage all store repositories in this organization.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-secondary)">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores..."
                className="w-full bg-(--bg-primary) border border-(--border) rounded-2xl pl-10 pr-4 py-3 text-sm text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition shadow-xs"
              />
            </div>

            {/* Create Store Button */}
            <button
              onClick={() => setShowModal(true)}
              className="bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-extrabold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-(--primary)/10 select-none text-sm shrink-0"
            >
              <Plus size={18} />
              Create Store
            </button>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-(--text-secondary) gap-3 select-none">
            <Loader2 className="animate-spin text-(--primary)" size={32} />
            <span className="font-extrabold text-sm">Loading all store repositories...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-(--danger-bg) border border-(--danger-border) text-(--danger) flex items-start gap-3 select-none">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-extrabold text-sm">Error Loading Stores</p>
              <p className="text-xs mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filteredStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-(--border) rounded-3xl p-16 text-center text-(--text-secondary) bg-(--bg-primary)/40 select-none">
            <FolderGit2 className="mx-auto mb-3 text-(--text-secondary)/60" size={40} />
            <p className="font-extrabold text-base text-(--text-primary)">No Stores Found</p>
            <p className="text-xs mt-1">
              {searchQuery ? `No matches found for "${searchQuery}".` : 'No store repositories have been created in this organization.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Create Store Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-(--bg-primary) border border-(--border) shadow-[0_10px_50px_rgba(0,0,0,0.15)] w-full max-w-[500px] rounded-[24px] overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 select-none">
              <h3 className="text-xl font-black text-(--text-primary) flex items-center gap-2">
                <Rocket size={20} className="text-(--primary)" />
                Create Store Repository
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCreateError('');
                  setStoreName('');
                }}
                disabled={creating}
                className="text-(--text-secondary) hover:text-(--text-primary) hover:scale-110 active:scale-95 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateStore} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-(--text-primary) mb-2 select-none">
                  Store Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="App Store, Shop Name, etc."
                  disabled={creating}
                  className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl px-4 py-3 text-sm text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
                />
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
                    setStoreName('');
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
                    'Create Store'
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