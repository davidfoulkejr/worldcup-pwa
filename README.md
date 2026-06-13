# World Cup 2026 PWA

A fast, offline-friendly World Cup 2026 fixtures viewer. Install it to your
phone's Home Screen and have the schedule wherever you are -- no network
required after the first visit.

Data: [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
(public domain, refreshed daily by the upstream maintainer).

**Live site:** https://davidfoulkejr.github.io/worldcup-pwa/

## Features

- Filter by host city, country, group, nation, and stage
- Sort by date/time, host city, group, or stage
- Per-match local time + your-time conversion
- Bracket placeholders ("3rd from A/B/C/D/F", "Winner #89") resolve into real
  teams as group standings and knockout results land
- Stale-while-revalidate caching -- always renders instantly, refreshes in
  the background when online
- Installable PWA -- works fully offline once installed

## Repo layout

```
packages/data/    Pure TypeScript model + loaders + queries (no UI deps)
apps/web/         Vite + React + Tailwind + vite-plugin-pwa
```

## Local dev

```bash
npm install
npm run fetch     # downloads the latest fixtures snapshot
npm run dev       # vite dev server
npm test          # runs the data model unit tests
npm run build     # produces apps/web/dist/ ready for static hosting
```

## Deploying

Currently the `gh-pages` branch is updated by running:

```bash
npm run build
# then push apps/web/dist/ to the gh-pages branch
```

A GitHub Actions workflow (`.github/workflows/deploy.yml`) can be added later
to auto-deploy on every push to `main` -- requires `workflow` scope on the
GitHub token.
