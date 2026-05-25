import Link from "next/link";

export default function Nav() {
  return (
    <nav className="w-full border-b border-neutral-200 px-6 py-4 font-mono text-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/" className="font-bold">
          bufferbl(◉)at.org
        </Link>

        <div className="flex gap-4">
          <Link href="/test">test</Link>
          <Link href="/cli">cli</Link>
          <Link href="/learn">learn</Link>
          <Link href="/docs">docs</Link>
        </div>
      </div>
    </nav>
  );
}
