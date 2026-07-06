import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';

export default function PublicRoute({ children }) {
  const { me, authLoading } = useSelector((state) => state.auth);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </main>
    );
  }

  if (me) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
