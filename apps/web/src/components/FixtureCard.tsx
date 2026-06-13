import { flagFor, teamWithFlag } from "../lib/flags";
import { formatSlot, type Match, type TeamSlot } from "@worldcup/data";

interface Props {
  match: Match;
}

function stageLabel(m: Match): string {
  if (m.stage.kind === "group") {
    return `Group ${m.stage.group} · MD${m.stage.matchday}`;
  }
  return `${m.stage.round} · #${m.stage.matchNum}`;
}

/** Device-local kickoff time, 12-hour. e.g. "1:00 PM PDT". */
function formatDeviceTime(m: Match): string {
  return m.kickoff.utc.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

/** Venue-local kickoff: "1:00 PM local · Sun Jun 14". */
function formatVenueLine(m: Match): string {
  const dt = new Date(`${m.kickoff.localDate}T${m.kickoff.localTime}:00`);
  const date = dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  // Format the venue's wall-clock as a 12-hour string for consistency.
  const [hStr, mStr] = m.kickoff.localTime.split(":");
  const h = Number(hStr);
  const m12 = Number(mStr);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  const minute = String(m12).padStart(2, "0");
  return `${hour}:${minute} ${period} local · ${date}`;
}

export function FixtureCard({ match }: Props) {
  const score = match.score
    ? `${match.score.fullTime[0]} – ${match.score.fullTime[1]}`
    : "vs";
  const venueLabel = match.venue.suburb
    ? `${match.venue.metro} (${match.venue.suburb})`
    : match.venue.metro;

  return (
    <article className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
      {/* Prominent kickoff strip: device-local time on top, venue-local underneath */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="min-w-0">
          <div className="text-2xl font-bold tabular-nums leading-tight">
            {formatDeviceTime(match)}
          </div>
          <div className="text-xs text-white/60 mt-0.5">
            {formatVenueLine(match)}
          </div>
        </div>
        <span className="text-xs rounded-full bg-pitch/30 text-white/90 px-2 py-0.5 whitespace-nowrap mt-1">
          {stageLabel(match)}
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Team slot={match.team1} />
          <div className="text-lg font-semibold tabular-nums whitespace-nowrap">
            {score}
          </div>
          <Team slot={match.team2} align="right" />
        </div>

        <div className="text-xs text-white/60 flex items-center gap-1">
          <span className="text-white/40">📍</span>
          <span>{venueLabel}</span>
          <span className="text-white/40">·</span>
          <span>{match.venue.country}</span>
        </div>
      </div>
    </article>
  );
}

function Team({
  slot,
  align = "left",
}: {
  slot: TeamSlot;
  align?: "left" | "right";
}) {
  const isConfirmed = slot.kind === "team";
  const name = formatSlot(slot);
  const flag = isConfirmed ? flagFor(slot.name) : "";

  return (
    <div
      className={
        "flex items-center gap-2 " +
        (align === "right" ? "justify-end flex-row-reverse text-right" : "")
      }
    >
      {flag && <span className="text-xl leading-none">{flag}</span>}
      <span
        className={
          "font-medium " + (isConfirmed ? "text-white" : "text-white/60 italic")
        }
      >
        {name}
      </span>
    </div>
  );
}

export { teamWithFlag };

