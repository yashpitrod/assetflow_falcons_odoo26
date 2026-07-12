// Small circular progress ring — used inside GradientTiles for sub-metrics.
export default function CircularProgressRing({ percentage = 0, size = 56, strokeWidth = 4, color = '#FACC15', label = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center} cy={center} r={radius}
            stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none"
          />
          <circle
            cx={center} cy={center} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-text-primary">{percentage}%</span>
        </div>
      </div>
      {label && <span className="text-text-dim text-[0.6rem] uppercase tracking-wider">{label}</span>}
    </div>
  );
}
