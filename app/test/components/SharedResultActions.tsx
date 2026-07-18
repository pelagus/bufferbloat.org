"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PrintResultButton from "./PrintResultButton";
import ResultSharePanel from "./ResultSharePanel";

const shareText =
  "I ran a Bufferbloat.org test to check how my internet connection performs under real load.";

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
      await navigator.clipboard.writeText(shareTarget);
      setShareMessage("Link copied.");
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
        <ResultSharePanel
          copyMessage={shareMessage}
          links={shareLinks}
          onCopy={copyShareText}
        />
      )}
    </div>
  );
}

export default function SharedResultActions() {
  return (
    <div className="result-share-actions">
      <div className="result-action-buttons">
        <Link className="result-rerun-button" href="/test">
          Run bufferbloat test
        </Link>
      </div>
    </div>
  );
}
