import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <span>Bufferbloat.org</span>
      <nav aria-label="Legal and contact links">
        <Link href="/privacy">privacy</Link>
        <Link href="/contact">contact</Link>
        <a href="https://github.com/pelagus/bufferbloat.org/blob/main/LICENSE">
          license
        </a>
      </nav>
    </footer>
  );
}
