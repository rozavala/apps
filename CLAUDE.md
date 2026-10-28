# Notes for AI agents

Read `CONTRIBUTING.md` (architecture, content rules, tests) and `content-guidelines.md` first.

## Dev servers

- Dev and preview servers bind `127.0.0.1`, never `0.0.0.0` / `*`. The DEV box
  pages the operator ("Public exposure") for any non-allowlisted wildcard bind,
  and a wildcard bind is readable by the whole home network.
- Preview the site with `tools/preview.sh` (127.0.0.1:8091, serves only the
  public files, no `.git`, no directory listing). For a phone or iPad test use
  `tools/preview.sh --tailnet`, which adds a tailnet-only `tailscale serve`
  mapping and removes it on exit. Stop previews when done.
- Raw `http-server` / `python -m http.server`: always pass `-a 127.0.0.1` /
  `--bind 127.0.0.1`, and don't serve the repo root.
- Don't add ports to the exposure monitor's allowlist to silence it.

## Production checkout and tests

- `/opt/zavala-sync` on the DEV box is the live, sparse production checkout of
  the sync server (`vps/`, port 3333). Never develop or run tests there; its
  untracked `data/` is the family's real data. Work in a separate clone.
- Headless browser tests must not reach the live sync server
  (`*.tail57521e.ts.net`). `js/sync.js` blocks it when `navigator.webdriver`
  is set; also route-abort that host in ad-hoc Playwright scripts.
