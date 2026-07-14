import { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Eye } from 'lucide-react';
import API from '../../../services/apiClient.js';
import toast from '../../../utils/Toast.js';

export default function AdminUserAssigned() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/admin/users');
      if (res.data && res.data.success) {
        setUsers(res.data.users);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) || 
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.unique_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-(--text-primary) tracking-tight flex items-center gap-2">
            Assigned Users
          </h1>
          <p className="text-xs text-(--text-secondary) font-medium mt-1">
            Display and filter all system users.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-black text-(--text-primary) hover:border-(--primary) transition active:scale-95 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Reload List
        </button>
      </div>

      <div className="p-8 rounded-3xl bg-(--bg-primary) border border-(--border) space-y-6">
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)" size={16} />
          <input 
            type="text"
            placeholder="Search by name, email, or unique ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-semibold text-(--text-primary) focus:border-(--primary) transition"
          />
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="text-center py-10 text-xs text-(--text-secondary)">Querying database records...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-xs text-(--text-secondary)">No matching user profiles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-(--border) text-(--text-secondary) font-bold">
                  <th className="pb-3 font-black">User Profile</th>
                  <th className="pb-3 font-black">Unique ID</th>
                  <th className="pb-3 font-black">Role</th>
                  <th className="pb-3 font-black">Verified</th>
                  <th className="pb-3 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)/60">
                {filteredUsers.map((user) => (
                  <tr key={user.id || user.unique_id} className="text-(--text-primary)">
                    <td className="py-4">
                      <div className="font-extrabold">{user.name}</div>
                      <div className="text-[10px] text-(--text-secondary) font-mono">{user.email}</div>
                    </td>
                    <td className="py-4 font-mono font-bold text-indigo-500">{user.unique_id}</td>
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
                        {user.user_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => toast.success(`Viewing details for ${user.name}`)}
                        className="p-2 rounded-lg bg-(--bg-secondary) border border-(--border) text-(--text-primary) hover:border-(--primary) hover:text-(--primary) transition cursor-pointer"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
