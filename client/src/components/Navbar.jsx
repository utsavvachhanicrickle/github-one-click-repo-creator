import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon, LogOut } from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice.js';
import { clearRepoState } from '../store/slices/repoSlice.js';
import { DarkModeContext } from '../context/darkModeContext.jsx';

export default function Navbar() {
  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.auth);
  const { darkMode, setDarkMode } = useContext(DarkModeContext);

  const handleLogoutClick = () => {
    dispatch(logoutUser());
    dispatch(clearRepoState());
  };

  return (
    <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-black text-xl">↗</span>
        </div>
        <span className="font-extrabold text-2xl text-slate-900 dark:text-slate-100">
          RepoCreator
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {me && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
            <img src={me.avatar_url} alt={me.login} className="w-7 h-7 rounded-full ring-2 ring-indigo-500/30" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">@{me.login}</span>
            <button
              className="p-1.5 rounded-full text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-350 dark:hover:bg-slate-800 transition cursor-pointer"
              onClick={handleLogoutClick}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
