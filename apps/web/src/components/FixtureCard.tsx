import { formatSlot, type Match } from "@worldcup/data";

interface Props {
  match: Match;
}

/** Friendly kickoff display: e.g. "Sat Jun 13 · 21:00 (local) · 6:00 PM PT" */
function formatKickoff(m: Match): string {
  const localDt = new Date(`${m.kickoff.localDate}T${m.kickoff.localTime}:00`);
  const weekday = localDt.toLocaleDateString(undefined, { weekday: "short" });
  const day = localDt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const local = `${m.kickoff.localTime} ${m.kickoff.utcOffset}`;
  const yours = m.kickoff.utc.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `${weekday} ${day} · ${local} · your time: ${yours}`;
}

function stageLabel(m: Match): string {
  if (m.stage.kind === "group") {
    return `Group ${m.stage.group} · MD${m.stage.matchday}`;
  }
  return `${m.stage.round} · #${m.stage.matchNum}`;
}

export function FixtureCard({ match }: Props) {
  const t1 = formatSlot(match.team1);
  const t2 = formatSlot(match.team2);
  const score = match.score
    ? `${match.score.fullTime[0]} – ${match.score.fullTime[1]}`
    : "vs";
  const venueLabel = match.venue.suburb
    ? `${match.venue.metro} (${match.venue.suburb})`
    : match.venue.metro;

  return (
    <article className="rounded-xl bg-white/5 border border-white/5 p-4 space-y-3">
      <header className="flex items-center justify-between text-xs">
        <span className="rounded-full bg-pitch/30 text-pitch-100 px-2 py-0.5">
          {stageLabel(match)}
        </span>
        <span className="text-white/60">{match.venue.country}</span>
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Team name={t1} confirmed={match.team1.kind === "team"} />
        <div className="text-lg font-semibold tabular-nums">{score}</div>
        <Team name={t2} confirmed={match.team2.kind === "team"} align="right" />
      </div>

      <footer className="text-xs text-white/60 flex flex-wrap items-center gap-x-2">
        <span>{venueLabel}</span>
        <span>·</span>
        <span>{formatKickoff(match)}</span>
      </footer>
    </article>
  );
}

function Team({
  name,
  confirmed,
  align = "left",
}: {
  name: string;
  confirmed: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div
        className={
          "font-medium " + (confirmed ? "text-white" : "text-white/60 italic")
        }
      >
        {name}
      </div>
    </div>
  );
}
