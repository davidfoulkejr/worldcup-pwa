import { useMemo, useState } from "react";
import {
  GROUP_LETTERS,
  type HostCountry,
  type MatchFilter,
  type Tournament,
} from "@worldcup/data";

interface Props {
  tournament: Tournament;
  filter: MatchFilter;
  onChange: (next: MatchFilter) => void;
}

const COUNTRIES: HostCountry[] = ["USA", "Mexico", "Canada"];

export function FilterBar({ tournament, filter, onChange }: Props) {
  const [showNations, setShowNations] = useState(false);

  const nationOptions = useMemo(
    () => tournament.nations,
    [tournament.nations],
  );

  const toggle = <K extends keyof MatchFilter>(
    key: K,
    value: NonNullable<MatchFilter[K]> extends readonly (infer T)[] ? T : never,
  ) => {
    const current = (filter[key] as readonly unknown[] | undefined) ?? [];
    const has = current.includes(value);
    const nextArr = has
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({
      ...filter,
      [key]: nextArr.length === 0 ? undefined : nextArr,
    } as MatchFilter);
  };

  const has = <K extends keyof MatchFilter>(
    key: K,
    value: unknown,
  ): boolean =>
    Array.isArray(filter[key]) && (filter[key] as unknown[]).includes(value);

  const reset = () =>
    onChange({
      hasConfirmedTeamsOnly: filter.hasConfirmedTeamsOnly ?? false,
    });

  const activeCount = [
    filter.cities,
    filter.countries,
    filter.groups,
    filter.nations,
    filter.stages,
  ].filter((a) => a && a.length > 0).length;

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 pb-3 pt-3 bg-navy/95 backdrop-blur border-b border-white/5 space-y-3">
      <Row label="Country">
        {COUNTRIES.map((c) => (
          <Chip
            key={c}
            active={has("countries", c)}
            onClick={() => toggle("countries", c)}
          >
            {c}
          </Chip>
        ))}
      </Row>

      <Row label="Host city">
        {tournament.venues.map((v) => (
          <Chip
            key={v.slug}
            active={has("cities", v.metro)}
            onClick={() => toggle("cities", v.metro)}
          >
            {v.metro}
          </Chip>
        ))}
      </Row>

      <Row label="Group">
        {GROUP_LETTERS.filter((g) => tournament.groups.includes(g)).map(
          (g) => (
            <Chip
              key={g}
              active={has("groups", g)}
              onClick={() => toggle("groups", g)}
            >
              {g}
            </Chip>
          ),
        )}
      </Row>

      <Row label="Stage">
        <Chip
          active={has("stages", "group")}
          onClick={() => toggle("stages", "group")}
        >
          Group stage
        </Chip>
        <Chip
          active={has("stages", "knockout")}
          onClick={() => toggle("stages", "knockout")}
        >
          Knockouts
        </Chip>
      </Row>

      <div>
        <button
          type="button"
          onClick={() => setShowNations((s) => !s)}
          className="text-sm text-white/70 hover:text-white"
        >
          {showNations ? "Hide nations ▴" : `Nations (${nationOptions.length}) ▾`}
        </button>
        {showNations && (
          <Row label="">
            {nationOptions.map((n) => (
              <Chip
                key={n}
                active={has("nations", n)}
                onClick={() => toggle("nations", n)}
              >
                {n}
              </Chip>
            ))}
          </Row>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="inline-flex items-center gap-2 text-white/80">
          <input
            type="checkbox"
            checked={filter.hasConfirmedTeamsOnly === true}
            onChange={(e) =>
              onChange({
                ...filter,
                hasConfirmedTeamsOnly: e.target.checked ? true : false,
              })
            }
            className="h-4 w-4 accent-pitch"
          />
          Confirmed teams only
        </label>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md px-2 py-1 text-white/70 hover:text-white hover:bg-white/10"
          >
            Reset {activeCount} filter{activeCount === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="shrink-0 text-xs uppercase tracking-wide text-white/50">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-sm transition-colors " +
        (active
          ? "bg-pitch text-white"
          : "bg-white/10 text-white/80 hover:bg-white/20")
      }
    >
      {children}
    </button>
  );
}
