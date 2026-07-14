import { useState } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar.jsx";
import AdminSidebar from "./components/AdminSidebar.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import AdminUserAssigned from "./pages/AdminUserAssigned.jsx";

export default function AdminApp() {
  const { uniqueId } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const routes = [
    {
      path: "/",
      element: <AdminDashboard />,
    },
    {
      path: "/user-assigned",
      element: <AdminUserAssigned />,
    },
    {
      path: "/settings",
      element: <AdminSettings />,
    },
    {
      path: "*",
      element: <Navigate to={`/admin/${uniqueId}`} replace />,
    },
  ];

  return (
    <div className="min-h-screen bg-(--bg) text-(--text-primary) flex flex-col">
      <AdminNavbar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 relative">
        <AdminSidebar
          uniqueId={uniqueId}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  );
}
