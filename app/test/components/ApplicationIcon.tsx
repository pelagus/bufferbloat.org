type ApplicationIconProps = {
  name: string;
};

function iconKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function ApplicationIcon({ name }: ApplicationIconProps) {
  const key = iconKey(name);

  return (
    <span className="application-icon" aria-hidden="true">
      {key.includes("web") ? (
        <svg viewBox="0 0 48 48" role="img">
          <rect x="7" y="10" width="34" height="27" rx="2" />
          <path d="M7 17h34M17 37h14M21 42h6" />
          <path d="M16 27h16M16 23h10M16 31h7" />
        </svg>
      ) : key.includes("audio") ? (
        <svg viewBox="0 0 48 48" role="img">
          <path d="M20 18 31 10v28L20 30H11V18h9Z" />
          <path d="M36 18c2.3 3.7 2.3 8.3 0 12M40 14c4.3 6 4.3 14 0 20" />
        </svg>
      ) : key.includes("stream") ? (
        <svg viewBox="0 0 48 48" role="img">
          <rect x="7" y="10" width="34" height="28" rx="2" />
          <path d="M21 18v12l11-6-11-6Z" />
          <path d="M15 42h18" />
        </svg>
      ) : key.includes("voice") ? (
        <svg viewBox="0 0 48 48" role="img">
          <path d="M17 11h14l3 8-6 3c-1.4 5.8-5.2 9.6-11 11l-3 6-8-3V22c0-6.1 4.9-11 11-11Z" />
          <path d="M18 17c5 0 9 4 9 9M18 23c1.7 0 3 1.3 3 3" />
        </svg>
      ) : key.includes("video-calls") ? (
        <svg viewBox="0 0 48 48" role="img">
          <rect x="7" y="14" width="25" height="21" rx="2" />
          <path d="M32 21l9-5v17l-9-5" />
          <path d="M14 21h10M14 27h7" />
        </svg>
      ) : key.includes("game") ? (
        <svg viewBox="0 0 48 48" role="img">
          <path d="M15 20h18c4.4 0 8 3.6 8 8v6c0 2.2-1.8 4-4 4-2.8 0-4.5-4-7-4H18c-2.5 0-4.2 4-7 4-2.2 0-4-1.8-4-4v-6c0-4.4 3.6-8 8-8Z" />
          <path d="M16 26v8M12 30h8M30 29h.1M36 33h.1" />
        </svg>
      ) : key.includes("cloud") ? (
        <svg viewBox="0 0 48 48" role="img">
          <path d="M16 36h18a8 8 0 1 0-2-15.7A11 11 0 0 0 11 24a6 6 0 0 0 5 12Z" />
          <path d="M24 32V19M19 24l5-5 5 5" />
        </svg>
      ) : (
        <svg viewBox="0 0 48 48" role="img">
          <circle cx="24" cy="24" r="14" />
          <path d="M24 14v20M14 24h20" />
        </svg>
      )}
    </span>
  );
}
