import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import GlassCard from '../components/GlassCard';
import { login } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Frontend validation — UX only, backend validates server-side
  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email is not valid';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 4) errs.password = 'Password must be at least 4 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await login(form);
      authLogin(res.data.user, res.data.token);
      addToast(`Welcome back, ${res.data.user.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md" padding="p-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Zap size={28} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">AssetFlow</h1>
          <p className="text-text-dim text-sm mt-1">Enterprise Asset Management</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="eyebrow">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="email"
              className="glass-input pl-10"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          {errors.email && <p className="text-status-danger text-xs">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="eyebrow">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="glass-input pl-10 pr-10"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-status-danger text-xs">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-text-dim hover:text-accent-yellow transition-colors">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-yellow w-full mt-2" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>


      <p className="text-center text-text-dim text-sm mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-accent-yellow hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </GlassCard>
  );
}
