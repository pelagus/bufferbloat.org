"use client";

import type { ReactNode } from "react";
import type { Grade } from "../../../lib/test-copy";
import { severityClass } from "./diagnosis";

export default function ResultCard({
  grade,
  diagnosis,
  measuredAt,
  methodologyVersion,
  scorecardMetrics,
  finding,
  applicationRankings,
  scoredMeasurements,
  chartSlot,
  technicalRows,
  signupSlot,
}: {
  grade: Grade;
  diagnosis: {
    headline: string;
    label: string;
    bullets: string[];
  };
  measuredAt: string;
  methodologyVersion: string;
  scorecardMetrics: Array<{
    label: string;
    value: string;
    tone?: "primary" | "secondary";
  }>;
  finding: string;
  applicationRankings: Array<{
    symbol: string;
    name: string;
    label: string;
    tone: "excellent" | "good" | "fair" | "poor";
    score: number;
  }>;
  scoredMeasurements: Array<{
    label: string;
    median: string;
    delta: string;
    detail: string;
  }>;
  chartSlot?: ReactNode;
  technicalRows: Array<{
    metric: string;
    value: string;
    note: string;
  }>;
  signupSlot?: ReactNode;
}) {
  const formattedMeasuredAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(measuredAt));

  return (
    <section className="result-card result-scorecard terminal-card">
      <div className="result-compact-header">
        <div className="result-brand-lockup" aria-label="Bufferbloat.org">
          <strong>Bufferbloat.org</strong>
          <span>
            open source responsiveness test · Measured {formattedMeasuredAt} ·{" "}
            {methodologyVersion}
          </span>
        </div>

        <button
          className="result-print-button"
          type="button"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      <div className="result-scorecard-grid">
        <div className="result-grade">
          <p>grade</p>
          <strong className={`${severityClass(grade)} ${grade === "A+" ? "grade-plus" : ""}`}>
            {grade}
          </strong>
          <span>{diagnosis.label}</span>
        </div>

        <div className="result-scorecard-body">
          <p className="result-finding">{finding}</p>

          <div className="result-metric-grid">
            {scorecardMetrics.map((item) => (
              <article className={item.tone ?? "primary"} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </div>

      {chartSlot}

      <div className="result-applications">
        <div className="result-section-heading">
          <span>Application fit, ranked</span>
        </div>

        <ol className="application-ranking-list">
          {applicationRankings.map((item, index) => (
            <li className={item.tone} key={item.name}>
              <span className="application-rank">{index + 1}</span>
              <span className="reliability-symbol" aria-hidden="true">
                {item.symbol}
              </span>
              <strong>{item.name}</strong>
              <em>{item.label}</em>
            </li>
          ))}
        </ol>
      </div>

      {signupSlot}

      <details className="technical-details">
        <summary>Technical details</summary>
        <div className="result-summary-grid scored">
          {scoredMeasurements.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.median}</strong>
              <em>{item.delta}</em>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {technicalRows.map((row) => (
              <tr key={row.metric}>
                <th scope="row">{row.metric}</th>
                <td>{row.value}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <a className="methodology-row" href="/docs">
        Measurement methodology
        <span aria-hidden="true">›</span>
      </a>
    </section>
  );
}
