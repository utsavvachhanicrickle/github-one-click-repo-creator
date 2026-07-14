import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';

export default function PublicRoute({ children }) {
  const { me, authLoading } = useSelector((state) => state.auth);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-(--bg) flex items-center justify-center text-(--text-primary) transition-colors duration-300">
        <Loader2 className="animate-spin text-(--primary)" size={40} />
      </main>
    );
  }

  if (me) {
    if (me.role === 'admin') {
      return <Navigate to={`/admin/${me.unique_id}`} replace />;
    } else {
      return <Navigate to={`/id/${me.unique_id}`} replace />;
    }
  }

  return children;
}
