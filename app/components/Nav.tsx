"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const showTestLink = pathname !== "/test";

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
        {showTestLink && <Link href="/test">test</Link>}
        <Link href="/learn">learn</Link>
        <Link href="/contact">contact</Link>
      </div>
    </nav>
  );
}
