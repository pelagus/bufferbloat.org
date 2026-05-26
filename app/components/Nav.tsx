import Link from "next/link";

export default function Nav() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-logo">
        bufferbl(◉)at
      </Link>

      <div className="site-links">
        <Link href="/test">test</Link>
        <Link href="/cli">cli</Link>
        <Link href="/learn">learn</Link>
        <Link href="/docs">docs</Link>
      </div>
    </nav>
  );
}
