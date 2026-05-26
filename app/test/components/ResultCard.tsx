"use client";

import type { Grade } from "../../../lib/test-copy";
import { severityClass } from "./diagnosis";

export default function ResultCard({
  grade,
  diagnosis,
  technical,
}: {
  grade: Grade;
  diagnosis: {
    headline: string;
    label: string;
    bullets: string[];
  };
  technical: string;
}) {
  return (
    <section className="result-card terminal-card">
      <div className="result-layout">
        <div className="result-grade">
          <p>responsiveness grade</p>
          <strong className={severityClass(grade)}>{grade}</strong>
          <span>{diagnosis.label}</span>
        </div>

        <div>
          <h2 className={severityClass(grade)}>{diagnosis.headline}</h2>

          <ul className="diagnosis-list">
            {diagnosis.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <details className="technical-details">
        <summary>Show technical measurements</summary>
        <p className="muted">{technical}</p>
      </details>
    </section>
  );
}
