export default function TestResult() {
  return (
    <div className="terminal-card">
      <p className="text-neutral-500">simulated result</p>

      <pre className="mt-4 leading-7 whitespace-pre-wrap">{`Idle latency .......... 12ms
Download loaded ........ 214ms
Upload loaded .......... 387ms

Bufferbloat grade ...... D

Likely issue:
Upload queue congestion detected.`}</pre>
    </div>
  );
}
