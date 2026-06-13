import { useEffect, useMemo, useState } from "react";
import {
  filterMatches,
  resolveBracket,
  sortMatches,
  type MatchFilter,
  type SortKey,
  type Tournament,
} from "@worldcup/data";
import { FilterBar } from "./components/FilterBar";
import { FixtureCard } from "./components/FixtureCard";
import { fetchLatestTournament, loadBakedTournament } from "./data/loader";

export default function App() {
  // Seed with whatever the build baked in; refresh from upstream in the bg.
  const [tournament, setTournament] = useState<Tournament>(() =>
    loadBakedTournament(),
  );
  const [filter, setFilter] = useState<MatchFilter>({});
  const [sortKey, setSortKey] = useState<SortKey>("kickoff");
  const [refreshState, setRefreshState] = useState<
    "idle" | "refreshing" | "updated" | "offline"
  >("idle");

  // Resolve bracket placeholders any time the underlying data changes.
  const resolved = useMemo(() => {
    const { matches, unresolvedSlots } = resolveBracket(tournament.matches);
    return {
      tournament: { ...tournament, matches },
      unresolvedSlots,
    };
  }, [tournament]);

  // Apply filters + sort.
  const matches = useMemo(() => {
    const filtered = filterMatches(resolved.tournament, filter);
    return sortMatches(filtered, sortKey);
  }, [resolved.tournament, filter, sortKey]);

  // Background refresh from upstream — service worker also caches this.
  useEffect(() => {
    const ctrl = new AbortController();
    setRefreshState("refreshing");
    fetchLatestTournament(ctrl.signal)
      .then((fresh) => {
        setTournament((prev) =>
          prev.matches.length === fresh.matches.length &&
          JSON.stringify(prev.matches) === JSON.stringify(fresh.matches)
            ? prev
            : fresh,
        );
        setRefreshState("updated");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setRefreshState("offline");
      });
    return () => ctrl.abort();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12">
      <header className="pt-6 pb-3 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-pitch">World Cup</span>{" "}
          <span className="text-white">2026</span>
        </h1>
        <RefreshBadge state={refreshState} />
      </header>

      <FilterBar
        tournament={resolved.tournament}
        filter={filter}
        onChange={setFilter}
      />

      <div className="mt-3 flex items-center justify-between text-sm text-white/70">
        <span>
          {matches.length} fixture{matches.length === 1 ? "" : "s"}
          {resolved.unresolvedSlots > 0 && (
            <span className="text-white/40">
              {" · "}
              {resolved.unresolvedSlots} bracket TBD
            </span>
          )}
        </span>
        <label className="inline-flex items-center gap-2">
          <span className="text-white/60">Sort</span>
          <select
            className="bg-white/10 text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pitch"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="kickoff">Date / time</option>
            <option value="city">Host city</option>
            <option value="group">Group</option>
            <option value="stage">Stage</option>
          </select>
        </label>
      </div>

      <ul className="mt-3 space-y-3">
        {matches.map((m) => (
          <li key={m.id}>
            <FixtureCard match={m} />
          </li>
        ))}
        {matches.length === 0 && (
          <li className="rounded-xl bg-white/5 border border-white/5 p-6 text-center text-white/60">
            No matches match your filters.
          </li>
        )}
      </ul>

      <footer className="mt-12 text-xs text-white/40 text-center">
        Data: openfootball/worldcup.json · Installable as a PWA · Works offline
      </footer>
    </div>
  );
}

function RefreshBadge({
  state,
}: {
  state: "idle" | "refreshing" | "updated" | "offline";
}) {
  const map = {
    idle: { text: "", cls: "" },
    refreshing: { text: "Refreshing…", cls: "bg-white/10 text-white/70" },
    updated: { text: "Up to date", cls: "bg-pitch/30 text-white/90" },
    offline: { text: "Offline (cached)", cls: "bg-white/10 text-white/60" },
  } as const;
  const { text, cls } = map[state];
  if (!text) return null;
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 ${cls}`}>{text}</span>
  );
}
