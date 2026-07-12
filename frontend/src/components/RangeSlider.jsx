// Custom range slider with triangular handle — only used for genuine numeric
// ranges (e.g. acquisition cost filter), not for enum values like priority.
export default function RangeSlider({ min = 0, max = 100, value = 50, onChange, label = '', showMinMax = true }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <span className="eyebrow">{label}</span>}
      <div className="relative w-full h-8 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-1.5 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-purple-from to-accent-yellow"
            style={{ width: `${percentage}%`, transition: 'width 0.15s ease' }}
          />
        </div>
        {/* Native input for accessibility, styled transparent */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="absolute w-full h-8 opacity-0 cursor-pointer z-10"
        />
        {/* Visual handle — triangle/diamond shape */}
        <div
          className="absolute w-4 h-4 pointer-events-none"
          style={{
            left: `calc(${percentage}% - 8px)`,
            transition: 'left 0.15s ease',
          }}
        >
          <div className="w-4 h-4 bg-accent-yellow rounded-sm rotate-45 shadow-lg shadow-yellow-500/20" />
        </div>
      </div>
      {showMinMax && (
        <div className="flex justify-between">
          <span className="eyebrow">{min}</span>
          <span className="text-text-secondary text-xs font-medium">{value}</span>
          <span className="eyebrow">{max}</span>
        </div>
      )}
    </div>
  );
}
