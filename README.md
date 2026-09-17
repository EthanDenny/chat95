# Chat95

Chat95 is a Windows 95-inspired chat app powered by OpenRouter and deployed with Cloudflare Workers and Static Assets.

[Open Chat95](https://chat95.ethandenny.dev) · [Win95 UI component library](https://github.com/EthanDenny/win95-ui)

## Prerequisites

- Node.js 22 or newer
- npm
- An [OpenRouter](https://openrouter.ai/) API key
- A Cloudflare account only if you plan to deploy

## Local setup

1. Clone the repository and install dependencies:

   ```sh
   git clone https://github.com/EthanDenny/chat95.git
   cd chat95
   npm ci
   ```

2. Create your local environment file:

   ```sh
   cp .env.example .env.local
   ```

3. Add your OpenRouter credentials to `.env.local`:

   ```dotenv
   OPENROUTER_API_KEY=<your-openrouter-key>
   OPENROUTER_MODEL=stealth/union-alpha
   ```

   The API key is read only by the local server and must not use a `VITE_` prefix. Never commit `.env.local`.

4. Start the development server:

   ```sh
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173).

Restart the development server after changing environment variables. The private Win95 UI dependency is included as a vendored package, so a fresh install does not require GitHub or npm registry credentials.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite with the local chat API proxy |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview an existing production build locally |
| `npm test` | Run the automated tests |
| `npm run lint` | Run Oxlint |
| `npm run cf:types` | Regenerate Cloudflare binding types |
| `npm run cf:dev` | Build and run the app with Wrangler locally |
| `npm run deploy` | Build and deploy to Cloudflare |

## Cloudflare development

To test the Worker runtime locally, create an ignored `.dev.vars` file:

```dotenv
OPENROUTER_API_KEY=<your-openrouter-key>
```

Then run:

```sh
npm run cf:dev
```

The model used by the Worker is configured through `OPENROUTER_MODEL` in `wrangler.jsonc`.

## Deploying

The checked-in `wrangler.jsonc` is configured for `chat95.ethandenny.dev`. If you are deploying a fork, first update its Worker name, account ID, and custom-domain route.

Authenticate with Cloudflare and store the OpenRouter key as a Worker secret:

```sh
npx wrangler login
npx wrangler secret put OPENROUTER_API_KEY
```

Deploy the Worker and frontend assets:

```sh
npm run deploy
```

Keep credentials out of `wrangler.jsonc` and other tracked files. To change the production model, update `vars.OPENROUTER_MODEL` in `wrangler.jsonc` and deploy again.

## Updating the Win95 UI package

Chat95 installs `@ethandenny/win95-ui` from the archive in `vendor/`. To update it:

1. Build and test the desired version in a checkout of [EthanDenny/win95-ui](https://github.com/EthanDenny/win95-ui).
2. Run `npm pack` in that repository.
3. Copy the generated archive into this repository's `vendor/` directory.
4. Update the archive path in `package.json`.
5. Run `npm install`, then validate with `npm test`, `npm run lint`, and `npm run build`.

Commit the new archive together with `package.json` and `package-lock.json` so clean installs remain reproducible.

## Project map

- `src/` — React application and chat interface
- `server/` — shared server-side chat handling
- `worker/` — Cloudflare Worker entry point
- `vendor/` — packaged Win95 UI dependency
- `scripts/` — automated tests and repository utilities

## Troubleshooting

- **The chat API is unavailable locally:** confirm `OPENROUTER_API_KEY` is set in `.env.local`, then restart `npm run dev`.
- **The deployed Worker cannot reach OpenRouter:** set the secret again with `npx wrangler secret put OPENROUTER_API_KEY` and redeploy.
- **Local conversations are missing in production:** chat history is stored in browser local storage and is separate for each origin.
- **The UI package fails to install:** verify that the archive named in `package.json` exists in `vendor/` and is committed.
