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
  reliabilityGroups,
  scoredMeasurements,
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
  reliabilityGroups: Array<{
    title: string;
    tone: "reliable" | "unstable";
    items: Array<{
      symbol: string;
      name: string;
      label: string;
    }>;
  }>;
  scoredMeasurements: Array<{
    label: string;
    median: string;
    delta: string;
    detail: string;
  }>;
  technicalRows: Array<{
    metric: string;
    value: string;
    note: string;
  }>;
  signupSlot?: ReactNode;
}) {
  const formattedMeasuredAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(measuredAt));

  return (
    <section className="result-card result-scorecard terminal-card">
      <div className="result-compact-header">
        <div>
          <h2>Latency under load report</h2>
          <p>
            Measured {formattedMeasuredAt} · {methodologyVersion}
          </p>
        </div>
      </div>

      <div className="result-scorecard-grid">
        <div className="result-grade">
          <p>grade</p>
          <strong className={severityClass(grade)}>{grade}</strong>
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

      <div className="result-applications">
        <div className="result-section-heading">
          <span>What this network should handle</span>
        </div>

        <div className="reliability-groups">
          {reliabilityGroups.map((group) => (
            <section className={`reliability-group ${group.tone}`} key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <span className="reliability-symbol" aria-hidden="true">
                      {item.symbol}
                    </span>
                    <strong>{item.name}</strong>
                    <em>{item.label}</em>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
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
