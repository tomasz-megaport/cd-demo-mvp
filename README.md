# cd-demo-mvp

> Silver target — auto-deploy to pre-prod on green CI, cron-promote to **sandbox + prod in parallel** after soak, 1-click rollback.

This repo demonstrates the **MVP** state of `web-monorepo` continuous delivery: humans no longer click for routine releases. Sandbox (customer-facing rehearsal) mirrors prod exactly — same image, same cron window. Rollback wraps the existing image-restore primitive — no blue/green infra needed.

Open the GitHub Pages site for the interactive walkthrough — Mermaid diagram + step-by-step `[Next]`/`[Prev]` UI calls out each change vs. current and the benefit gained.

## Env model

| Env | Role | Cadence | Access |
|---|---|---|---|
| **pre-prod** | Tip of main. Auto-deploy on every green release tag. | Continuous (every merge) | Internal only |
| **sandbox** | Customer-facing rehearsal. **Mirrors prod exactly** — same image, same window. | Same 8h cron as prod | Public |
| **prod** | Production. | 8h cron — 08:00 / 16:00 / 00:00 AEST | Public |

## Changes vs. cd-demo-current

| Dimension | Current | MVP |
|---|---|---|
| Tag creation | manual `workflow_dispatch` | automatic on green CI |
| Pre-prod deploy | n/a (no internal env) | automatic on tag push |
| Sandbox + prod | manual, sequential | **8h cron, parallel** (`pre-prod-passed/<sha>` + ≥30 min soak) |
| Hotfix path | none | `force=true` + `hotfix-approved` PR label |
| Failure visibility | check Actions tab manually | Slack notification |
| Rollback | revert PR + retag + manual click | `rollback.yml` workflow_dispatch (`env`, `target`) — seconds, wraps image-restore primitive |

## Pipelines

| Workflow | Trigger | What it does |
|---|---|---|
| `pipeline.yml` | push / PR to `main` | Single DAG: CI → release tag (`v*.*.*`) → deploy pre-prod → e2e → tag `pre-prod-passed/<sha>` |
| `promote-sandbox-prod.yml` | cron (`*/1` demo / `0 22,6,14 * * *` UTC real = 08/16/00 AEST) + `workflow_dispatch` | Picks newest soaked `pre-prod-passed/<sha>` (≥30 min) and deploys to **sandbox + prod in parallel** |
| `notify.yml` | `workflow_run` failure on Pipeline / Promote / Rollback | Slack ping with run URL |
| `rollback.yml` | `workflow_dispatch` | Restores env (sandbox / prod) to previous artifact in seconds |

Tags still emitted from inside the pipeline so external systems (Sentry releases, audit logs, monitoring) can subscribe to the immutable artifact identifier — they outlive 90-day workflow run retention. No PAT required because all handoffs use `needs:` not push:tags triggers.

## Required secrets

- `SLACK_WEBHOOK` — incoming webhook URL for the demo Slack channel

## Local

```bash
pnpm install
pnpm test
pnpm serve     # http://127.0.0.1:4173
```

## Deploy (dry-run)

```bash
deploy/deploy.sh pre-prod --dry-run
deploy/deploy.sh sandbox --dry-run
deploy/deploy.sh prod --dry-run
```

## Sibling demos

- **Current state:** [cd-demo-current](https://tomasz-megaport.github.io/cd-demo-current/) — fully manual, every release is a click
- **Ideal target:** [cd-demo-ideal](https://tomasz-megaport.github.io/cd-demo-ideal/) — full pre-prod → sandbox+prod gating + flake quarantine + admin dashboard

This demo: <https://tomasz-megaport.github.io/cd-demo-mvp/>
