export function ButtonLoader({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`button-loader size-4 shrink-0 animate-spin ${className}`}
      fill="none"
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
      <path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
