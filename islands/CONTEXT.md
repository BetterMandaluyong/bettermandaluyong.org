# islands

The only client JavaScript on the site. Every file starts with `"use client"`.

- **Make it an island only when it needs the browser:** the map (Leaflet),
  search state, a tap to load Facebook. Everything else stays a server component
  in `components/`.
- **Props must be serializable** (plain data, plus server-rendered `children`).
  Server pages compute data such as `MAP_BARANGAYS` or `BARANGAY_PERSON_HREFS`
  and pass it in. Islands don't import `data/load.ts`.
- **Work without JavaScript.** Whatever an island shows is also reachable as
  plain links. For example, `BarangayList` sits under the map.
- **Respect `motion-reduce:`** on every animation, and keep controls 44px tall.
- **Test hydration with `pnpm preview`** (a production build in workerd), not
  just `pnpm dev`.
- Each island has a COMPONENTS.md entry and a `/storybook` specimen.
