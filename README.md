# cd-demo-mvp

> Silver target — auto-deploy to staging on green CI, cron-promote to prod after soak, 1-click rollback.

This repo demonstrates the **MVP** state of `web-monorepo` continuous delivery: humans no longer click for routine releases, but production still gates behind a soak window and a manual rollback button is one workflow_dispatch away.

Open the GitHub Pages site for the interactive walkthrough — Mermaid diagram + step-by-step `[Next]`/`[Prev]` UI calls out each change vs. current and the benefit gained.

## Changes vs. cd-demo-current

| Dimension | Current | MVP |
|---|---|---|
| Tag creation | manual `workflow_dispatch` | automatic on green CI |
| Staging deploy | manual, sequential with prod | automatic on tag push |
| Prod promotion | same workflow as staging, no gate | cron `*/10` picks soaked `staging-passed/<sha>` (≥5min old) |
| Hotfix path | none | `force=true` + `hotfix-approved` PR label |
| Failure visibility | check Actions tab manually | Slack notification |
| Rollback | revert PR + retag + manual click | `rollback.yml` workflow_dispatch (`env`, `target`) — <30s |

## Pipelines

Single-DAG pipeline so one Actions run page shows the whole graph: ci → release_tag → deploy_staging → mark_staging_passed.

| Workflow | Trigger | What it does |
|---|---|---|
| `pipeline.yml` | push / PR to `main` | Single DAG: CI → release tag (`v*.*.*`) → deploy staging → tag `staging-passed/<sha>` |
| `promote-prod.yml` | cron `*/10` + `workflow_dispatch` | Promotes newest soaked `staging-passed/<sha>` (≥5min old) |
| `notify.yml` | `workflow_run` failure on Pipeline / Promote / Rollback | Slack ping with run URL |
| `rollback.yml` | `workflow_dispatch` | Force-pushes env branch to previous artifact |

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
deploy/deploy.sh staging --dry-run
```

## Sibling demos

- **Current state:** [cd-demo-current](https://tomasz-megaport.github.io/cd-demo-current/) — fully manual, every release is a click
- **Ideal target:** [cd-demo-ideal](https://tomasz-megaport.github.io/cd-demo-ideal/) — full test→staging→prod gating + flake quarantine + admin dashboard

This demo: <https://tomasz-megaport.github.io/cd-demo-mvp/>
