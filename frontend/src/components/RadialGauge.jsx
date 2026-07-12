import DotMatrixValue from './DotMatrixValue';

// Circular radial gauge — dial with tick marks, center value, min/max labels.
// Primary KPI display for Dashboard hero (e.g. Fleet Utilization %).
export default function RadialGauge({ value = 0, max = 100, label = '', subtitle = '', size = 200 }) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  // Generate tick marks around the gauge perimeter
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const angle = (i * 10 - 90) * (Math.PI / 180);
    const outerR = radius + 4;
    const innerR = radius - (i % 3 === 0 ? 8 : 4);
    return {
      x1: center + Math.cos(angle) * innerR,
      y1: center + Math.sin(angle) * innerR,
      x2: center + Math.cos(angle) * outerR,
      y2: center + Math.sin(angle) * outerR,
      major: i % 3 === 0,
    };
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
              stroke={tick.major ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={tick.major ? 1.5 : 0.8}
            />
          ))}
          {/* Background track */}
          <circle
            cx={center} cy={center} r={radius}
            stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none"
          />
          {/* Progress arc */}
          <circle
            cx={center} cy={center} r={radius}
            stroke="url(#gaugeGradient)" strokeWidth="8" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C026D3" />
              <stop offset="100%" stopColor="#FACC15" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <DotMatrixValue value={value} suffix="%" size="md" />
        </div>
      </div>
      {/* Min / Max labels */}
      <div className="flex justify-between w-full px-4">
        <span className="eyebrow">MIN 0</span>
        <span className="eyebrow">MAX {max}</span>
      </div>
      {/* Labels */}
      {label && <span className="text-text-primary font-medium text-sm">{label}</span>}
      {subtitle && <span className="text-text-dim text-xs">{subtitle}</span>}
    </div>
  );
}
