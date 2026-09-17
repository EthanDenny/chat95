# Windows 95 Desktop

A local React + TypeScript app built with Vite. The entire interface uses browser
DOM elements, CSS, original icon images, and pixel-derived web fonts. There are
no live canvases or transparent controls layered over painted interfaces.

## Run locally

```sh
npm install
npm run dev
```

- `/` — blank white index.
- `/test/desktop` — Calculator, Control Panel, and Internet Explorer recreation.
- `/test/design` — component workbench, with static specimens and an Interactive toggle.

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

## Structure

- `src/components/` — shared buttons, visible text inputs, checkbox/radio inputs,
  dropdowns, list/tree views, scroll areas, window chrome, taskbar buttons,
  surfaces, text, and physical-pixel scaling.
- `src/apps/` — desktop state and window behavior, application layouts,
  Calculator/Control Panel/browser views, menus, dialogs, and taskbar.
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
reference-renderer imports in browser source.

`verify:fonts` compares the offline bitmap renderer with original screenshot
font crops. `verify:apps` compares the retained offline app painters with source
screenshots. Their exact-match percentages do **not** measure the migrated DOM
interface. Browser interaction and visual checks are performed separately.
