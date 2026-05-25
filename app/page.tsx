export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-6">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          <div className="text-3xl md:text-5xl font-mono font-bold tracking-tight">
            bufferbl(◉)at.org
          </div>

          <p className="mt-6 text-lg md:text-xl text-neutral-700 max-w-2xl leading-relaxed">
            Diagnose bufferbloat. Understand your Internet. Fix what’s broken.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mt-8">
          <a
            href="/test"
            className="border border-black px-5 py-3 font-mono hover:bg-black hover:text-white transition"
          >
            Run a test
          </a>

          <a
            href="/cli"
            className="border border-neutral-300 px-5 py-3 font-mono hover:border-black transition"
          >
            Install CLI
          </a>
        </div>

        <div className="mt-20 border border-neutral-200 p-6 font-mono text-sm bg-neutral-50 overflow-hidden">
          <div className="mb-4 text-neutral-500">
            simulated network test
          </div>

          <pre className="leading-7 whitespace-pre-wrap">
            {`Idle latency .......... 12ms
Download loaded ........ 214ms
Upload loaded .......... 387ms

Bufferbloat grade ...... D

Likely issue:
Upload queue congestion detected.`}
          </pre>
        </div>
      </div>
    </main>
  );
}
