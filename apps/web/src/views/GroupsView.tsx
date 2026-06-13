import { useMemo } from "react";
import {
  computeAllStandings,
  filterMatches,
  sortMatches,
  type GroupLetter,
  type GroupTable,
  type Match,
  type Tournament,
} from "@worldcup/data";
import { FixtureCard } from "../components/FixtureCard";
import { flagFor } from "../lib/flags";

interface Props {
  tournament: Tournament;
}

export function GroupsView({ tournament }: Props) {
  const tables = useMemo(
    () => computeAllStandings(tournament.matches),
    [tournament.matches],
  );

  return (
    <div className="space-y-6">
      {tables.map((table) => (
        <GroupCard
          key={table.group}
          table={table}
          matches={sortMatches(
            filterMatches(tournament, {
              stages: ["group"],
              groups: [table.group],
            }),
            "kickoff",
          )}
        />
      ))}
    </div>
  );
}

function GroupCard({
  table,
  matches,
}: {
  table: GroupTable;
  matches: Match[];
}) {
  return (
    <section className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-pitch/30">
        <h2 className="text-lg font-semibold">Group {table.group}</h2>
        <span className="text-xs text-white/70">
          {table.complete ? "Final" : "In progress"}
        </span>
      </header>

      <StandingsTable table={table} group={table.group} />

      <details className="border-t border-white/5">
        <summary className="cursor-pointer select-none px-4 py-3 list-none text-sm text-white/80 hover:bg-white/[0.04]">
          {matches.length} match{matches.length === 1 ? "" : "es"}
          <span className="text-white/50 ml-2">tap to expand</span>
        </summary>
        <ul className="space-y-3 px-4 pb-4">
          {matches.map((m) => (
            <li key={m.id}>
              <FixtureCard match={m} />
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function StandingsTable({
  table,
  group,
}: {
  table: GroupTable;
  group: GroupLetter;
}) {
  if (table.rows.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-white/50 text-sm">
        Teams for Group {group} are not yet known.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-white/50">
          <tr>
            <th className="text-left pl-4 py-2">Team</th>
            <th className="px-2 py-2">P</th>
            <th className="px-2 py-2">W</th>
            <th className="px-2 py-2">D</th>
            <th className="px-2 py-2">L</th>
            <th className="px-2 py-2">GF</th>
            <th className="px-2 py-2">GA</th>
            <th className="px-2 py-2">GD</th>
            <th className="pr-4 py-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => {
            const advance = i < 2;
            const thirdChance = i === 2;
            return (
              <tr
                key={row.team}
                className="border-t border-white/5 tabular-nums"
              >
                <td className="pl-4 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={
                        "inline-block w-1 h-4 rounded-sm " +
                        (advance
                          ? "bg-pitch"
                          : thirdChance
                          ? "bg-pitch/40"
                          : "bg-transparent")
                      }
                    />
                    {flagFor(row.team) && (
                      <span className="text-lg leading-none">
                        {flagFor(row.team)}
                      </span>
                    )}
                    <span className="font-medium">{row.team}</span>
                  </span>
                </td>
                <td className="text-center px-2 py-2">{row.played}</td>
                <td className="text-center px-2 py-2">{row.won}</td>
                <td className="text-center px-2 py-2">{row.drawn}</td>
                <td className="text-center px-2 py-2">{row.lost}</td>
                <td className="text-center px-2 py-2">{row.goalsFor}</td>
                <td className="text-center px-2 py-2">{row.goalsAgainst}</td>
                <td className="text-center px-2 py-2">
                  {row.goalDifference > 0 ? "+" : ""}
                  {row.goalDifference}
                </td>
                <td className="text-center pr-4 py-2 font-semibold">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
