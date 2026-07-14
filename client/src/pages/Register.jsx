import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../store/slices/authSlice.js';
import { User, Mail, Lock, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from '../utils/Toast.js';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await dispatch(registerUser({ email, password, name })).unwrap();
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6 relative min-h-screen bg-(--bg) select-none">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-(--glow-1) rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-(--glow-2) rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-(--bg-primary) border border-(--border) rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 text-left">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-(--text-primary) tracking-tight">
            Create Account
          </h2>
          <p className="text-xs text-(--text-secondary) font-semibold">
            Join RepoSync to automate templates and git management.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-(--text-secondary) block">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-secondary)">
                <User size={16} />
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                disabled={loading}
                className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-(--text-secondary) block">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-secondary)">
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-(--text-secondary) block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-secondary)">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl pl-10 pr-10 py-3 text-xs font-semibold text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-(--text-secondary) hover:text-(--text-primary) cursor-pointer select-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-(--text-secondary) block">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-secondary)">
                <KeyRound size={16} />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-(--bg-secondary) border border-(--border) rounded-xl pl-10 pr-10 py-3 text-xs font-semibold text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--primary) transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-(--text-secondary) hover:text-(--text-primary) cursor-pointer select-none"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-(--primary) hover:bg-(--primary-hover) text-(--text-inverse) font-extrabold py-3.5 rounded-xl transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Creating Account...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-(--border)/60 text-xs text-(--text-secondary)">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-(--primary) hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
