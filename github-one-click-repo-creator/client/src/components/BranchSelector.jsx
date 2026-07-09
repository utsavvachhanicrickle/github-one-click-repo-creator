import { GitBranch } from 'lucide-react';

export default function BranchSelector({ branches, selectedBranch, onSelectBranch, loading }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-(--text-primary) mb-2 select-none">
        Target Repository Branch
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-(--text-secondary)">
          <GitBranch size={18} />
        </div>
        <select
          value={selectedBranch}
          onChange={(e) => onSelectBranch(e.target.value)}
          disabled={loading || branches.length === 0}
          className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl pl-11 pr-4 py-3.5 text-(--text-primary) font-semibold focus:outline-none focus:border-(--primary) transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none appearance-none"
        >
          {loading ? (
            <option>Loading branches...</option>
          ) : branches.length === 0 ? (
            <option value="main">main (creates initial commit)</option>
          ) : (
            branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))
          )}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-(--text-secondary) font-bold text-[10px] select-none">
          ▼
        </div>
      </div>
    </div>
  );
}
