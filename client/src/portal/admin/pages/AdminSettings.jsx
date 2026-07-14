import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Shield, Bell, Save } from 'lucide-react';
import toast from '../../../utils/Toast.js';

export default function AdminSettings() {
  const { me } = useSelector((state) => state.auth);
  const [maintenance, setMaintenance] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  const handleSave = () => {
    toast.success('Admin settings saved successfully');
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

      <div className="p-8 rounded-3xl bg-(--bg-primary) border border-(--border) space-y-6">
        
        {/* Platform parameters */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-(--text-primary) uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-(--border)/60">
            <Shield size={16} className="text-indigo-500" />
            System Controls
          </h3>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-(--bg-secondary)/50 border border-(--border)/60">
            <div>
              <span className="text-sm font-bold text-(--text-primary) block">Maintenance Mode</span>
              <span className="text-[11px] text-(--text-secondary) block mt-0.5">Disable access to the platform for all non-admin users.</span>
            </div>
            <input 
              type="checkbox" 
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="w-4 h-4 text-(--primary) border-(--border) rounded-sm"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-(--bg-secondary)/50 border border-(--border)/60">
            <div>
              <span className="text-sm font-bold text-(--text-primary) block">Allow New Registrations</span>
              <span className="text-[11px] text-(--text-secondary) block mt-0.5">Enable or disable register-user REST endpoints.</span>
            </div>
            <input 
              type="checkbox" 
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              className="w-4 h-4 text-(--primary) border-(--border) rounded-sm"
            />
          </div>
        </div>

        {/* Email OTP configurations */}
        <div className="space-y-6 pt-4">
          <h3 className="text-sm font-black text-(--text-primary) uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-(--border)/60">
            <Bell size={16} className="text-indigo-500" />
            Verification Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-(--text-secondary) block">OTP Code Expiry (Minutes)</label>
              <input 
                type="number" 
                defaultValue={5} 
                className="w-full px-4.5 py-3 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-semibold text-(--text-primary) focus:border-(--primary) transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-(--text-secondary) block">Password Hash Factor</label>
              <input 
                type="number" 
                defaultValue={12} 
                className="w-full px-4.5 py-3 rounded-xl border border-(--border) bg-(--bg-secondary) text-xs font-semibold text-(--text-primary) focus:border-(--primary) transition"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer text-xs"
        >
          <Save size={14} />
          Save Configurations
        </button>

      </div>
    </div>
  );
}
