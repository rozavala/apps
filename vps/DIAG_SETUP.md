# Diagnostic log pipeline — VPS setup

One-time setup on the Digital Ocean droplet so kid-reproduced bugs
land as a scrubbed digest on the `diag` branch of `rozavala/apps`,
where Claude can read them.

## Overview

```
Browser → POST /api/diag → vps/diag.js (raw JSONL, Tailscale-only)
                                  │
                                  ▼
                          vps/diag-push.js   (systemd timer every 15 min,
                          scrubs + commits   or on-demand via flush btn)
                                  │
                                  ▼
                          rozavala/apps branch `diag`
                                  │
                                  ▼
                          Claude reads via MCP
```

Raw logs (including kid names) stay on the VPS, reachable only over
Tailscale. Only scrubbed digests (kid names → stable `u-<hash>`) are
committed to the public repo.

## Working assumption for paths

Based on your droplet:

| Thing | Path |
|---|---|
| Main checkout (auto-deployed from main) | `/opt/zavala-sync/` |
| VPS code inside it | `/opt/zavala-sync/vps/` |
| Env file | `/opt/zavala-sync/vps/.env` |
| systemd unit | `zavala-sync.service` |
| **Second checkout for diag pushes** | `/home/rodrigo/zavala-apps-diag/` |
| **Deploy key** | `/home/rodrigo/.ssh/zs_diag_ed25519` |

Adjust if your layout differs.

## One-time setup

### 1. Pull the code on the droplet

The `Deploy VPS` GitHub Action already runs `git reset --hard origin/main`,
`npm install`, and `systemctl restart zavala-sync.service` whenever a
commit touches `vps/**` on `main`. If you merged the diag PR, this has
already happened. Verify:

```bash
ls /opt/zavala-sync/vps/diag.js /opt/zavala-sync/vps/diag-push.js
# Both files should exist.
```

If not, trigger manually:

```bash
cd /opt/zavala-sync && sudo git fetch origin main && sudo git reset --hard origin/main
cd vps && sudo npm install --omit=dev
sudo systemctl restart zavala-sync.service
```

### 2. Generate the deploy key (no `sudo` needed)

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/zs_diag_ed25519 -N '' -C "zs-diag@$(hostname)"
cat ~/.ssh/zs_diag_ed25519.pub
```

Paste that public key into **GitHub → rozavala/apps → Settings → Deploy keys
→ Add deploy key**. Tick **Allow write access**.

### 3. SSH config alias so Git uses the right key

Append to `~/.ssh/config`:

```
Host github.com-diag
  HostName github.com
  IdentityFile ~/.ssh/zs_diag_ed25519
  IdentitiesOnly yes
```

### 4. Clone the diag working tree and point it at the alias

```bash
cd ~
git clone git@github.com-diag:rozavala/apps.git zavala-apps-diag
cd zavala-apps-diag
git remote -v      # should show git@github.com-diag:... for both fetch/push
ssh -T git@github.com-diag
# Expected: "Hi rozavala/apps! You've successfully authenticated..."
```

### 5. Set env vars in `/opt/zavala-sync/vps/.env`

```bash
sudo nano /opt/zavala-sync/vps/.env
```

Append:

```
DIAG_REPO_PATH=/home/rodrigo/zavala-apps-diag
DIAG_SSH_KEY=/home/rodrigo/.ssh/zs_diag_ed25519
DIAG_SALT=<run: openssl rand -hex 32>
DIAG_WINDOW_HOURS=24
```

> `DIAG_SSH_KEY` pins the deploy key explicitly so the push works
> regardless of which user is running `diag-push.js` (root when the
> Parent Dashboard triggers it via the Express service, `rodrigo`
> when the systemd timer runs on schedule). Make sure the key file
> is readable by both users — `chmod 644` on the key plus `chmod 711
> ~/.ssh` on the parent directory is enough.

> `DIAG_SALT` is used to hash kid names into stable pseudonyms. Keep it
> private; rotating it renames everyone from that point forward.

### 6. Restart and verify the server is back

```bash
sudo systemctl restart zavala-sync.service
sudo systemctl status zavala-sync.service --no-pager
curl -sS http://localhost:3333/api/diag/health
# expected: {"status":"ok","jsonl_bytes":0,"entries_last_24h":0}
```

If `curl` returns **"Couldn't connect"** the service isn't listening.
See *Troubleshooting* below — almost always it's a crash at startup
visible in the journal.

### 7. Schedule the scrub+push bridge

Create `/etc/systemd/system/zs-diag-push.service`:

```ini
[Unit]
Description=Zavala Serra diag scrub and push

[Service]
Type=oneshot
User=rodrigo
WorkingDirectory=/opt/zavala-sync/vps
EnvironmentFile=/opt/zavala-sync/vps/.env
ExecStart=/usr/bin/node /opt/zavala-sync/vps/diag-push.js
Nice=10
```

And `/etc/systemd/system/zs-diag-push.timer`:

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

> **Important**: the service runs as `rodrigo`, so the deploy key must be
> readable by that user (which it is, since it's in `~rodrigo/.ssh`).
> If you'd rather run as root, `cp ~/.ssh/zs_diag_ed25519* /root/.ssh/` and
> add the same `~/.ssh/config` alias for root, then change `User=root`.

### 8. End-to-end smoke test

From any device on Tailscale:

```bash
# Post one synthetic entry
curl -X POST https://real-options-dev.tail57521e.ts.net/api/diag \
  -H 'Content-Type: application/json' \
  -d '{"schema":1,"entries":[{"kind":"test","message":"hello from setup","ts":'$(date +%s%3N)'}]}'

# Trigger a push now (equivalent to the dashboard button)
curl -X POST https://real-options-dev.tail57521e.ts.net/api/diag/flush
```

Then check the `diag` branch on GitHub — there should be a commit with
`diag/latest.json`, `diag/window.json`, and today's per-day file.

## Day-to-day use

1. Kids use the apps. Errors auto-capture in the background.
2. After reproducing a bug, open **Parent Dashboard → 📤 Flush now**.
3. Within ~5 seconds a new commit lands on the `diag` branch.
4. Share that commit URL with Claude.

## Privacy receipt — what the public repo contains

- ✅ Error messages, stack traces, file+line, user agents
- ✅ App id (`piano`, `guitar`, `story`, etc.)
- ✅ Page URL (pathname only)
- ✅ Stable pseudonym per kid (`u-a3f8…`)
- ✅ Profile age (useful for age-tier bugs)
- ✅ Breadcrumb *labels* declared explicitly by app code
- ❌ **No** kid names
- ❌ **No** IP addresses
- ❌ **No** user-typed free text (shopping list items, input fields)
- ❌ **No** breadcrumb `data` payloads

## Troubleshooting

### `curl localhost:3333/...` returns "Couldn't connect to server"

The Express service isn't running. Check why:

```bash
sudo systemctl status zavala-sync.service --no-pager
sudo journalctl -u zavala-sync.service -n 80 --no-pager
```

Common causes:

- **`Error: Cannot find module './diag'`** → the droplet didn't pull the
  new code. `cd /opt/zavala-sync && sudo git pull origin main && sudo systemctl restart zavala-sync.service`
- **`Error: Cannot find module 'dotenv'`** → run `cd /opt/zavala-sync/vps && sudo npm install --omit=dev` then restart.
- **`EACCES: permission denied, mkdir '.../_diag'`** → the data dir isn't writable by the service user. `sudo chown -R <service-user> /opt/zavala-sync/data`.
- **Port 3333 already in use** → `sudo ss -tlnp | grep 3333` to find the holder; kill it then restart.

### `diag-push.js` exits with "DIAG_REPO_PATH does not exist"

Confirm the path in `/opt/zavala-sync/vps/.env` matches the actual
location of the diag working tree. Remember: systemd only reads the
`EnvironmentFile`, not your shell's env.

### `fatal: detected dubious ownership in repository`

Git's protection kicks in when the user running `diag-push.js` isn't
the owner of `DIAG_REPO_PATH`. This happens when the Express service
(root) invokes the push but the repo is owned by `rodrigo`. The
checked-in `diag-push.js` already passes `-c safe.directory=<path>`
on every call to handle this — make sure `/opt/zavala-sync/` has
pulled the latest `vps/diag-push.js`.

### Pushes are rejected

Confirm the deploy key has **Allow write access** checked in GitHub, and
that `DIAG_SSH_KEY` in the env file points at a key file readable by
whichever user is running the push. Test as root AND as rodrigo:

```bash
# As rodrigo (systemd timer path)
ssh -T -i ~/.ssh/zs_diag_ed25519 git@github.com

# As root (Express service path)
sudo GIT_SSH_COMMAND='ssh -i /home/rodrigo/.ssh/zs_diag_ed25519 -o IdentitiesOnly=yes' \
  git -C /home/rodrigo/zavala-apps-diag ls-remote origin diag
```

Both should succeed. If root can't read the key, relax its mode:

```bash
chmod 644 /home/rodrigo/.ssh/zs_diag_ed25519
chmod 711 /home/rodrigo/.ssh
```

(`644` is slightly looser than sshd usually allows, but it's a deploy
key with very narrow repo scope, not a shell login key.)

### Digest is empty even though kids hit errors

Check `/api/diag/health`:

```bash
curl -sS https://real-options-dev.tail57521e.ts.net/api/diag/health
```

If `entries_last_24h` is 0, the browser isn't posting. Possible reasons:

- The device isn't on Tailscale
- `CloudSync.server` in `js/sync.js` doesn't match your actual Tailscale
  hostname
- Browser's request is blocked by CORS — unlikely since `cors()` is on,
  but check devtools Network tab
