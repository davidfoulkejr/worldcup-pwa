import { useMemo, useState } from "react";
import {
  filterMatches,
  sortMatches,
  type GroupLetter,
  type Match,
  type MatchFilter,
  type Tournament,
} from "@worldcup/data";
import { FixtureCard } from "../components/FixtureCard";
import { flagFor } from "../lib/flags";

interface Props {
  tournament: Tournament;
  unresolvedSlots: number;
}

interface UiFilter {
  city?: string;
  group?: GroupLetter;
  team?: string;
  confirmedOnly: boolean;
}

const EMPTY: UiFilter = { confirmedOnly: false };

export function FixturesView({ tournament, unresolvedSlots }: Props) {
  const [filter, setFilter] = useState<UiFilter>(EMPTY);

  const matchFilter: MatchFilter = useMemo(() => {
    const f: MatchFilter = { hasConfirmedTeamsOnly: filter.confirmedOnly };
    if (filter.city) f.cities = [filter.city];
    if (filter.group) f.groups = [filter.group];
    if (filter.team) f.nations = [filter.team];
    return f;
  }, [filter]);

  // Always chronological in this view (David's spec).
  const matches = useMemo(() => {
    return sortMatches(filterMatches(tournament, matchFilter), "kickoff");
  }, [tournament, matchFilter]);

  const activeCount = [filter.city, filter.group, filter.team].filter(
    Boolean,
  ).length + (filter.confirmedOnly ? 1 : 0);

  return (
    <div className="space-y-3">
      <details className="rounded-xl bg-white/5 border border-white/5 open:bg-white/[0.06]">
        <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-3 list-none">
          <span className="font-medium">
            Filters
            {activeCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-pitch px-2 py-0.5 text-xs">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-white/50 text-sm">tap to expand</span>
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <Field label="Host city">
            <select
              className="select"
              value={filter.city ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  city: e.target.value || undefined,
                }))
              }
            >
              <option value="">All cities</option>
              {tournament.venues.map((v) => (
                <option key={v.slug} value={v.metro}>
                  {v.metro} ({v.country})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Group">
            <select
              className="select"
              value={filter.group ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  group:
                    (e.target.value || undefined) as GroupLetter | undefined,
                }))
              }
            >
              <option value="">All groups</option>
              {tournament.groups.map((g) => (
                <option key={g} value={g}>
                  Group {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Team">
            <select
              className="select"
              value={filter.team ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  team: e.target.value || undefined,
                }))
              }
            >
              <option value="">All teams</option>
              {tournament.nations.map((n) => (
                <option key={n} value={n}>
                  {flagFor(n) ? `${flagFor(n)}  ${n}` : n}
                </option>
              ))}
            </select>
          </Field>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-pitch"
              checked={filter.confirmedOnly}
              onChange={(e) =>
                setFilter((f) => ({ ...f, confirmedOnly: e.target.checked }))
              }
            />
            Confirmed teams only
          </label>

          {activeCount > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setFilter(EMPTY)}
                className="text-sm text-white/70 hover:text-white underline-offset-2 hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </details>

      <div className="text-sm text-white/70">
        {matches.length} fixture{matches.length === 1 ? "" : "s"}
        {unresolvedSlots > 0 && (
          <span className="text-white/40">
            {" · "}
            {unresolvedSlots} bracket TBD
          </span>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/5 p-6 text-center text-white/60">
          No matches match your filters.
        </div>
      ) : (
        <DateGroupedList matches={matches} />
      )}
    </div>
  );
}

function DateGroupedList({ matches }: { matches: Match[] }) {
  // Group by the venue's local date so the day boundaries line up with how
  // fans on the ground experience the schedule.
  const groups: { date: string; matches: Match[] }[] = [];
  for (const m of matches) {
    const last = groups[groups.length - 1];
    if (last && last.date === m.kickoff.localDate) {
      last.matches.push(m);
    } else {
      groups.push({ date: m.kickoff.localDate, matches: [m] });
    }
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.date} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-pitch">
            {formatDateHeader(g.date)}
          </h3>
          <ul className="space-y-3">
            {g.matches.map((m) => (
              <li key={m.id}>
                <FixtureCard match={m} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function formatDateHeader(localDate: string): string {
  const dt = new Date(`${localDate}T12:00:00`);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-white/50">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
