import { useEffect, useState } from "react";

const TABS = ["fixtures", "groups", "teams", "bracket"] as const;
export type Tab = (typeof TABS)[number];

function readHash(): Tab {
  const raw = (typeof window !== "undefined" ? window.location.hash : "")
    .replace(/^#\/?/, "")
    .toLowerCase();
  return (TABS as readonly string[]).includes(raw) ? (raw as Tab) : "fixtures";
}

/** Tab state synced bidirectionally with the URL hash. */
export function useHashTab(): [Tab, (next: Tab) => void] {
  const [tab, setTab] = useState<Tab>(() => readHash());

  useEffect(() => {
    const onHash = () => setTab(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const set = (next: Tab) => {
    if (next === tab) return;
    window.location.hash = `#/${next}`;
    setTab(next);
  };

  return [tab, set];
}

export const TAB_ORDER = TABS;
