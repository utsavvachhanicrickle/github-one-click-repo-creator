import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import { fetchMe } from "./store/slices/authSlice.js";
import { Loader2 } from "lucide-react";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminApp from "./portal/admin/AdminApp.jsx";
import PersonalApp from "./portal/personal/PersonalApp.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";

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

  const routes = [
    {
      path: "/",
      element: (
          <Home />
      ),
    },
    {
      path: "/login",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },
    {
      path: "/register",
      element: (
        <PublicRoute>
          <Register />
        </PublicRoute>
      ),
    },
    {
      path: "/admin/:uniqueId/*",
      element: (
        <ProtectedRoute>
          <AdminApp />
        </ProtectedRoute>
      ),
    },
    {
      path: "/id/:uniqueId/*",
      element: (
        <ProtectedRoute>
          <PersonalApp />
        </ProtectedRoute>
      ),
    },
    {
      path: "*",
      element: me ? (
        me.role === "admin" ? (
          <Navigate to={`/admin/${me.unique_id}`} replace />
        ) : (
          <Navigate to={`/id/${me.unique_id}`} replace />
        )
      ) : (
        <Navigate to="/login" replace />
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-(--bg) text-(--text-primary) font-sans relative overflow-x-hidden transition-colors duration-300">
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </main>
  );
}
