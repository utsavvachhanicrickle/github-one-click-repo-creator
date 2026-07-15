import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Shield, Bell, Save, Github } from 'lucide-react';
import { fetchMe } from '../../../store/slices/authSlice.js';
import toast from '../../../utils/Toast.js';

export default function AdminSettings() {
  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.auth);

  // Check URL parameters for successful OAuth callback redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'connected') {
      toast.success('GitHub account linked successfully!');
      dispatch(fetchMe());
      
      // Clean up URL query parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [dispatch]);


  const handleConnectGithub = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/api/auth/github`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-black text-(--text-primary) tracking-tight">
          Admin Settings
        </h1>
        <p className="text-xs text-(--text-secondary) font-medium mt-1">
          Adjust backend parameters, platform flags, and configurations.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-(--bg-primary) border border-(--border) space-y-8">
        
        {/* GitHub Integration card section */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-(--text-primary) uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-(--border)/60">
            <Github size={16} className="text-indigo-500" />
            Third-Party Integrations
          </h3>

          <div className="p-6 rounded-2xl bg-(--bg-secondary)/50 border border-(--border)/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                <Github size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold text-(--text-primary) block">GitHub Authentication Node</span>
                <span className="text-[11px] text-(--text-secondary) block">
                  Link your organization's administrative GitHub account. Linked personal accounts will automatically share this token for repository actions.
                </span>
              </div>
            </div>

            <div className="shrink-0 sm:self-center">
              {me?.github_id !== null ? (
                <div className="flex items-center gap-3 bg-(--bg-primary) border border-(--border) p-2.5 pr-4 rounded-xl shadow-xs">
                  {me.github_id !== null ? (
                    <img 
                      src={me.github_avatar_url} 
                      alt={me.github_login} 
                      className="w-7 h-7 rounded-full object-cover border border-(--border)/80"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-500 text-[10px] font-black text-white flex items-center justify-center">
                      GH
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-(--text-secondary) block leading-none font-bold uppercase tracking-wider">Connected Account</span>
                    <a 
                      href={`https://github.com/${me.github_login}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-black text-indigo-500 hover:underline leading-normal block"
                    >
                      @{me.github_login}
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnectGithub}
                  className="px-5 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black transition active:scale-95 cursor-pointer shadow-md shadow-indigo-500/10 flex items-center gap-2"
                >
                  <Github size={14} />
                  Connect GitHub Account
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
