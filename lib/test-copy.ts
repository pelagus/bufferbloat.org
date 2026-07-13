export type Grade = "A+" | "A" | "B" | "C" | "D" | "F" | "—";

export const initialTestMessage =
  "Check whether your internet stays smooth when the network gets busy.";

export const preTestInstruction =
  "Keep this tab visible and avoid switching apps during the test. That gives the browser the priority it needs to measure timing cleanly.";

export const diagnosisCopy: Record<
  Grade,
  {
    summary: string;
    impact: string;
    fix: string;
  }
> = {
  "—": {
    summary: "Ready to test.",
    impact: "The test has not run yet.",
    fix: "Start the test to measure responsiveness under load.",
  },
  "A+": {
    summary: "Excellent under pressure.",
    impact:
      "Latency stayed very low and very stable while the connection was busy.",
    fix: "No responsiveness issue detected.",
  },
  A: {
    summary: "Stable under pressure.",
    impact:
      "Your connection stayed responsive while busy, which is what matters for calls, games, and everyday browsing.",
    fix: "No major responsiveness issue detected.",
  },
  B: {
    summary: "Mostly stable under pressure.",
    impact:
      "You may see small slowdowns while the connection is busy, but normal calls and browsing should usually hold up.",
    fix: "No urgent fix needed. SQM may still improve consistency.",
  },
  C: {
    summary: "Usable, but fragile when busy.",
    impact:
      "The connection should work most of the time, but heavy uploads, backups, or downloads can still cause noticeable stutter.",
    fix: "Router-level traffic control should make the connection feel steadier.",
  },
  D: {
    summary: "Fast on paper, frustrating under pressure.",
    impact:
      "Your connection answers quickly when quiet, then slows sharply when uploads or downloads start. That is why calls freeze, games lag, and pages hang even when speed tests look fine.",
    fix:
      "Look for Smart Queue Management on your router. The technical names to search for are SQM, CAKE, or fq_codel.",
  },
  F: {
    summary: "Severe latency collapse under load.",
    impact:
      "Latency rose dramatically while the connection was busy. Real-time applications are likely to stall whenever upload or download traffic competes for the line.",
    fix:
      "This is the clearest case for router-level Smart Queue Management. Search for SQM, CAKE, or fq_codel support on your router.",
  },
};
