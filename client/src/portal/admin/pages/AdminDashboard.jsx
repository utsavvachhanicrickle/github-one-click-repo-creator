import { useSelector } from 'react-redux';
import { ShieldCheck, Mail, Calendar, Hash, Server, Database, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { me } = useSelector((state) => state.auth);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 select-none">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-(--text-primary) tracking-tight">
            Admin Console
          </h1>
          <p className="text-xs text-(--text-secondary) font-medium mt-1">
            System status monitoring and administrator profile details.
          </p>
        </div>
        <div className="px-4.5 py-2 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-500 text-xs font-black flex items-center gap-2 w-fit">
          <ShieldCheck size={14} />
          Authorized Access Mode
        </div>
      </div>

      {/* Analytics widgets / System Health status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Platform Status */}
        <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs relative overflow-hidden flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Server size={20} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">
              Platform Service
            </span>
            <span className="text-xl font-black text-emerald-500 tracking-tight block items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Database Node */}
        <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs relative overflow-hidden flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Database size={20} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">
              Database Cluster
            </span>
            <span className="text-xl font-black text-indigo-500 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* API Gateway */}
        <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs relative overflow-hidden flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
            <Activity size={20} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">
              API Sync Engine
            </span>
            <span className="text-xl font-black text-purple-500 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              Operational
            </span>
          </div>
        </div>

      </div>

      {/* Details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 p-8 rounded-3xl bg-(--bg-primary) border border-(--border) flex flex-col items-center text-center space-y-6">
          {me?.github_avatar_url ? (
            <img 
              src={me.github_avatar_url} 
              alt={me.name} 
              className="w-24 h-24 rounded-full border border-(--border)/80 shadow-xl shadow-indigo-500/15 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/15">
              {me?.name ? me.name.charAt(0).toUpperCase() : 'A'}
            </div>
          )}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-(--text-primary)">
              {me?.name}
            </h3>
            <p className="text-xs text-(--text-secondary) font-mono">{me?.email}</p>
          </div>
          
          <div className="w-full pt-6 border-t border-(--border)/60 space-y-3.5 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-(--text-secondary) font-semibold flex items-center gap-1.5">
                <Hash size={14} /> Unique ID
              </span>
              <span className="font-mono font-bold text-(--text-primary)">{me?.unique_id || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-(--text-secondary) font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} /> Account Role
              </span>
              <span className="font-bold text-indigo-500 uppercase tracking-wider">{me?.role || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Console / Environment Metadata */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-(--bg-primary) border border-(--border) space-y-6">
          <h3 className="text-lg font-black text-(--text-primary) tracking-tight">
            System Environment
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-(--bg-secondary) border border-(--border)/60 space-y-1">
              <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">Environment Mode</span>
              <span className="font-bold text-(--text-primary) block">Development (Localhost)</span>
            </div>
            <div className="p-5 rounded-2xl bg-(--bg-secondary) border border-(--border)/60 space-y-1">
              <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">Server Port</span>
              <span className="font-mono font-bold text-(--text-primary) block">4000 (Express Node Gateway)</span>
            </div>
            <div className="p-5 rounded-2xl bg-(--bg-secondary) border border-(--border)/60 space-y-1">
              <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">Client Framework</span>
              <span className="font-bold text-(--text-primary) block">React + Vite + Tailwind v4 CSS</span>
            </div>
            <div className="p-5 rounded-2xl bg-(--bg-secondary) border border-(--border)/60 space-y-1">
              <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">Database Node</span>
              <span className="font-bold text-(--text-primary) block">PostgreSQL (github_automation)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
