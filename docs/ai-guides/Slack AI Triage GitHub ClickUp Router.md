Absolutely—you can make this flow much smarter and more hands-off. Here’s a robust, real-world architecture that does what you described: read Slack reports, enrich with AI, pick the right repo(s), open/sync issues in GitHub and ClickUp, and keep a background agent watching + routing.

# High-level flow

1. **Slack intake → AI triage**

   * Your Slack app listens to message/emoji signals (e.g., \:beetle:, threads). Use the Events API (or Socket Mode) to receive events. ([Slack API][1], [Slack Developer Docs][2])
   * An LLM “Triage Agent” extracts a normalized bug payload: `{title, summary, steps, expected, actual, env, severity, component_keywords, suspected_service, logs/stack, links}`.
2. **Repo Router (AI + heuristics)**

   * Combine strategies:

     * **Rules**: map `component_keywords` → repo via a registry.
     * **CODEOWNERS** lookup (great for owners/teams). ([GitHub Docs][3], [The GitHub Blog][4])
     * **Semantic search**: embed READMEs/paths/error strings for all repos and rank matches.
     * **GitHub code search** hit for class/file names mentioned in the report.
   * Output: one or more target repos + confidence scores.
3. **Create issues + cross-links**

   * If confidence ≥ threshold, create GitHub issue(s) in the target repo(s). Otherwise, open in a **triage repo** with `needs-routing`. Use GitHub REST Issues API. ([GitHub Docs][5])
   * Create or update a matching ClickUp task with deep links to Slack thread + GitHub issue(s). ([developer.clickup.com][6], [ClickUp Help][7])
4. **Background agent (continuous routing + sync)**

   * **Option A – GitHub App + webhooks**: Your app subscribes to issue/comment/label events and (re-)routes, labels, pings CODEOWNERS, or **transfers** issues across repos in the same org when confidence improves. ([GitHub Docs][8])
   * **Option B – Scheduled GitHub Action**: Nightly/5-min cron scans for `needs-routing` issues in your triage repo, runs the Repo Router, and updates/creates/transfers accordingly. (Scheduled workflows use `on: schedule`.) ([GitHub Docs][9])

Yes—you really can “open in GitHub first, then have a background agent check each repo and move it.” Transfers work across repos within the same user/org; otherwise recreate with links. ([GitHub Docs][10])

---

## Minimal building blocks (copy-paste friendly)

### 1) Slack → Triage webhook (Node/Express sketch)

```ts
// /api/slack/events
app.post('/api/slack/events', verifySlack, async (req, res) => {
  if (req.body.type === 'url_verification') return res.send(req.body.challenge);

  const event = req.body.event;
  if (!event || event.subtype === 'bot_message') return res.sendStatus(200);

  // 1) Pull thread + files, collapse into plain text
  const thread = await fetchSlackThread(event.channel, event.ts);

  // 2) AI triage → normalized payload
  const bug = await triageAgent(thread); // {title, summary, steps, env, severity, component_keywords, ...}

  // 3) Create ClickUp task (store taskId on your side)
  const clickupTask = await createClickUpTask(bug); // returns {id, url}

  // 4) Initial GitHub issue (triage-repo) with cross-links
  const ghIssue = await createGithubIssue({
    repo: 'org/triage',
    title: bug.title,
    body: renderIssueMarkdown(bug, { slackUrl: event.permalink, clickupUrl: clickupTask.url }),
    labels: ['bug', 'needs-routing']
  });

  res.sendStatus(200);
});
```

Docs for Slack Events & ClickUp/GitHub endpoints: ([Slack API][1], [Slack Developer Docs][2], [developer.clickup.com][6], [ClickUp Help][7], [GitHub Docs][5])

### 2) Repo Router (strategy sketch)

```ts
async function routeRepositories(bug) {
  const candidatesFromRules = matchKeywordsToRepos(bug.component_keywords);
  const ownersFromCODEOWNERS = await lookupOwners(candidatesFromRules);
  const semSearch = await embedAndRank(bug, allRepoDocsIndex); // READMEs, file paths, service names
  const codeSearchHits = await githubSearch(bug.errorClassesOrFiles);

  return rankAndScore([...candidatesFromRules, ...semSearch, ...codeSearchHits], ownersFromCODEOWNERS);
}
```

Use CODEOWNERS to find right teams/owners. ([GitHub Docs][3])

### 3) Background agent (GitHub Action, every 5 minutes)

`.github/workflows/triage-router.yml`

```yaml
name: Bug Router
on:
  schedule:
    - cron: "*/5 * * * *"  # every 5 min (UTC)
  workflow_dispatch:

jobs:
  route:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Route issues
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CLICKUP_TOKEN: ${{ secrets.CLICKUP_TOKEN }}
        run: node scripts/route-issues.js
```

Scheduling reference. ([GitHub Docs][9])

`scripts/route-issues.js` (pseudocode):

```js
const triageIssues = await listIssues('org/triage', { labels: ['needs-routing'], state: 'open' });
for (const issue of triageIssues) {
  const bug = parseBugPayload(issue.body);
  const { repos, confidence } = await routeRepositories(bug);
  if (confidence >= 0.7) {
    for (const repo of repos) {
      const newIssue = await createGithubIssue({ repo, title: issue.title, body: linkBack(issue), labels: ['bug'] });
      await comment(issue, `Routed to ${repo} → #${newIssue.number}`);
    }
    // Transfer if same org (optional)
    await transferIfSameOrg(issue, repos[0]); // graceful fallback if not allowed
    await removeLabel(issue, 'needs-routing'); addLabel(issue, 'routed');
    // Sync ClickUp fields/status
    await updateClickUp(bug.clickupId, { custom_fields: { repo: repos.join(',') }, status: 'Triage - Routed' });
  }
}
```

Issue creation API + recent changes to issue types. ([GitHub Docs][5], [The GitHub Blog][11])

### 4) Two-way status sync (webhooks)

* **GitHub → ClickUp:** When issue is closed or labeled `fixed`, update the ClickUp task status/assignee. (GitHub webhooks) ([GitHub Docs][8])
* **ClickUp → GitHub:** When task moves to “In Progress/Done”, comment or close the GitHub issue. (ClickUp API + webhook subscriptions). ([ClickUp Help][7])

---

## Practical tips

* **Idempotency & dedupe:** Hash the Slack thread URL + first 200 chars; store in a DB; don’t create duplicates.
* **Confidence gates:** Only auto-route above a threshold; otherwise @mention CODEOWNERS for human confirm. ([GitHub Docs][3])
* **Transfers vs. recreate:** You can transfer issues within the same org; otherwise close with a pointer and recreate in target repo via API/CLI. ([GitHub Docs][10])
* **Rate limits:** Batch and backoff for GitHub; “secondary rate limits” can hit when creating many issues quickly. ([tryapis.com][12])
* **Audit trail:** Always add cross-links (Slack, ClickUp, GitHub) to every artifact.
* **Security:** Scope tokens minimally (app/installation tokens on GitHub, workspace-scoped bot tokens in Slack, ClickUp OAuth for multi-tenant). ([GitHub Docs][8], [ClickUp Help][7])

---

## Can we “run an agent in the background to check each repo”?

**Yes.** You can do it as:

* a **GitHub App** reacting to webhooks in real time, and/or
* a **scheduled GitHub Action** that scans and routes at intervals (min 5-minute cadence), or
* a **separate worker** (e.g., queue with BullMQ/Celery) if you prefer your own infra. ([GitHub Docs][9])

If you want, I can turn this into a small starter repo (Slack listener, ClickUp/GitHub clients, router stub, and the scheduled Action) so you can drop in your keys and go.

[1]: https://api.slack.com/events-api?utm_source=chatgpt.com "Events API | Slack"
[2]: https://docs.slack.dev/apis/events-api/?utm_source=chatgpt.com "The Events API | Slack Developer Docs"
[3]: https://docs.github.com/enterprise-server%403.17/articles/about-code-owners?utm_source=chatgpt.com "About code owners - GitHub Enterprise Server 3.17 Docs"
[4]: https://github.blog/news-insights/product-news/introducing-code-owners/?utm_source=chatgpt.com "Introducing code owners - The GitHub Blog"
[5]: https://docs.github.com/en/rest/issues/issues?apiVersion=latest&utm_source=chatgpt.com "REST API endpoints for issues - GitHub Docs"
[6]: https://developer.clickup.com/reference/createtask?utm_source=chatgpt.com "Create Task - ClickUp API Documentation"
[7]: https://help.clickup.com/hc/en-us/articles/6303426241687-Use-the-ClickUp-API?utm_source=chatgpt.com "Use the ClickUp API"
[8]: https://docs.github.com/en/enterprise-server%403.14/apps/creating-github-apps/registering-a-github-app/using-webhooks-with-github-apps?utm_source=chatgpt.com "Using webhooks with GitHub Apps"
[9]: https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows?ref=airplane&utm_source=chatgpt.com "Events that trigger workflows - GitHub Docs"
[10]: https://docs.github.com/articles/transferring-an-issue-to-another-repository?tool=cli&utm_source=chatgpt.com "Transferring an issue to another repository - GitHub Docs"
[11]: https://github.blog/changelog/2025-03-18-github-issues-projects-rest-api-support-for-issue-types/?utm_source=chatgpt.com "GitHub Issues & Projects: REST API support for issue types"
[12]: https://tryapis.com/github/api/issues-create/?utm_source=chatgpt.com "GitHub API | Create an issue - tryapis.com"


Here’s a single, self-contained prompt you can paste into your AI IDE (Cursor/Copilot/Codeium, etc.). It tells the IDE exactly what to build end-to-end: Slack intake → AI triage → repo routing → create/sync GitHub issues + ClickUp tasks → background agent that keeps routing. It includes stack, folder structure, key files, and acceptance tests.

---

# 🔧 Build me a “Slack → AI Triage → GitHub + ClickUp Router” (Node/TS)

**Goal**
Implement a production-ready service that:

1. Listens to Slack bug messages,
2. Uses an LLM to normalize/triage them,
3. Decides the correct repo(s) to route to,
4. Creates issues in GitHub and a synced task in ClickUp,
5. Runs a background agent (cron + webhooks) to re-route and keep statuses in sync.

## Tech constraints

* **Language**: TypeScript (Node 20)
* **Framework**: Express + Slack Bolt (Events API or Socket Mode)
* **DB**: SQLite via Prisma (simple + file-based). (You may swap to Postgres with DATABASE\_URL if present.)
* **Queues/Jobs**: BullMQ (Redis optional; fall back to in-memory if REDIS\_URL missing)
* **LLM**: Wrap in an interface `TriageModel` with a default “mock or OpenAI-compatible” client; read key from `LLM_API_KEY`
* **GitHub**: Use a GitHub App token if provided; else fallback to `GITHUB_TOKEN` (classic PAT) for org repos
* **ClickUp**: REST API via `CLICKUP_TOKEN` and `CLICKUP_LIST_ID`
* **Infra**: Add a GitHub Action cron (every 5 min) to run router
* **Logging**: pino
* **Tests**: vitest

## Repository layout

```
ai-bug-router/
  .env.example
  package.json
  tsconfig.json
  src/
    index.ts
    server.ts
    config.ts
    logger.ts
    db/
      prisma.schema
      client.ts
      migrations/ (auto)
    slack/
      bolt.ts
      handlers.ts
      verify.ts
      format.ts
    ai/
      triageModel.ts
      triageAgent.ts
      prompts/triage.md
    routing/
      repoRegistry.json
      codeowners.ts
      semantic.ts
      router.ts
      score.ts
    github/
      client.ts
      issues.ts
      webhooks.ts
      transfer.ts
    clickup/
      client.ts
      tasks.ts
      webhooks.ts
    jobs/
      queue.ts
      routeIssue.job.ts
      syncStatus.job.ts
    http/
      routes.ts
      health.ts
    utils/
      text.ts
      idempotency.ts
      links.ts
  scripts/
    seed.ts
  .github/
    workflows/triage-router.yml
  README.md
```

## Environment variables (.env.example)

```
PORT=8080
APP_BASE_URL=http://localhost:8080

# Slack
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_LEVEL_TOKEN=xapp-... # if using Socket Mode

# LLM
LLM_PROVIDER=openai
LLM_API_KEY=sk-...

# GitHub
GITHUB_APP_ID=
GITHUB_APP_INSTALLATION_ID=
GITHUB_APP_PRIVATE_KEY_B64=
# fallback PAT (scopes: repo, issues)
GITHUB_TOKEN=

# ClickUp
CLICKUP_TOKEN=
CLICKUP_LIST_ID=

# Optional
REDIS_URL=
```

## Prisma schema (src/db/prisma.schema)

* Track dedupe + cross-links.
* Store AI triage payload (JSON), routing decisions, and sync states.

```prisma
datasource db { provider = "sqlite"; url = "file:./dev.db" }
generator client { provider = "prisma-client-js" }

model BugIntake {
  id            String   @id @default(cuid())
  slackChannel  String
  slackTs       String   // primary event ts
  slackPermalink String
  rawText       String
  triageJson    Json
  clickupTaskId String?  @unique
  githubIssueId String?  // triage repo issue number (e.g., org/triage#123)
  githubRepo    String?  // resolved repo if any
  status        String   @default("received") // received|triaged|routed|synced|closed
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  hash          String   @unique
}

model RoutingDecision {
  id           String   @id @default(cuid())
  bugId        String
  candidates   Json     // { repo: string, score: number }[]
  chosenRepo   String?
  confidence   Float?
  createdAt    DateTime @default(now())
  BugIntake    BugIntake @relation(fields: [bugId], references: [id], onDelete: Cascade)
}
```

## NPM scripts (package.json)

* `dev`, `build`, `start`
* `db:*` (prisma)
* `seed`
* `test`

```json
{
  "name": "ai-bug-router",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev --name init",
    "db:gen": "prisma generate",
    "db:studio": "prisma studio",
    "seed": "tsx scripts/seed.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@slack/bolt": "^3",
    "@octokit/app": "^15",
    "@octokit/rest": "^20",
    "axios": "^1",
    "bullmq": "^5",
    "clickup.js": "^1",
    "express": "^4",
    "pino": "^9",
    "prisma": "^5",
    "@prisma/client": "^5"
  },
  "devDependencies": {
    "tsx": "^4",
    "typescript": "^5",
    "vitest": "^1",
    "@types/express": "^4",
    "@types/node": "^20"
  }
}
```

## Core files (concise, production-ready stubs)

### src/config.ts

```ts
export const cfg = {
  port: parseInt(process.env.PORT || "8080", 10),
  baseUrl: process.env.APP_BASE_URL || "http://localhost:8080",
  slack: {
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    botToken: process.env.SLACK_BOT_TOKEN!,
    appToken: process.env.SLACK_APP_LEVEL_TOKEN, // optional
  },
  llm: {
    provider: process.env.LLM_PROVIDER || "openai",
    apiKey: process.env.LLM_API_KEY || "",
  },
  github: {
    appId: process.env.GITHUB_APP_ID,
    installationId: process.env.GITHUB_APP_INSTALLATION_ID,
    privateKeyB64: process.env.GITHUB_APP_PRIVATE_KEY_B64,
    token: process.env.GITHUB_TOKEN, // fallback
    triageRepo: process.env.GITHUB_TRIAGE_REPO || "org/triage",
  },
  clickup: {
    token: process.env.CLICKUP_TOKEN!,
    listId: process.env.CLICKUP_LIST_ID!,
  },
  redisUrl: process.env.REDIS_URL,
};
```

### src/logger.ts

```ts
import pino from "pino";
export const log = pino({ level: process.env.LOG_LEVEL || "info" });
```

### src/db/client.ts

```ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

### src/ai/triageModel.ts

```ts
export type TriageInput = { text: string, thread?: string };
export type TriageOutput = {
  title: string; summary: string;
  steps?: string[]; expected?: string; actual?: string;
  env?: string; severity?: "low"|"med"|"high"|"critical";
  component_keywords?: string[]; error_terms?: string[];
  links?: string[];
};

export interface TriageModel {
  triage(input: TriageInput): Promise<TriageOutput>;
}
```

### src/ai/triageAgent.ts

```ts
import { TriageModel, TriageInput, TriageOutput } from "./triageModel.js";
import { cfg } from "../config.js";
import { simpleHash } from "../utils/text.js";

export class DefaultTriage implements TriageModel {
  async triage(input: TriageInput): Promise<TriageOutput> {
    // Minimal heuristic fallback to keep the system working without an LLM key
    const firstLine = input.text.split("\n").find(Boolean) || "Bug Report";
    const title = firstLine.slice(0, 100);
    const severity = /prod|crash|security/i.test(input.text) ? "high" : "med";
    const component_keywords = Array.from(new Set(
      (input.text.match(/[a-z0-9\-_.]+\/[a-z0-9\-_.]+/gi) || [])
        .concat(input.text.match(/[A-Z][a-zA-Z0-9]+(?:Error|Exception)/g) || [])
    ));
    return {
      title,
      summary: input.text.slice(0, 1500),
      severity,
      component_keywords,
      error_terms: component_keywords.filter(k => /Error|Exception/i.test(k)),
      links: (input.text.match(/https?:\/\/\S+/g) || []).slice(0, 10)
    };
  }
}

export const triageAgent = new DefaultTriage();
export const triageHash = (channel: string, ts: string, text: string) =>
  simpleHash(`${channel}:${ts}:${text.slice(0,200)}`);
```

### src/routing/repoRegistry.json

```json
{
  "frontend": ["web", "ui", "react", "next"],
  "backend": ["server", "api", "express", "fastify"],
  "payments": ["stripe", "braintree", "checkout"],
  "mobile": ["android", "ios"]
}
```

### src/routing/router.ts

```ts
import registry from "./repoRegistry.json" assert { type: "json" };
import { scoreCandidates } from "./score.js";

export function routeRepositories(keywords: string[]): { repo: string; score: number }[] {
  const candidates: { repo: string; score: number }[] = [];
  const map: Record<string, string[]> = registry as any;

  Object.entries(map).forEach(([repo, hints]) => {
    const hit = keywords.filter(k =>
      hints.some(h => k.toLowerCase().includes(h.toLowerCase()))
    ).length;
    if (hit > 0) candidates.push({ repo, score: hit });
  });

  return scoreCandidates(candidates);
}
```

### src/routing/score.ts

```ts
export function scoreCandidates(cs: { repo: string; score: number }[]) {
  if (!cs.length) return [];
  const max = Math.max(...cs.map(c => c.score));
  return cs
    .map(c => ({ ...c, score: c.score / max }))
    .sort((a,b) => b.score - a.score);
}
```

### src/github/client.ts

```ts
import { Octokit } from "@octokit/rest";
import { App } from "@octokit/app";
import { cfg } from "../config.js";

export async function getOctokit(): Promise<Octokit> {
  if (cfg.github.appId && cfg.github.privateKeyB64 && cfg.github.installationId) {
    const app = new App({
      appId: cfg.github.appId!,
      privateKey: Buffer.from(cfg.github.privateKeyB64!, "base64").toString("utf8")
    });
    const auth = await app.getInstallationAccessToken({ installationId: Number(cfg.github.installationId) });
    return new Octokit({ auth });
  }
  return new Octokit({ auth: cfg.github.token });
}
```

### src/github/issues.ts

```ts
import { getOctokit } from "./client.js";

export async function createIssue(fullRepo: string, title: string, body: string, labels: string[] = []) {
  const [owner, repo] = fullRepo.split("/");
  const octo = await getOctokit();
  const { data } = await octo.issues.create({ owner, repo, title, body, labels });
  return { number: data.number, url: data.html_url };
}
```

### src/clickup/client.ts

```ts
import axios from "axios";
import { cfg } from "../config.js";

const api = axios.create({
  baseURL: "https://api.clickup.com/api/v2",
  headers: { Authorization: cfg.clickup.token }
});

export const clickup = {
  async createTask(payload: any) {
    const { data } = await api.post(`/list/${cfg.clickup.listId}/task`, payload);
    return data; // { id, url, ... }
  },
  async updateTask(id: string, payload: any) {
    const { data } = await api.put(`/task/${id}`, payload);
    return data;
  }
};
```

### src/slack/bolt.ts

```ts
import { App } from "@slack/bolt";
import { cfg } from "../config.js";

export const slackApp = new App({
  signingSecret: cfg.slack.signingSecret,
  token: cfg.slack.botToken,
  appToken: cfg.slack.appToken, // if using Socket Mode
  socketMode: !!cfg.slack.appToken
});
```

### src/slack/handlers.ts

```ts
import { slackApp } from "./bolt.js";
import { prisma } from "../db/client.js";
import { triageAgent, triageHash } from "../ai/triageAgent.js";
import { createIssue } from "../github/issues.js";
import { clickup } from "../clickup/client.js";
import { routeRepositories } from "../routing/router.js";
import { cfg } from "../config.js";
import { buildMarkdown } from "../utils/links.js";

export function registerSlackHandlers() {
  // Trigger: message with :beetle: reaction or in #bugs
  slackApp.event("reaction_added", async ({ event, client }) => {
    if (event.reaction !== "beetle") return;

    const channel = event.item.channel!;
    const ts = (event.item as any).ts!;
    const { messages } = await client.conversations.history({ channel, latest: ts, inclusive: true, limit: 1 });
    const msg = messages?.[0];
    if (!msg?.text) return;

    const permalink = (await client.chat.getPermalink({ channel, message_ts: ts })).permalink!;
    const hash = triageHash(channel, ts, msg.text);

    // dedupe
    const existing = await prisma.bugIntake.findUnique({ where: { hash } });
    if (existing) return;

    const triage = await triageAgent.triage({ text: msg.text });

    // Create ClickUp task first
    const task = await clickup.createTask({
      name: triage.title,
      description: `From Slack: ${permalink}\n\n${triage.summary}`
    });

    // Create initial GH issue in triage repo
    const md = buildMarkdown({ triage, slackPermalink: permalink, clickupUrl: task.url });
    const gh = await createIssue(cfg.github.triageRepo, triage.title, md, ["bug","needs-routing"]);

    // Persist
    await prisma.bugIntake.create({
      data: {
        slackChannel: channel,
        slackTs: ts,
        slackPermalink: permalink,
        rawText: msg.text,
        triageJson: triage as any,
        clickupTaskId: task.id,
        githubIssueId: `${cfg.github.triageRepo}#${gh.number}`,
        status: "triaged",
        hash
      }
    });
  });
}
```

### src/utils/links.ts

```ts
import type { TriageOutput } from "../ai/triageModel.js";
export function buildMarkdown(params: { triage: TriageOutput, slackPermalink: string, clickupUrl: string }) {
  const { triage, slackPermalink, clickupUrl } = params;
  return [
    `**Slack**: ${slackPermalink}`,
    `**ClickUp**: ${clickupUrl}`,
    "",
    `### Summary`,
    triage.summary,
    "",
    triage.steps?.length ? `### Steps\n${triage.steps.map(s=>`- ${s}`).join("\n")}` : "",
    triage.expected ? `\n**Expected:** ${triage.expected}` : "",
    triage.actual ? `\n**Actual:** ${triage.actual}` : "",
    triage.env ? `\n**Env:** ${triage.env}` : "",
    triage.component_keywords?.length ? `\n**Keywords:** ${triage.component_keywords.join(", ")}` : "",
  ].join("\n");
}
```

### src/jobs/routeIssue.job.ts

```ts
import { prisma } from "../db/client.js";
import { routeRepositories } from "../routing/router.js";
import { createIssue } from "../github/issues.js";
import { cfg } from "../config.js";
import { clickup } from "../clickup/client.js";

export async function routeOpenBugs() {
  const open = await prisma.bugIntake.findMany({ where: { status: { in: ["triaged","received"] } } });
  for (const b of open) {
    const triage = b.triageJson as any;
    const ranked = routeRepositories(triage.component_keywords || []);
    if (!ranked.length || ranked[0].score < 0.7) continue;

    const target = ranked[0].repo;
    const body = `Auto-routed from ${b.githubIssueId}\n\n` + (triage.summary || "");
    const gh = await createIssue(`org/${target}`, triage.title, body, ["bug"]);

    await prisma.routingDecision.create({
      data: { bugId: b.id, candidates: ranked as any, chosenRepo: target, confidence: ranked[0].score }
    });

    await prisma.bugIntake.update({
      where: { id: b.id },
      data: { status: "routed", githubRepo: `org/${target}` }
    });

    if (b.clickupTaskId) {
      await clickup.updateTask(b.clickupTaskId, { status: "Triage - Routed" });
    }
  }
}
```

### src/http/routes.ts

```ts
import { Router } from "express";
import { routeOpenBugs } from "../jobs/routeIssue.job.js";

export const routes = Router();
routes.get("/health", (_req, res) => res.json({ ok: true }));
routes.post("/jobs/route", async (_req, res) => { await routeOpenBugs(); res.json({ ok: true }); });
```

### src/server.ts

```ts
import express from "express";
import { routes } from "./http/routes.js";

export function createServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api", routes);
  return app;
}
```

### src/index.ts

```ts
import { cfg } from "./config.js";
import { createServer } from "./server.js";
import { slackApp } from "./slack/bolt.js";
import { registerSlackHandlers } from "./slack/handlers.js";

(async () => {
  registerSlackHandlers();
  await slackApp.start();
  const app = createServer();
  app.listen(cfg.port, () => console.log(`http server on :${cfg.port}`));
})();
```

### .github/workflows/triage-router.yml

```yaml
name: Bug Router
on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch:
jobs:
  route:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run db:gen
      - run: npm run db:migrate
      - name: Route issues
        env:
          PORT: "8080"
          APP_BASE_URL: ${{ secrets.APP_BASE_URL }}
          SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          LLM_PROVIDER: ${{ secrets.LLM_PROVIDER }}
          LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
          GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
          GITHUB_APP_INSTALLATION_ID: ${{ secrets.GITHUB_APP_INSTALLATION_ID }}
          GITHUB_APP_PRIVATE_KEY_B64: ${{ secrets.GITHUB_APP_PRIVATE_KEY_B64 }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CLICKUP_TOKEN: ${{ secrets.CLICKUP_TOKEN }}
          CLICKUP_LIST_ID: ${{ secrets.CLICKUP_LIST_ID }}
        run: node --loader tsx ./src/jobs/routeIssue.job.ts
```

## Acceptance criteria

* Reacting with \:beetle: to any Slack message creates:

  * A ClickUp task (title = triage.title, description contains Slack permalink)
  * A GitHub issue in `{GITHUB_TRIAGE_REPO}` labeled `bug, needs-routing`
  * A DB row with dedupe hash
* Hitting `POST /api/jobs/route` (or waiting for cron) routes any triaged bug to the top-scoring repo (≥0.7)

  * Creates issue(s) in target repo(s) with link back to triage issue
  * Updates ClickUp status to `Triage - Routed`
* Idempotency: The same Slack message won’t create duplicates
* Logs show each step with timing
* Unit tests:

  * `routing/router.ts` scores candidates deterministically
  * `ai/triageAgent.ts` extracts keywords from sample text
  * `jobs/routeIssue.job.ts` skips when score < 0.7

## Quickstart commands

1. `cp .env.example .env` (fill values)
2. `npm i`
3. `npm run db:gen && npm run db:migrate`
4. `npm run dev`
5. In Slack, add the bot to a channel and react with \:beetle: on a message

## Notes for the IDE

* Generate all missing imports/types.
* Where external APIs are called, include small retry/backoff.
* Keep each module < \~120 lines where possible.
* Document each public function with JSDoc.
* Provide 3 vitest tests: router scoring, triage extraction, job gating.

---

**That’s the full prompt.** Paste it into your AI IDE and let it scaffold the project. If you want, I can tailor it to your exact repos (names, CODEOWNERS logic, and a semantic index step) next.
