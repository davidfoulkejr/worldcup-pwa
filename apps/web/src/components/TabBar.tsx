import { TAB_ORDER, type Tab } from "../lib/useHashTab";

const LABELS: Record<Tab, string> = {
  fixtures: "Fixtures",
  groups: "Groups",
  teams: "Teams",
  bracket: "Bracket",
};

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav
      className="grid grid-cols-4 gap-1 rounded-xl bg-white/5 p-1 text-sm"
      role="tablist"
    >
      {TAB_ORDER.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t)}
            className={
              "rounded-lg px-3 py-2 font-medium transition-colors " +
              (isActive
                ? "bg-pitch text-white shadow"
                : "text-white/70 hover:text-white hover:bg-white/10")
            }
          >
            {LABELS[t]}
          </button>
        );
      })}
    </nav>
  );
}
