"use client";

export default function PrintResultButton() {
  return (
    <button
      className="result-icon-button result-print-button"
      type="button"
      onClick={() => window.print()}
      aria-label="Print or save as PDF"
      title="Print / Save as PDF"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8V3h10v5" />
        <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
        <path d="M7 14h10v7H7z" />
        <path d="M17 12h.01" />
      </svg>
    </button>
  );
}
