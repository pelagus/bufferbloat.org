"use client";

import type { ReactNode } from "react";
import type { Grade } from "../../../lib/test-copy";
import ApplicationIcon from "./ApplicationIcon";
import { severityClass } from "./diagnosis";
import LocalMeasuredTime from "./LocalMeasuredTime";
import ResultPrintController from "./ResultPrintController";

type TechnicalRow = {
  section: string;
  metric: string;
  value: string;
  unit?: string;
  note: string;
};

type ContextItem = {
  label: string;
  headline: string;
  value: string;
  detail: string;
  tone: "good" | "ok" | "warn" | "bad";
};

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function variableName(row: TechnicalRow) {
  const baseName = row.metric
    .trim()
    .replace(/^\d+\.\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (row.unit === "ms" && !baseName.endsWith("_ms")) return `${baseName}_ms`;
  if (row.unit === "Mbps" && !baseName.endsWith("_mbps")) return `${baseName}_mbps`;
  if (row.unit === "MB" && !baseName.endsWith("_mb")) return `${baseName}_mb`;
  if (row.unit === "sec" && !baseName.endsWith("_sec")) return `${baseName}_sec`;
  if (row.unit === "/100" && !baseName.endsWith("_score")) return `${baseName}_score`;

  return baseName;
}

function variableLabel(row: TechnicalRow) {
  if (row.unit) return `${row.metric} (${row.unit})`;
  return row.metric;
}

export default function ResultCard({
  grade,
  diagnosis,
  measuredAt,
  contextItems,
  applicationRankings,
  chartSlot,
  headerActions,
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
  contextItems: ContextItem[];
  applicationRankings: Array<{
    symbol: string;
    name: string;
    label: string;
    tone: "excellent" | "good" | "fair" | "poor";
    score: number;
  }>;
  chartSlot?: ReactNode;
  headerActions?: ReactNode;
  technicalRows: TechnicalRow[];
  signupSlot?: ReactNode;
}) {
  function exportTechnicalDetails() {
    const rows = [
      ["Variable", "Value"],
      ...technicalRows.map((row) => [
        variableName(row),
        row.value,
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
      <ResultPrintController />
      <div className="result-compact-header">
        <div className="result-brand-lockup" aria-label="Internet quality assessment">
          <div className="result-brand-title">
            <strong>Internet quality assessment</strong>
          </div>
          <span className="result-powered-by">
            Powered by <img src="/brand-dot.svg" alt="" aria-hidden="true" /> bufferbloat.org ·{" "}
            <LocalMeasuredTime isoTime={measuredAt} />
          </span>
        </div>
        {headerActions}
      </div>

      <div className="result-scorecard-grid">
        <div className="result-grade">
          <strong className={`${severityClass(grade)} ${grade === "A+" ? "grade-plus" : ""}`}>
            {grade}
          </strong>
          <span className={severityClass(grade)}>{diagnosis.label}</span>
        </div>

        <div className="result-scorecard-body">
          <div className="result-diagnosis-blocks" aria-label="Result diagnosis">
            {contextItems.map((item) => (
              <article className={item.tone} key={item.label}>
                <strong className="result-diagnosis-headline">{item.headline}</strong>
                <ul>
                  {item.value.split("\n").map((line, index) => (
                    <li key={`${item.label}-${index}`}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="result-evidence-row">
          <div className="result-applications">
            <div className="result-section-heading">
              <span>Network application performance</span>
            </div>

          <ol className="application-ranking-list">
            {applicationRankings.map((item) => (
              <li className={item.tone} key={item.name}>
                <ApplicationIcon name={item.name} />
                <span className="application-copy">
                  <strong>{item.name}</strong>
                  <em>{item.label}</em>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="result-chart-cell">{chartSlot}</div>
      </div>

      {signupSlot}

      <details className="technical-details">
        <summary>
          <span className="technical-summary-label">
            <strong>Inspect measurement data</strong>
            <small>Open table · Export CSV</small>
          </span>
        </summary>

        <div className="technical-table-header">
          <a
            className="technical-methodology-link"
            href="/learn/technical-details-export"
            rel="noopener noreferrer"
            target="_blank"
          >
            How to inspect and export this data
          </a>
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
              <th>Variable</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {technicalRows.map((row) => (
              <tr key={`${row.section}-${row.metric}`}>
                <th scope="row">{variableLabel(row)}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
