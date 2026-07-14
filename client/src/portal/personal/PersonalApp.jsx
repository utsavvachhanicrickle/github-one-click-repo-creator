import { useState } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import PersonalNavbar from './components/PersonalNavbar.jsx';
import PersonalSidebar from './components/PersonalSidebar.jsx';
import PersonalDashboard from './pages/PersonalDashboard.jsx';
import RepoDetail from '../../pages/RepoDetail.jsx';
import ForkFamilyDetail from '../../pages/ForkFamilyDetail.jsx';

export default function PersonalApp() {
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
      element: <PersonalDashboard />
    },
    {
      path: "/repos/:owner/:repo",
      element: <RepoDetail />
    },
    {
      path: "/fork-families/:parentOwner/:parentRepo",
      element: <ForkFamilyDetail />
    },
    {
      path: "*",
      element: <Navigate to={`/id/${uniqueId}`} replace />
    }
  ];

  return (
    <div className="min-h-screen bg-(--bg) text-(--text-primary) flex flex-col">
      <PersonalNavbar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 relative">
        <PersonalSidebar
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
