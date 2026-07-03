/** The dharma-wheel hairline divider used between sections. */
export function DharmaDivider() {
  return (
    <div className="divider">
      <span className="divider-symbol" aria-hidden="true">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        >
          <circle cx="16" cy="16" r="11" />
          <path d="M16 10.5 L21.5 16 L16 21.5 L10.5 16 Z" fill="currentColor" stroke="none" />
          <circle cx="16" cy="3.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="16" cy="28.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="16" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="28.5" cy="16" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </span>
    </div>
  );
}
