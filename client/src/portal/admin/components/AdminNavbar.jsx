import { useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../../store/slices/authSlice.js";
import { LogOut, Menu, User, Mail, ShieldAlert, Sun, Moon } from "lucide-react";
import Logo from "../../../components/Logo.jsx";
import toast from "../../../utils/Toast.js";
import { DarkModeContext } from "../../../context/darkModeContext.jsx";

export default function AdminNavbar({ onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { me } = useSelector((state) => state.auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { darkMode, setDarkMode } = useContext(DarkModeContext);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err || "Failed to logout");
    }
  };

  if (!me) return null;

  const initials = me.name
    ? me.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      {/* Dropdown Overlay Backdrop */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      <nav className="sticky top-0 z-50 w-full border-b border-(--border)/60 bg-(--bg-primary)/85 backdrop-blur-md transition-colors select-none h-18">
        <div className="mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2.5 rounded-xl border border-(--border) text-(--text-primary) bg-(--bg-primary) hover:bg-(--bg-secondary) hover:text-(--primary) transition-all duration-200 cursor-pointer shadow-xs shrink-0"
              title="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="sm:block hidden">
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-(--border) text-(--text-primary) bg-(--bg-primary) hover:bg-(--bg-secondary) hover:text-(--primary) transition-all duration-200 cursor-pointer shadow-xs shrink-0"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative z-50">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-(--border)/80 bg-(--bg-primary) hover:bg-(--bg-secondary) transition-all duration-200 cursor-pointer select-none active:scale-[0.98]"
              >
                {/* Profile Avatar / Initials */}
                {me.avatar_url ? (
                  <img
                    src={me.avatar_url}
                    alt={me.name}
                    className="w-7 h-7 rounded-full ring-2 ring-indigo-500/20"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-[10px] shadow-xs shrink-0">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:block text-xs font-bold text-(--text-primary)">
                  {me.name}
                </span>
              </button>

              {/* Profile Dropdown Card */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-(--border)/80 bg-(--bg-primary) p-4.5 shadow-2xl space-y-3.5 text-left transition-all duration-200">
                  {/* User Info Header */}
                  <div className="flex items-start gap-3">
                    {me.avatar_url ? (
                      <img
                        src={me.avatar_url}
                        alt={me.name}
                        className="w-10 h-10 rounded-full ring-2 ring-indigo-500/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-black text-(--text-primary) truncate">
                        {me.name}
                      </h4>
                      <p className="text-[10px] text-(--text-secondary) font-mono truncate">
                        ID: {me.unique_id}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-(--border)/60 my-2" />

                  {/* Details Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-(--text-secondary)">
                      <Mail
                        size={14}
                        className="shrink-0 text-(--text-secondary)"
                      />
                      <span className="truncate">{me.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-(--text-secondary)">
                      <ShieldAlert
                        size={14}
                        className="shrink-0 text-indigo-500"
                      />
                      <span className="capitalize font-black text-indigo-500">
                        Role: {me.role}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-(--border)/60 my-2" />

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500 hover:text-white text-rose-500 hover:border-transparent text-xs font-black transition active:scale-95 cursor-pointer"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
