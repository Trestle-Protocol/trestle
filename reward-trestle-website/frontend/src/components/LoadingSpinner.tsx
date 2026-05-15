export default function LoadingSpinner({ size = 40, label = "Loading..." }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status">
      <svg className="animate-spin text-emerald-600" width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="70 30" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}