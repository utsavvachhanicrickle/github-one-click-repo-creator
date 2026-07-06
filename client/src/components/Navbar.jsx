import { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon, LogOut } from 'lucide-react';
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
    <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-(--border) relative z-10">
      <Logo />

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl border border-(--border) text-(--text-primary) bg-(--bg-primary) hover:bg-(--bg-secondary) transition cursor-pointer"
          title="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {me && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-(--bg-secondary) border border-(--border) backdrop-blur-md">
            <img src={me.avatar_url} alt={me.login} className="w-7 h-7 rounded-full ring-2 ring-(--primary)/30" />
            <span className="text-sm font-semibold text-(--text-primary)">@{me.login}</span>
            <button
              className="p-1.5 rounded-full text-(--text-secondary) hover:text-(--danger) transition cursor-pointer"
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
