import { useEffect, useMemo, useState } from "react";
import type { Match, TeamSlot, Tournament } from "@worldcup/data";
import {
  getMatchScenario,
  getPossibleOutcomes,
  loadBakedScenarios,
  type R32MatchScenario,
  type Scenarios,
  type TeamOption,
} from "@worldcup/data";
import { flagFor } from "../lib/flags";

interface Props {
  tournament: Tournament;
}

// ─── Bracket structure ───────────────────────────────────────────────────────
// Match numbers ordered top-to-bottom as they appear in the visual bracket.
// Pairs of adjacent entries in each round feed the corresponding parent in the
// next round (R32[0,1]→R16[0], R32[2,3]→R16[1], …).

interface Round {
  label: string;
  nums: readonly number[];
  /** How many R32 "unit rows" each match spans vertically. */
  slots: number;
}

const ROUNDS: Round[] = [
  { label: "R32",   nums: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87], slots: 1  },
  { label: "R16",   nums: [89, 90, 93, 94, 91, 92, 95, 96],                                  slots: 2  },
  { label: "QF",    nums: [97, 98, 99, 100],                                                  slots: 4  },
  { label: "SF",    nums: [101, 102],                                                         slots: 8  },
  { label: "Final", nums: [104],                                                              slots: 16 },
];

// ─── Layout constants ────────────────────────────────────────────────────────

const UNIT    = 60;   // height (px) of one R32 slot row
const CARD_H  = 50;   // height (px) of a compact match card
const COL_W   = 120;  // width  (px) of one column
const GAP     = 18;   // gap    (px) between columns (connector zone)
const STEP    = COL_W + GAP;
const HEADER  = 28;   // height (px) of round-label header strip
const TOTAL_H = 16 * UNIT;                                          // 960 px
const TOTAL_W = ROUNDS.length * COL_W + (ROUNDS.length - 1) * GAP; // 672 px

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Compact slot label: "1H", "2J", "3A/B/C", "W73", "L101", or team name. */
function slotLabel(slot: TeamSlot): string {
  switch (slot.kind) {
    case "team":           return slot.name;
    case "groupRank":      return `${slot.rank}${slot.group}`;
    case "thirdPlaceFrom": return `3${slot.candidateGroups.join("/")}`;
    case "matchWinner":    return `W${slot.matchNum}`;
    case "matchLoser":     return `L${slot.matchNum}`;
    case "unknown":        return slot.raw;
  }
}

/** Top (px) of a card within the absolute-positioned bracket container. */
function cardTop(roundIdx: number, matchIdx: number): number {
  const slots = ROUNDS[roundIdx]?.slots ?? 1;
  return HEADER + (matchIdx + 0.5) * slots * UNIT - CARD_H / 2;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BracketView({ tournament }: Props) {
  const [selectedMatchNum, setSelectedMatchNum] = useState<number | null>(null);
  const [scenarios] = useState<Scenarios>(() => loadBakedScenarios());

  // Build a match-number → Match lookup for quick access.
  const byNum = useMemo(() => {
    const m = new Map<number, Match>();
    for (const match of tournament.matches) {
      if (match.stage.kind === "knockout") m.set(match.stage.matchNum, match);
    }
    return m;
  }, [tournament.matches]);

  const selectedMatch = selectedMatchNum != null ? byNum.get(selectedMatchNum) : undefined;
  const selectedScenario =
    selectedMatchNum != null ? getMatchScenario(scenarios, selectedMatchNum) : undefined;

  return (
    <>
      <div className="-mx-4 overflow-x-auto">
        <div
          className="relative mx-4"
          style={{ width: TOTAL_W, height: TOTAL_H + HEADER }}
        >
          {/* Round-label headers */}
          {ROUNDS.map((round, ri) => (
            <div
              key={round.label}
              className="absolute top-0 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest text-pitch"
              style={{ left: ri * STEP, width: COL_W, height: HEADER }}
            >
              {round.label}
            </div>
          ))}

          {/* Bracket connector lines (SVG overlay) */}
          <svg
            className="absolute inset-x-0 pointer-events-none"
            style={{ top: HEADER }}
            width={TOTAL_W}
            height={TOTAL_H}
            aria-hidden
          >
            {ROUNDS.slice(0, -1).map((round, ri) => {
              const nextRound = ROUNDS[ri + 1]!;
              const childX = ri * STEP + COL_W;
              const parentX = (ri + 1) * STEP;
              const jx = childX + GAP / 2;

              return nextRound.nums.map((_, pi) => {
                const c0y  = (pi * 2 + 0.5) * round.slots * UNIT;
                const c1y  = (pi * 2 + 1.5) * round.slots * UNIT;
                const midy = (pi * 2 + 1)   * round.slots * UNIT;
                return (
                  <g key={`${ri}-${pi}`} stroke="#0f6c3a" strokeWidth={1} strokeOpacity={0.45} fill="none">
                    <line x1={childX} y1={c0y} x2={jx} y2={c0y} />
                    <line x1={childX} y1={c1y} x2={jx} y2={c1y} />
                    <line x1={jx} y1={c0y} x2={jx} y2={c1y} />
                    <line x1={jx} y1={midy} x2={parentX} y2={midy} />
                  </g>
                );
              });
            })}
          </svg>

          {/* Match cards */}
          {ROUNDS.map((round, ri) =>
            round.nums.map((matchNum, mi) => {
              const match = byNum.get(matchNum);
              return (
                <button
                  key={matchNum}
                  type="button"
                  aria-label={`Match ${matchNum} details`}
                  onClick={() => setSelectedMatchNum(matchNum)}
                  className="absolute overflow-hidden rounded-lg border border-white/10 bg-[#0a1e12] text-left hover:border-pitch/60 hover:bg-[#0d2418] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pitch transition-colors"
                  style={{
                    left:   ri * STEP,
                    top:    cardTop(ri, mi),
                    width:  COL_W,
                    height: CARD_H,
                  }}
                >
                  <MatchCard match={match} matchNum={matchNum} />
                </button>
              );
            }),
          )}
        </div>
      </div>

      {selectedMatchNum != null && (
        <MatchupDialog
          matchNum={selectedMatchNum}
          match={selectedMatch}
          scenario={selectedScenario}
          simulationCount={scenarios.simulations}
          onClose={() => setSelectedMatchNum(null)}
        />
      )}
    </>
  );
}

// ─── Compact match card ───────────────────────────────────────────────────────

function MatchCard({
  match,
  matchNum,
}: {
  match: Match | undefined;
  matchNum: number;
}) {
  if (!match) {
    return (
      <div className="flex h-full items-center justify-center text-[11px] text-white/30">
        M{matchNum}
      </div>
    );
  }

  const { team1, team2, score } = match;

  // Determine winner side for dimming losers
  let winner = 0; // 0 = no result yet
  if (score) {
    const [s1, s2] =
      score.penalties ?? score.extraTime ?? score.fullTime;
    if (s1 > s2) winner = 1;
    else if (s2 > s1) winner = 2;
  }

  const ft = score?.fullTime;

  return (
    <div className="flex h-full flex-col text-[11px] leading-tight">
      {/* Team 1 row */}
      <TeamRow
        slot={team1}
        score={ft?.[0]}
        dimmed={winner === 2}
      />
      {/* Divider with match number */}
      <div className="flex shrink-0 items-center border-y border-white/10 px-1.5 py-px">
        <span className="text-[9px] text-white/30 tabular-nums">M{matchNum}</span>
      </div>
      {/* Team 2 row */}
      <TeamRow
        slot={team2}
        score={ft?.[1]}
        dimmed={winner === 1}
        alignRight={false}
      />
    </div>
  );
}

function TeamRow({
  slot,
  score,
  dimmed,
  alignRight = false,
}: {
  slot: TeamSlot;
  score: number | undefined;
  dimmed: boolean;
  alignRight?: boolean;
}) {
  const confirmed = slot.kind === "team";
  const label     = slotLabel(slot);
  const flag      = confirmed ? flagFor(slot.name) : "";

  const textCls = confirmed
    ? dimmed
      ? "text-white/40"
      : "text-white"
    : "text-white/35 italic";

  return (
    <div
      className={`flex flex-1 items-center gap-1 overflow-hidden px-1.5 ${textCls}`}
    >
      {flag && <span className="shrink-0 text-[13px] leading-none">{flag}</span>}
      <span className={`min-w-0 truncate ${alignRight ? "text-right" : ""}`}>
        {label}
      </span>
      {score !== undefined && (
        <span className="ml-auto shrink-0 font-semibold tabular-nums">
          {score}
        </span>
      )}
    </div>
  );
}

// ─── Matchup dialog ───────────────────────────────────────────────────────────

function roundLabel(match: Match): string {
  if (match.stage.kind !== "knockout") return "";
  switch (match.stage.round) {
    case "Round of 32":          return "R32";
    case "Round of 16":          return "R16";
    case "Quarter-final":        return "QF";
    case "Semi-final":           return "SF";
    case "Match for third place": return "3rd Place";
    case "Final":                return "Final";
  }
}

function slotDescription(slot: TeamSlot): string {
  switch (slot.kind) {
    case "team":           return slot.name;
    case "groupRank":      return `${slot.rank === 1 ? "1st" : slot.rank === 2 ? "2nd" : "3rd"} place, Group ${slot.group}`;
    case "thirdPlaceFrom": return `Best 3rd from ${slot.candidateGroups.join("/")}`;
    case "matchWinner":    return `Winner of M${slot.matchNum}`;
    case "matchLoser":     return `Loser of M${slot.matchNum}`;
    case "unknown":        return slot.raw;
  }
}

function SlotPanel({
  label,
  slot,
  options,
}: {
  label: string;
  slot: TeamSlot;
  options: TeamOption[];
}) {
  const confirmed = slot.kind === "team";
  const flag = confirmed ? flagFor(slot.name) : "";

  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="text-[10px] uppercase tracking-wide text-white/40 font-semibold">
        {label}
      </div>

      {confirmed ? (
        <div className="flex items-center gap-2">
          {flag && <span className="text-2xl leading-none">{flag}</span>}
          <div>
            <div className="font-semibold text-sm leading-tight">{slot.name}</div>
            <div className="text-[10px] text-pitch font-medium uppercase tracking-wide mt-0.5">
              confirmed
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-xs text-white/50 italic mb-1.5">
            {slotDescription(slot)}
          </div>
          {options.length > 0 ? (
            options.slice(0, 4).map((opt) => {
              const pct = Math.round(opt.probability * 100);
              const optFlag = flagFor(opt.team);
              return (
                <div key={opt.team} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs gap-1">
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      {optFlag && <span className="shrink-0">{optFlag}</span>}
                      <span className="truncate">{opt.team}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-white/70">{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pitch"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-white/30 italic">TBD</div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchupDialog({
  matchNum,
  match,
  scenario,
  simulationCount,
  onClose,
}: {
  matchNum: number;
  match: Match | undefined;
  scenario: R32MatchScenario | undefined;
  simulationCount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const score = match?.score;
  const ft = score?.fullTime;
  let winner = 0;
  if (ft) {
    const [s1, s2] = score?.penalties ?? score?.extraTime ?? ft;
    if (s1 > s2) winner = 1;
    else if (s2 > s1) winner = 2;
  }

  const bothConfirmed = match?.hasConfirmedTeams ?? false;
  const hasScenarios = !bothConfirmed && scenario != null;
  const topPairings = hasScenarios
    ? getPossibleOutcomes(scenario).slice(0, 5)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-[#0a1e12] border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-white/10">
          <div>
            {match ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-pitch">
                    {roundLabel(match)}
                  </span>
                  <span className="text-[11px] text-white/40">·</span>
                  <span className="text-[11px] text-white/50">M{matchNum}</span>
                </div>
                <div className="text-sm font-medium text-white mt-0.5">
                  {match.venue.metro}
                  {match.venue.suburb && (
                    <span className="text-white/50"> ({match.venue.suburb})</span>
                  )}
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  {match.kickoff.localDate} · {match.kickoff.localTime} local
                </div>
              </>
            ) : (
              <div className="text-sm text-white/50">Match {matchNum}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 mt-0.5 rounded-full p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </button>
        </div>

        {/* Score (if played) */}
        {ft && match && (
          <div className="flex items-center justify-center gap-4 px-4 py-3 bg-white/[0.03] border-b border-white/10">
            <span className={`text-sm font-medium ${winner === 2 ? "text-white/40" : "text-white"}`}>
              {flagFor(match.team1.kind === "team" ? match.team1.name : "")} {slotLabel(match.team1)}
            </span>
            <span className="text-2xl font-bold tabular-nums text-white">
              {ft[0]} – {ft[1]}
            </span>
            <span className={`text-sm font-medium ${winner === 1 ? "text-white/40" : "text-white"}`}>
              {slotLabel(match.team2)} {flagFor(match.team2.kind === "team" ? match.team2.name : "")}
            </span>
          </div>
        )}

        {/* Slot panels */}
        {match && (
          <div className="flex gap-4 px-4 pt-4 pb-3">
            <SlotPanel
              label="Team 1"
              slot={match.team1}
              options={scenario?.team1_options ?? []}
            />
            <div className="w-px bg-white/10 shrink-0" />
            <SlotPanel
              label="Team 2"
              slot={match.team2}
              options={scenario?.team2_options ?? []}
            />
          </div>
        )}

        {/* Matchup scenarios (R32, unresolved) */}
        {hasScenarios && topPairings.length > 0 && (
          <div className="px-4 pb-4 border-t border-white/10 pt-3">
            <div className="text-[10px] uppercase tracking-wide text-white/40 font-semibold mb-2">
              Likely matchups · {simulationCount.toLocaleString()} simulations
            </div>
            <div className="space-y-1.5">
              {topPairings.map((p, i) => {
                const pct = Math.round(p.probability * 100);
                const f1 = flagFor(p.team1);
                const f2 = flagFor(p.team2);
                return (
                  <div key={`${p.team1}-${p.team2}`} className="flex items-center gap-2 text-xs">
                    <span className="text-white/30 tabular-nums w-4 shrink-0">{i + 1}.</span>
                    <span className="flex-1 min-w-0 truncate">
                      {f1 && <span className="mr-0.5">{f1}</span>}{p.team1}
                      <span className="text-white/30 mx-1">vs</span>
                      {f2 && <span className="mr-0.5">{f2}</span>}{p.team2}
                    </span>
                    <span className="shrink-0 tabular-nums text-white/60">{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-[10px] text-white/25">
              Powered by Elo ratings · updated every 6 hours
            </div>
          </div>
        )}

        {/* Confirmed matchup (no scenarios needed) */}
        {bothConfirmed && !ft && match && (
          <div className="px-4 pb-4 pt-1">
            <div className="rounded-lg bg-pitch/20 border border-pitch/30 px-3 py-2 text-xs text-pitch">
              Matchup confirmed — awaiting kickoff
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
