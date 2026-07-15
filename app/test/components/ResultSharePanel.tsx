"use client";

type ShareLinks = {
  email: string;
  whatsapp: string;
  telegram: string;
};

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.7 18.4 4 19l.7-2.6A8 8 0 1 1 12 20a8 8 0 0 1-5.3-1.6Z" />
      <path d="M9.2 8.4c.4 2.9 2 4.8 5.2 6.3l1.4-1.4" />
      <path d="m9.2 8.4 1.3-1.1" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 5 4 11.6l6 2.2L12.4 19l2.4-4.1L20 5Z" />
      <path d="m10 13.8 5.4-4.9" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M8.6 10.9 7.2 12.3a3.5 3.5 0 0 0 5 5l1.4-1.4" />
      <path d="m10.4 8.1 1.4-1.4a3.5 3.5 0 0 1 5 5l-1.4 1.4" />
    </svg>
  );
}

export default function ResultSharePanel({
  copyMessage,
  id = "result-share-panel",
  links,
  onCopy,
}: {
  copyMessage?: string;
  id?: string;
  links: ShareLinks;
  onCopy: () => void;
}) {
  return (
    <section className="result-share-panel compact" id={id} aria-label="Share bufferbloat test result">
      <strong>Share bufferbloat test result</strong>
      <div className="result-share-links compact" aria-label="Share options">
        <a className="email" href={links.email} aria-label="Share test result by email" title="Email">
          <MailIcon />
          <span>Email</span>
        </a>
        <a
          className="whatsapp"
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share test result on WhatsApp"
          title="WhatsApp"
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
        <a
          className="telegram"
          href={links.telegram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share test result on Telegram"
          title="Telegram"
        >
          <TelegramIcon />
          <span>Telegram</span>
        </a>
        <button className="copy" type="button" onClick={onCopy} aria-label="Copy test result link" title="Copy link">
          <LinkIcon />
          <span>Copy link</span>
        </button>
      </div>
      {copyMessage && <small>{copyMessage}</small>}
    </section>
  );
}
