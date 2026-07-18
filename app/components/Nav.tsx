"use client";

import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-logo">
        <Image
          src="/brand-dot.svg"
          alt=""
          aria-hidden="true"
          className="brand-mark"
          width={18}
          height={18}
          priority
        />
        <span>bufferbloat.org</span>
      </Link>

      <div className="site-links">
        <Link href="/mission">mission</Link>
        <Link href="/learn">learn</Link>
        <Link href="/docs">docs</Link>
        <Link href="/contact">contact</Link>
        <a
          href="https://github.com/pelagus/bufferbloat.org"
          className="github-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0.2a8 8 0 0 0-2.53 15.59c0.4 0.07 0.55-0.17 0.55-0.38v-1.49c-2.24 0.49-2.71-0.95-2.71-0.95-0.36-0.93-0.89-1.18-0.89-1.18-0.73-0.5 0.06-0.49 0.06-0.49 0.81 0.06 1.23 0.83 1.23 0.83 0.72 1.23 1.88 0.87 2.34 0.67 0.07-0.52 0.28-0.87 0.51-1.07-1.79-0.2-3.67-0.89-3.67-3.98 0-0.88 0.31-1.6 0.83-2.16-0.08-0.2-0.36-1.02 0.08-2.13 0 0 0.68-0.22 2.2 0.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-0.82 2.2-0.82 0.44 1.11 0.16 1.93 0.08 2.13 0.52 0.56 0.83 1.28 0.83 2.16 0 3.09-1.88 3.77-3.67 3.97 0.29 0.25 0.55 0.74 0.55 1.49v2.21c0 0.21 0.14 0.46 0.55 0.38A8 8 0 0 0 8 0.2Z" />
          </svg>
          <span>source</span>
        </a>
      </div>
    </nav>
  );
}
