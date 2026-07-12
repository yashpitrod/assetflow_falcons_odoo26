export default function Input({ icon: Icon, trailing, className = "", ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      )}
      <input
        {...props}
        className={`w-full pl-10 ${trailing ? "pr-10" : "pr-4"} py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 ${className}`}
      />
      {trailing && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  );
}
