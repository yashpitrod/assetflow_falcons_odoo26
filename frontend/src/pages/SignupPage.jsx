import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, User, Mail, Lock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import GlassCard from '../components/GlassCard';
import { signup } from '../api/auth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Signup always creates Employee — no role picker per architecture.md
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email is not valid';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await signup({ name: form.name, email: form.email, password: form.password });
      authLogin(res.data.user, res.data.token);
      addToast('Account created! Welcome to AssetFlow.', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, type = 'text', icon: Icon, placeholder, field, error }) => (
    <div className="flex flex-col gap-1.5">
      <label className="eyebrow">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />}
        <input
          id={id}
          type={type}
          className={`glass-input ${Icon ? 'pl-10' : ''}`}
          placeholder={placeholder}
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        />
      </div>
      {error && <p className="text-status-danger text-xs">{error}</p>}
    </div>
  );

  return (
    <GlassCard className="w-full max-w-md" padding="p-8">
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Zap size={28} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Create Account</h1>
          <p className="text-text-dim text-sm mt-1">You'll be added as an Employee</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field id="name" label="Full Name" icon={User} placeholder="Yash Pitrod" field="name" error={errors.name} />
        <Field id="email" label="Work Email" icon={Mail} type="email" placeholder="you@company.com" field="email" error={errors.email} />
        <Field id="password" label="Password" icon={Lock} type="password" placeholder="Min. 6 characters" field="password" error={errors.password} />
        <Field id="confirm" label="Confirm Password" icon={Lock} type="password" placeholder="Repeat password" field="confirmPassword" error={errors.confirmPassword} />

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2 mt-1">
          <Building2 size={14} className="text-text-dim mt-0.5 shrink-0" />
          <p className="text-text-dim text-xs">
            Your account starts as <strong className="text-text-secondary">Employee</strong> role.
            An Admin can promote you to Department Head or Asset Manager from the Employee Directory.
          </p>
        </div>

        <button type="submit" className="btn-yellow w-full mt-1" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-text-dim text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-accent-yellow hover:underline font-medium">Sign in</Link>
      </p>
    </GlassCard>
  );
}
