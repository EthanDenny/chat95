# Windows 95 Desktop

A local React + TypeScript app built with Vite. The entire interface uses browser
DOM elements, CSS, original icon images, and pixel-derived web fonts. There are
no live canvases or transparent controls layered over painted interfaces.

## Run locally

```sh
npm install
cp .env.example .env.local
# Set OPENROUTER_API_KEY in .env.local, then:
npm run dev
```

- `/` — Chat95, an OpenRouter-powered chat with conversation history, Stop, and Retry.
- `/test/desktop` — Calculator, Control Panel, and Internet Explorer recreation.
- `/test/design` — component workbench, with static specimens and an Interactive toggle.
- `/test/components` — searchable catalog of every reusable component, with filenames,
  live examples, state controls, resets, and expandable source code.

The desktop uses a 640 × 480 logical coordinate space, scaled to whole physical
pixels with black letterboxing. Retina density and browser zoom are included.
The gallery always uses two physical pixels per source pixel. Small viewports
scroll instead of shrinking the UI to fractional physical pixels.

Move windows by their title bars; resize Control Panel and the browser from
edges/corners. The dotted outline commits on release or Enter; Escape cancels.
Calculator remains fixed-size. Title bars and resize handles also support arrow
keys (Shift moves ten pixels). Window controls, taskbar, and Start menu work.

Calculator supports arithmetic and memory. Control Panel provides applet
previews and working desktop color settings. The browser supports address
editing, local informational pages, history, favorites, and scrolling; external
addresses offer a link to open the website in the host browser.

## Chat setup

Set `OPENROUTER_API_KEY` in `.env.local` (ignored by Git). The default model is
`stealth/union-alpha`; change `OPENROUTER_MODEL` to another OpenRouter model ID.
Restart Vite after changing these settings. Never prefix credentials with `VITE_`.

The browser calls the same-origin `/api/chat` endpoint. A Cloudflare Worker (or a Vite plugin locally)
forwards conversation history to [OpenRouter](https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion).
The key stays on the server and is never included in the client bundle.
This endpoint runs under `npm run dev` and `npm run preview`; serving `dist/`
by itself will not provide the API. Responses are currently non-streaming.
Conversations, drafts, and the selected chat are saved in this browser's localStorage
and restored on reload. Credentials and transient request state are not stored.
If a reload interrupts a reply, the restored conversation offers Retry. Clearing
site data removes saved history; history does not sync between devices.

The server prepends a system prompt in `server/chat-api.ts` that places Chat95 in late
1994, with December 31, 1994 as its private reference date. It stays in character
without acknowledging the date, cutoff, or roleplay, and responds naturally to
unfamiliar topics rather than explaining a knowledge limit. This is a prompted
behavior, not a change to the model's training data.
The prompt also prohibits indirect hindsight, such as calling the Star Wars films
the "original trilogy" or adding "so far" to imply later releases.

The chat title bar controls the browser where web APIs permit it: Maximize enters
fullscreen, Restore exits fullscreen, and Close requests that the tab close.
Minimize is disabled because webpages cannot minimize the browser window.
If the browser refuses fullscreen or closing, Chat95 explains the limitation.

The compact toolbar provides New, Save, Delete, Find, and Stop. Delete requires
confirmation and removes only the selected conversation from this browser.
Find filters conversation titles; Escape closes Find. Drag the pane divider or
focus it and use the arrow keys (Shift for larger steps) to resize the sidebar.
The title bar shows the active conversation, and Help contains About Chat95.

The conversation browser works like a Windows 95 file list: single-click to
select, double-click or press Enter to open a folder or conversation. Use Look in
to jump to a folder, or Up / Backspace to return to Conversations. Folders appear
first, alphabetically, followed by conversation documents; there is no wrapper tree.
New creates a conversation in the folder being browsed. File > New Folder creates
a top-level folder. The Folder menu moves the selected conversation or renames
and deletes the selected folder; F2 renames and Delete removes the selected item
after confirmation. Deleting a folder keeps all its conversations. Find searches
all folders and conversation titles. Browsing does not switch the open conversation
until a document is opened, preserving the current draft.
Folders and membership persist in localStorage alongside messages and drafts.

### Chat tools

Agent replies render basic Markdown (paragraphs, bulleted/nested/numbered lists,
bold, italics, and code) using the desktop fonts. User messages, status text, and
tool receipts remain plain text. Raw HTML is escaped; remote images and active
links are disabled. Stored messages remain unchanged, so existing replies also
gain formatting and text exports retain their original Markdown.

The assistant can call `search_conversations` to search saved titles and sent
messages, and `manage_folders` to list, create, rename, delete folders, or move a
conversation. Both execute in the browser against the latest local history.
Search is case-insensitive, paginated, and returns at most ten short excerpts;
unsent drafts are never searched or sent as tool results. Only requested results
are sent to OpenRouter, not the complete local history.

Every folder change requires a confirmation dialog with a named action and Cancel. Targets are checked again
after approval, and deleting a folder never deletes its conversations. The chat
shows tool progress in the status bar and keeps an activity record across reloads.
Each reply has a compact operation count and Details button; the Windows-style
Operation Details dialog lists the receipts and shows the selected entry in full.
Retry within the same tab resumes completed tool calls without replaying them;
after a reload, the activity record is provided as context and any further
changes still require approval. Stop cancels pending requests and approvals.

The proxy owns the fixed tool schemas and validates paired assistant/tool
messages. Client-supplied system prompts and tool definitions are ignored.
Each turn is limited to four tool rounds, with up to four calls per round;
each model request still passes through the existing rate limits. API keys
remain on the server. Tool results and retrieved chat text are treated as
untrusted reference data, not instructions.
The v2 history store imports existing v1 history and leaves the old key intact
as a migration backup; refresh older tabs before continuing to edit history.

## Cloudflare deployment

The production app uses one Worker with Static Assets at
[chat95.ethandenny.dev](https://chat95.ethandenny.dev). No Fly.io server or database
is needed. The frontend is built into `dist/`; only `/api/*` invokes the Worker.
Cloudflare manages the custom domain and HTTPS certificate.

```sh
npx wrangler login
npm run cf:types
npx wrangler secret put OPENROUTER_API_KEY
npm run deploy
```

For the first deployment, provide a private, ignored `.env` file containing only
`OPENROUTER_API_KEY` with `npx wrangler deploy --secrets-file <file>` after building.
Subsequent deployments preserve the secret. Do not commit credentials, put them
in `wrangler.jsonc`, or prefix them with `VITE_`. `npm run cf:dev` builds the UI
and runs the actual Worker locally; local secrets can live in ignored `.dev.vars`.
Rerun `npm run cf:types` after changing Worker bindings.

The public API requires a same-origin browser request and limits each IP to six
requests per minute, plus 30 per minute for the site per Cloudflare data center.
These approximate rate limits are abuse mitigation, not authentication or a hard
global spending cap. Use an OpenRouter key spending limit to bound model charges.
Requests are limited to 128 KiB, provider replies to 512 KiB, and completions to
2,048 output tokens with a 60-second timeout. Provider errors remain chat messages
with Retry. Requests and provider responses are not logged by application code.

Static hosting is free; Worker API requests fit the Free plan within its daily
quota. OpenRouter inference is separate and may incur charges. Chat history is
browser-local: localhost history does not transfer to the production domain.

## Structure

- `src/components/` — shared buttons, visible text inputs, checkbox/radio inputs,
  dropdowns, list/tree views, scroll areas, window chrome, taskbar buttons,
  surfaces, text, and physical-pixel scaling. Also includes menus, dialogs, windows,
  toolbars, taskbars, Start menus, icon buttons, number inputs, spinners, split panes,
  status fields, and color swatches. See `src/components/README.md` for the APIs.
- `src/apps/` — desktop state and window behavior, application layouts,
  Calculator/Control Panel/browser views, and thin adapters connecting shared
  menus, dialogs, window chrome, and taskbars to desktop state.
- `src/ComponentsPage.tsx`, `src/catalog/` — catalog UI, inventory, and live stories.
- `src/TestPages.tsx` — lazy-loaded local test routes; the index opens Chat95.
- `src/DesignPage.tsx`, `*Specimens.tsx`, `Interactive*.tsx` — gallery compositions
  using the same browser components as the desktop.
- `src/theme.ts`, `captionGlyphs.ts`, `collectionModel.ts`, `icons.ts` — shared
  palette, dimensions, pixel masks, scroll geometry, and icon names.
- `src/bitmapFont.ts` — original font roles and integer glyph metrics.
  `NativeText` renders actual selectable DOM text with generated WOFF faces.
- `scripts/reference/` — offline canvas painters retained only for historical
  screenshot/font comparisons. They are not imported by the browser app.

Native inputs own editing, selection, caret, clipboard, undo, and form behavior.
Dropdowns use DOM combobox/listbox popups to preserve their theme. Lists and trees
use visible DOM rows, keyboard navigation, selection, and real overflow viewports.
Custom CSS/SVG scrollbars control those viewports with arrows, track clicks,
thumb dragging, and keyboard scrolling. Modal dialogs trap focus and restore it
when dismissed. Move/resize tracking uses CSS rather than a canvas.

## Original fonts and assets

All 14 supported faces use the verified Windows bitmap sources: MS Sans Serif
8/10/12/14/18/24 pt, regular and GDI raster-bold; native System 10 pt bold; and
Fixedsys 12 pt. Each source pixel becomes a rectangular web-font outline, with
original advances and baseline. Font synthesis and kerning are disabled.
Browser/OS rasterization still affects the final display; exact source geometry
does not establish a universal pixel-perfect browser screenshot match.

See `public/fonts/README.md` for provenance. Original icons and cursors are PNG/ICO
assets, not rendered controls. Cursor sizes are generated ahead of time by
`npx tsx scripts/build-cursors.ts`, using nearest-neighbor enlargement.

## Validation

```sh
npm run build
npm run lint
npm test
npm run verify:fonts
npm run verify:apps
python scripts/build-web-font.py
python scripts/verify-web-font.py
```

Install `scripts/requirements-fonts.txt` before running the Python commands.
Web-font verification checks all 3,052 glyphs across 14 faces, including outlines,
advances, bearings, and baselines. Tests cover calculator behavior, browser
history, resizing, source font metrics, and a guard against canvas APIs or
reference-renderer imports in browser source. Catalog tests also verify every
exported component has a story and no shared component imports app or demo code.

`verify:fonts` compares the offline bitmap renderer with original screenshot
font crops. `verify:apps` compares the retained offline app painters with source
screenshots. Their exact-match percentages do **not** measure the migrated DOM
interface. Browser interaction and visual checks are performed separately.
