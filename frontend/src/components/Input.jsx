import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Input({
  id,
  label,
  type = 'text',
  icon: Icon,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="eyebrow">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim flex items-center justify-center w-5 h-5">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          type={actualType}
          className={`glass-input ${Icon ? 'pl-11' : ''} ${isPassword ? 'pr-11' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-secondary transition-colors flex items-center justify-center w-5 h-5 p-0 bg-transparent border-none cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-status-danger text-xs">{error}</p>}
    </div>
  );
}
