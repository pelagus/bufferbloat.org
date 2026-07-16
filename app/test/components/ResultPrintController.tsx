"use client";

import { useEffect } from "react";

export default function ResultPrintController() {
  useEffect(() => {
    const openedByPrint = new WeakSet<HTMLDetailsElement>();

    function technicalDetails() {
      return Array.from(
        document.querySelectorAll<HTMLDetailsElement>(".result-scorecard .technical-details")
      );
    }

    function handleBeforePrint() {
      technicalDetails().forEach((details) => {
        if (!details.open) {
          openedByPrint.add(details);
          details.open = true;
        }
      });
    }

    function handleAfterPrint() {
      technicalDetails().forEach((details) => {
        if (openedByPrint.has(details)) {
          details.open = false;
        }
      });
    }

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return null;
}
