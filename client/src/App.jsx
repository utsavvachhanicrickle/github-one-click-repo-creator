import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { fetchMe } from './store/slices/authSlice.js';
import { Loader2 } from 'lucide-react';

import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RepoDetail from './pages/RepoDetail.jsx';
import ForkFamilyDetail from './pages/ForkFamilyDetail.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const dispatch = useDispatch();
  const { authLoading, me } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-(--bg) flex items-center justify-center text-(--text-primary) transition-colors duration-300">
        <Loader2 className="animate-spin text-(--primary)" size={40} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--bg) text-(--text-primary) font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Toast Notification Container */}
      <Toast />

      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/fork-families/:parentOwner/:parentRepo"
          element={
            <ProtectedRoute>
              <ForkFamilyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/repos/:owner/:repo"
          element={
            <ProtectedRoute>
              <RepoDetail />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={me ? "/dashboard" : "/"} replace />} />
      </Routes>
    </main>
  );
}
