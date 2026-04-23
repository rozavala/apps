# Diagnostic log pipeline — VPS setup

This document is the one-time setup Rodrigo does on the Digital Ocean droplet
after pulling the diag changes.

## Overview

```
Browser → POST /api/diag → vps/diag.js (raw JSONL, Tailscale-only)
                                  │
                                  ▼
                          vps/diag-push.js   (cron every 15 min, or
                          scrubs + commits    on-demand via flush btn)
                                  │
                                  ▼
                          rozavala/apps branch `diag`
                                  │
                                  ▼
                          Claude reads via MCP
```

Raw logs (with kid names) never leave the VPS. Only scrubbed digests
(kid names → stable `u-<hash>`) are committed to the public repo.

## One-time setup

### 1. Pull the code and install (no new deps)

```bash
cd /opt/zavala/apps        # or wherever the VPS checkout lives
git pull
cd vps
# No new npm deps required; diag.js uses only built-ins.
```

### 2. Set environment variables in `vps/.env`

Append to the existing `.env`:

```bash
# Absolute path to a writable git working tree of rozavala/apps
# that has a deploy key able to push the `diag` branch.
# Keep this separate from /opt/zavala/apps so diag pushes don't
# collide with your main checkout.
DIAG_REPO_PATH=/opt/zavala/apps-diag

# Any long, random, private string. Used to hash kid names so
# the same kid produces the same pseudonym across commits but
# the mapping is not reversible by outsiders.
DIAG_SALT=<generate with: openssl rand -hex 32>

# Optional: how much history to include in each digest.
DIAG_WINDOW_HOURS=24
```

### 3. Create the diag working tree

```bash
# Clone a second working copy just for diag pushes
sudo mkdir -p /opt/zavala/apps-diag
sudo chown $(whoami): /opt/zavala/apps-diag
git clone git@github.com:rozavala/apps.git /opt/zavala/apps-diag
cd /opt/zavala/apps-diag

# First push of the orphan diag branch will happen automatically
# from diag-push.js the first time it runs.
```

### 4. Install a deploy key with push rights to the `diag` branch

GitHub → rozavala/apps → Settings → Deploy keys → Add deploy key.
Generate one with `ssh-keygen`:

```bash
ssh-keygen -t ed25519 -f /etc/zs/diag-deploy-key -N ''
cat /etc/zs/diag-deploy-key.pub   # paste into GitHub
```

Add to `~/.ssh/config` for the user that runs the cron:

```
Host github.com-diag
  HostName github.com
  IdentityFile /etc/zs/diag-deploy-key
  IdentitiesOnly yes
```

Then update the remote in the diag working tree:

```bash
cd /opt/zavala/apps-diag
git remote set-url origin git@github.com-diag:rozavala/apps.git
```

> **Tip**: if you want even stricter scope, protect the default branch
> in rozavala/apps settings so this key can only push to `diag`.

### 5. Restart the Express server

```bash
sudo systemctl restart zavala-sync    # or whatever unit name you use
curl -sS http://localhost:3333/api/diag/health
# expect: {"status":"ok","jsonl_bytes":0,"entries_last_24h":0}
```

### 6. Schedule the bridge

#### Option A — systemd timer (recommended)

`/etc/systemd/system/zs-diag-push.service`:

```ini
[Unit]
Description=Zavala Serra diag scrub and push

[Service]
Type=oneshot
WorkingDirectory=/opt/zavala/apps/vps
EnvironmentFile=/opt/zavala/apps/vps/.env
ExecStart=/usr/bin/node /opt/zavala/apps/vps/diag-push.js
User=rodrigo
Nice=10
```

`/etc/systemd/system/zs-diag-push.timer`:

```ini
[Unit]
Description=Run Zavala Serra diag push every 15 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
Unit=zs-diag-push.service

[Install]
WantedBy=timers.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now zs-diag-push.timer
systemctl list-timers | grep zs-diag
```

#### Option B — plain cron

```
*/15 * * * * cd /opt/zavala/apps/vps && /usr/bin/node diag-push.js >> /var/log/zs-diag.log 2>&1
```

### 7. Smoke test

From any device on Tailscale:

```bash
# Force-post one entry
curl -X POST https://real-options-dev.tail57521e.ts.net/api/diag \
  -H 'Content-Type: application/json' \
  -d '{"schema":1,"entries":[{"kind":"test","message":"hello from setup","ts":'$(date +%s%3N)'}]}'

# Flush now
curl -X POST https://real-options-dev.tail57521e.ts.net/api/diag/flush
```

Then check the `diag` branch on GitHub — there should be a new commit
with `diag/latest.json`, `diag/window.json`, and a per-day file.

## Day-to-day use

- Kids use the apps normally. Errors capture in the background.
- If someone hits a bug, open Parent Dashboard and tap
  **📤 Flush now**. That ships the local buffer to the VPS and
  triggers the push bridge. Within ~5 seconds the `diag` branch
  has the latest digest.
- Share the commit URL with Claude or paste a summary.

## Privacy checklist — what the public repo contains

- ✅ Error messages, stack traces, file+line, user agents
- ✅ App id (`piano`, `guitar`, `story`, etc.)
- ✅ Page URL (pathname only)
- ✅ Stable pseudonym per kid (`u-a3f8…`)
- ✅ Profile age (useful for age-tier bugs)
- ✅ Breadcrumb *labels* declared explicitly by app code
- ❌ **No** kid names
- ❌ **No** IP addresses
- ❌ **No** user-typed free text (shopping list items, input fields)
- ❌ **No** breadcrumb `data` payloads (in case an app attaches free text)

## Troubleshooting

- `diag-push.js` exits with "DIAG_REPO_PATH does not exist" → check
  `.env` is loaded. The service file should point `EnvironmentFile`
  at the same `.env` the Express server uses.
- Pushes are rejected → confirm the deploy key has write access and
  the remote URL uses the `github.com-diag` SSH alias.
- Digest is empty even though kids hit errors → check
  `/api/diag/health`. If `entries_last_24h` is 0, the browser isn't
  posting — probably the device is not on Tailscale, or the
  `CloudSync.server` URL in `js/sync.js` is wrong.
