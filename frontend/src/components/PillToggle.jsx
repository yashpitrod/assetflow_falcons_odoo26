import { useState } from 'react';

// iOS-style pill toggle switch inside a glass pill container
export default function PillToggle({ checked = false, onChange, label = '' }) {
  const [isOn, setIsOn] = useState(checked);

  const toggle = () => {
    const next = !isOn;
    setIsOn(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-3 rounded-pill glass-surface px-4 py-2.5 cursor-pointer transition-all duration-200 hover:bg-white/[0.07]"
    >
      {label && <span className="text-text-secondary text-sm">{label}</span>}
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
          isOn ? 'bg-accent-yellow' : 'bg-white/10'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
            isOn ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}
