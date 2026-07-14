import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Sun, Moon, LogOut, Github } from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice.js';
import { clearRepoState } from '../store/slices/repoSlice.js';
import { DarkModeContext } from '../context/darkModeContext.jsx';
import Logo from './Logo.jsx';

export default function Navbar() {
  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.auth);
  const { darkMode, setDarkMode } = useContext(DarkModeContext);

  const handleLogoutClick = () => {
    dispatch(logoutUser());
    dispatch(clearRepoState());
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-(--bg-primary)/80 backdrop-blur-md border-b border-(--border)/80 transition-all duration-300 select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl border border-(--border) text-(--text-primary) bg-(--bg-primary) hover:bg-(--bg-secondary) hover:text-(--primary) transition-all duration-200 cursor-pointer shadow-xs"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {me ? (
            <Link
              to={me.role === 'admin' ? `/admin/${me.unique_id}` : `/id/${me.unique_id}`}
              className="inline-flex items-center gap-2 bg-linear-to-r from-(--primary) to-(--accent) text-white font-extrabold px-5 py-2.5 rounded-xl hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-xs cursor-pointer shadow-md shadow-(--primary)/15 select-none"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-linear-to-r from-(--primary) to-(--accent) text-white font-extrabold px-5 py-2.5 rounded-xl hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-xs cursor-pointer shadow-md shadow-(--primary)/15 select-none"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
