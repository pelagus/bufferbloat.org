"use client";

import type { ReactNode } from "react";
import type { Grade } from "../../../lib/test-copy";
import { severityClass } from "./diagnosis";

type TechnicalRow = {
  section: string;
  metric: string;
  value: string;
  unit?: string;
  note: string;
};

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function ResultCard({
  grade,
  diagnosis,
  measuredAt,
  scorecardMetrics,
  finding,
  applicationRankings,
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
  chartSlot?: ReactNode;
  technicalRows: TechnicalRow[];
  signupSlot?: ReactNode;
}) {
  const formattedMeasuredAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(measuredAt));

  function exportTechnicalDetails() {
    const rows = [
      ["Section", "Metric", "Value", "Unit", "Notes"],
      ...technicalRows.map((row) => [
        row.section,
        row.metric,
        row.value,
        row.unit ?? "",
        row.note,
      ]),
    ];
    const csv = `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSlug = measuredAt.slice(0, 10);

    link.href = url;
    link.download = `bufferbloat-test-details-${dateSlug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="result-card result-scorecard terminal-card">
      <div className="result-compact-header">
        <div className="result-brand-lockup" aria-label="Bufferbloat.org">
          <strong>Bufferbloat.org</strong>
          <span>
            open source responsiveness test · Measured {formattedMeasuredAt}
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

      <div className="result-evidence-row">
        <div className="result-chart-cell">{chartSlot}</div>

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
      </div>

      {signupSlot}

      <details className="technical-details">
        <summary>
          <span className="technical-summary-label">
            Technical details, exportable as CSV
          </span>
        </summary>

        <div className="technical-table-header">
          <span>Measurement record</span>
          <button
            aria-label="Export technical details as CSV"
            className="technical-export-button"
            onClick={exportTechnicalDetails}
            title="Export technical details as CSV"
            type="button"
          >
            <span aria-hidden="true">⇩</span>
            Export CSV
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>Metric</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {technicalRows.map((row) => (
              <tr key={`${row.section}-${row.metric}`}>
                <th scope="row">{row.section}</th>
                <td>{row.metric}</td>
                <td>{row.value}</td>
                <td>{row.unit ?? "—"}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <a className="methodology-row" href="/docs" rel="noopener noreferrer" target="_blank">
        Measurement methodology
        <span aria-hidden="true">›</span>
      </a>
    </section>
  );
}
