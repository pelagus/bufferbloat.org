"use client";

export default function PrintResultButton() {
  return (
    <button className="result-print-button" type="button" onClick={() => window.print()}>
      Print / Save as PDF
    </button>
  );
}
