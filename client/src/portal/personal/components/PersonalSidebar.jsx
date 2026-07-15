import { NavLink } from "react-router-dom";
import { FolderGit2 } from "lucide-react";

export default function PersonalSidebar({
  uniqueId,
  isCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const routes = [
    {
      path: `/id/${uniqueId}`,
      label: "My Templates",
      icon: <FolderGit2 size={18} />,
      end: true,
    },
    {
      path: `/id/${uniqueId}/stores`,
      label: "My Stores",
      icon: <FolderGit2 size={18} />,
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-(--bg-primary) border-r border-(--border)/60 flex flex-col pt-18 transition-all duration-300 select-none
          md:sticky md:top-18 md:min-h-[calc(100vh-4.5rem)] md:z-30 md:pt-0
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {routes.map((route, index) => (
            <NavLink
              key={index}
              to={route.path}
              end={route.end}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-xs font-black transition-all py-3.5 ${
                  isCollapsed ? "justify-center px-0" : "px-4.5 gap-3.5"
                } ${
                  isActive
                    ? "bg-(--primary) text-(--text-inverse) shadow-md shadow-(--primary)/15"
                    : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-secondary)/50"
                }`
              }
              title={isCollapsed ? route.label : ""}
            >
              <div className="shrink-0">{route.icon}</div>
              {!isCollapsed && <span className="truncate">{route.label}</span>}
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}
