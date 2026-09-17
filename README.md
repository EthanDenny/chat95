# Chat95

A Windows 95-inspired chat application built with React, TypeScript, Vite, and a
Cloudflare Worker. The browser UI uses the separately maintained
[`@ethandenny/win95-ui`](https://github.com/EthanDenny/win95-ui) component package.

## Run locally

```sh
npm install
cp .env.example .env.local
# Set OPENROUTER_API_KEY in .env.local, then:
npm run dev
```

The browser calls the same-origin `/api/chat` endpoint. The Vite development
plugin and production Cloudflare Worker proxy requests to OpenRouter, so the API
key remains server-side. Never prefix credentials with `VITE_`.

Conversations, drafts, folders, tool receipts, and the selected conversation are
stored in localStorage. Clearing site data removes them; they do not sync between
browsers or domains. Interrupted and provider-error replies remain visible and
offer Retry.

## Model behavior

The server-owned prompt in `server/chat-api.ts` places Chat95 on the user's
current month and day in 1996 while limiting its knowledge to the end of 1994.
It discloses that boundary only when directly asked about its knowledge or
cutoff, and avoids wording that implies later events exist.

Assistant replies support basic Markdown: paragraphs, lists, bold, italics, and
code. Emoji are removed before display. User messages, status text, and tool
receipts remain plain text; raw HTML, remote images, and active links are not
rendered.

## Conversations and tools

The conversation browser uses top-level folders. The assistant can call
`search_conversations` to search saved titles and messages, and
`manage_folders` to list, create, rename, or delete folders and move
conversations. Mutating folder actions require confirmation. Tool definitions,
validation, and round limits are owned by the proxy; client-supplied system
prompts and tool definitions are ignored.

## Win95 UI dependency

Chat95 pins `@ethandenny/win95-ui@0.1.0` as the checked-in package archive
`vendor/ethandenny-win95-ui-0.1.0.tgz`. This keeps clean installs and Cloudflare
deployments reproducible without a GitHub token even though both repositories are
private. Components, fonts, icon sprites, choice glyphs, and cursors live in the
Win95 UI repository rather than this project.

To update it, release a new package version in a sibling `win95-ui` checkout,
run `npm pack` there, copy the resulting archive into `vendor/`, update the
dependency path in `package.json`, and run `npm install`.

## Cloudflare deployment

Production uses one Cloudflare Worker with Static Assets at
[chat95.ethandenny.dev](https://chat95.ethandenny.dev). Only `/api/*` invokes the
Worker.

```sh
npx wrangler login
npm run cf:types
npx wrangler secret put OPENROUTER_API_KEY
npm run deploy
```

For the first deployment, provide an ignored secrets file to Wrangler. Do not
commit credentials or put them in `wrangler.jsonc`. The API applies same-origin,
request-size, timeout, output-token, and approximate per-IP/per-location rate
limits. OpenRouter usage may incur charges independently of Cloudflare's free
tier.

## Structure

- `src/chat/` contains the chat UI, local history, folders, Markdown rendering,
  and browser-executed tools.
- `server/` contains the shared prompt, OpenRouter proxy, and validation.
- `worker/` adapts the proxy to Cloudflare Workers and Static Assets.
- `vendor/` contains the exact Win95 UI package used by the app.
- `scripts/test-*.ts` cover chat behavior, storage, tools, Markdown, and the
  Worker boundary.

## Validation

```sh
npm test
npm run lint
npm run build
```

The component library has its own test, lint, build, specimen, and visual
verification workflows in the Win95 UI repository.
