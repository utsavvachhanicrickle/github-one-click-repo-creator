import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ShieldCheck, Mail, UserCheck, Calendar, Hash } from 'lucide-react';
import API from '../../../services/apiClient.js';
import toast from '../../../utils/Toast.js';

export default function AdminDashboard() {
  const { me } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlatformUsers() {
      try {
        setLoading(true);
        // Attempt backend admin API call
        const res = await API.get('/api/admin/users');
        if (res.data && res.data.success) {
          setUsers(res.data.users);
        } else {
          // Fallback to local user session data if backend is still being developed
          setUsers([
            {
              id: 1,
              unique_id: me?.unique_id || 'sczqwqph',
              name: me?.name || 'Utsav Vachhani',
              email: me?.email || 'utsavvachhani.cs@gmail.com',
              role: me?.role || 'admin',
              user_verified: true,
              created_at: new Date().toISOString()
            }
          ]);
        }
      } catch {
        // Safe development fallback
        setUsers([
          {
            id: 1,
            unique_id: me?.unique_id || 'sczqwqph',
            name: me?.name || 'Utsav Vachhani',
            email: me?.email || 'utsavvachhani.cs@gmail.com',
            role: me?.role || 'admin',
            user_verified: true,
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlatformUsers();
  }, [me]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 select-none">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-(--text-primary) tracking-tight">
            Admin Console
          </h1>
          <p className="text-xs text-(--text-secondary) font-medium mt-1">
            Overview metrics, user profiles, and platform configuration dashboard.
          </p>
        </div>
        <div className="px-4.5 py-2 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-500 text-xs font-black flex items-center gap-2 w-fit">
          <ShieldCheck size={14} />
          Authorized Access Mode
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-(--text-secondary) tracking-wider block">
              Total platform accounts
            </span>
            <span className="text-3xl font-black text-(--text-primary) tracking-tight block">
              {users.length}
            </span>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-indigo-500 tracking-wider block">
              System Administrators
            </span>
            <span className="text-3xl font-black text-indigo-500 tracking-tight block">
              {users.filter(u => u.role === 'admin').length}
            </span>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-(--bg-primary) border border-(--border) shadow-xs relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider block">
              Verified Accounts
            </span>
            <span className="text-3xl font-black text-emerald-500 tracking-tight block">
              {users.filter(u => u.user_verified).length}
            </span>
          </div>
        </div>
      </div>

      {/* User profile details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Current Profile Card */}
        <div className="lg:col-span-1 p-8 rounded-3xl bg-(--bg-primary) border border-(--border) flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/10">
            {me?.name ? me.name.charAt(0).toUpperCase() : 'A'}
          </div>
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
              <span className="font-mono font-bold text-(--text-primary)">{me?.unique_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-(--text-secondary) font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} /> Role
              </span>
              <span className="font-bold text-indigo-500 uppercase tracking-wider">{me?.role}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Users List Table */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-(--bg-primary) border border-(--border) space-y-6">
          <h3 className="text-lg font-black text-(--text-primary) tracking-tight">
            Registered Users List
          </h3>

          {loading ? (
            <div className="text-center py-10 text-xs text-(--text-secondary)">Loading user records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-(--border) text-(--text-secondary) font-bold">
                    <th className="pb-3 font-black">User Profile</th>
                    <th className="pb-3 font-black">Unique ID</th>
                    <th className="pb-3 font-black">Role</th>
                    <th className="pb-3 font-black">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)/60">
                  {users.map((user) => (
                    <tr key={user.id || user.unique_id} className="text-(--text-primary)">
                      <td className="py-4">
                        <div className="font-bold">{user.name}</div>
                        <div className="text-[10px] text-(--text-secondary) font-mono">{user.email}</div>
                      </td>
                      <td className="py-4 font-mono font-bold">{user.unique_id}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'admin' 
                            ? 'bg-indigo-500/10 text-indigo-500' 
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`font-bold ${user.user_verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {user.user_verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
