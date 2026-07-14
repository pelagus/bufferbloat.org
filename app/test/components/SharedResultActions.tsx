"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PrintResultButton from "./PrintResultButton";

const shareText =
  "I used Bufferbloat.org to check how my internet connection performs in real-life situations. It is more accurate than an ordinary speed test for this question, non-commercial, and open source.";

function useShareLinks(sharePath: string) {
  const shareTarget = `https://bufferbloat.org${sharePath}`;
  const shareLinks = useMemo(() => {
    const encodedShareText = encodeURIComponent(`${shareText} ${shareTarget}`.trim());
    const encodedShareUrl = encodeURIComponent(shareTarget);
    const encodedEmailBody = encodeURIComponent(`${shareText}\n\n${shareTarget}`);

    return {
      email: `mailto:?subject=My Bufferbloat.org result&body=${encodedEmailBody}`,
      whatsapp: `https://wa.me/?text=${encodedShareText}`,
      telegram: `https://t.me/share/url?url=${encodedShareUrl}&text=${encodeURIComponent(shareText)}`,
    };
  }, [shareTarget]);

  return { shareLinks, shareTarget };
}

export function SharedResultHeaderActions({ sharePath }: { sharePath: string }) {
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const { shareLinks, shareTarget } = useShareLinks(sharePath);

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareTarget}`);
      setShareMessage("Share text copied.");
    } catch {
      setShareMessage(shareTarget);
    }
  }

  return (
    <div className="result-header-actions">
      <div className="result-action-buttons">
        <PrintResultButton />

        <button
          aria-controls="result-share-panel"
          aria-expanded={sharePanelOpen}
          aria-label="Share result"
          className="result-icon-button result-share-button"
          onClick={() => {
            setSharePanelOpen((current) => !current);
          }}
          title="Share result"
          type="button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M12 16V4" />
            <path d="M8 8l4-4 4 4" />
          </svg>
        </button>
      </div>

      {sharePanelOpen && (
        <section className="result-share-panel" id="result-share-panel" aria-label="Share result">
          <p>{shareText}</p>
          <div className="result-share-links">
            <a href={shareLinks.email}>Email</a>
            <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer">
              Telegram
            </a>
            <button type="button" onClick={copyShareText}>
              Copy
            </button>
          </div>
        </section>
      )}

      {shareMessage && <p>{shareMessage}</p>}
    </div>
  );
}

export default function SharedResultActions() {
  return (
    <div className="result-share-actions">
      <div className="result-action-buttons">
        <Link className="result-rerun-button" href="/test?start=1">
          Run bufferbloat test
        </Link>
      </div>
    </div>
  );
}
