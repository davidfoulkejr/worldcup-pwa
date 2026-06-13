import { useEffect, useMemo, useState } from "react";
import { resolveBracket, type Tournament } from "@worldcup/data";
import { TabBar } from "./components/TabBar";
import { useHashTab } from "./lib/useHashTab";
import { FixturesView } from "./views/FixturesView";
import { GroupsView } from "./views/GroupsView";
import { TeamsView } from "./views/TeamsView";
import { fetchLatestTournament, loadBakedTournament } from "./data/loader";

export default function App() {
  const [tournament, setTournament] = useState<Tournament>(() =>
    loadBakedTournament(),
  );
  const [tab, setTab] = useHashTab();
  const [refreshState, setRefreshState] = useState<
    "idle" | "refreshing" | "updated" | "offline"
  >("idle");

  const resolved = useMemo(() => {
    const { matches, unresolvedSlots } = resolveBracket(tournament.matches);
    return { tournament: { ...tournament, matches }, unresolvedSlots };
  }, [tournament]);

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

      <TabBar active={tab} onChange={setTab} />

      <main className="mt-4">
        {tab === "fixtures" && (
          <FixturesView
            tournament={resolved.tournament}
            unresolvedSlots={resolved.unresolvedSlots}
          />
        )}
        {tab === "groups" && <GroupsView tournament={resolved.tournament} />}
        {tab === "teams" && <TeamsView tournament={resolved.tournament} />}
      </main>

      <footer className="mt-12 text-xs text-white/40 text-center">
        Data: openfootball/worldcup.json · Installable PWA · Works offline
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
