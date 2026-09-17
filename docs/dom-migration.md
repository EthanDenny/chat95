# DOM migration verification

Checked locally on 2026-09-16 against the Vite app using browser UI automation.

## Browser checks

- `/` is empty and inherits the white root background.
- `/test/desktop`, static `/test/design`, and interactive `/test/design` each
  report zero canvas elements. No browser source file calls a canvas API.
- All 14 font faces appear with the intended family, size, and weight; fonts
  finish loading. No broken images or browser errors observed.
- Calculator button sequence 2 + 3 = produces 5.
- Application menus focus their items; About dialog focuses OK, closes with
  Escape, and restores focus. Control Panel Display opens, changes the desktop
  color, and restores focus to Display when dismissed.
- Internet Explorer accepts typed addresses with Enter, updates history,
  renders real links and text, and scrolls its real viewport (End reached
  scrollTop 303 in the tested window).
- Resize outline changes while the window remains at its original size.
  Escape removes the outline without changing dimensions; Enter commits a
  ten-pixel width reduction. Pointer title dragging changes position, and
  maximizing fills the 640 × 450 desktop work area and removes resize handles.
- Interactive gallery: Space activates a button; Disabled disables it;
  checkbox/radio inputs change; text editing works; ArrowUp increments the
  numeric field; dropdown keyboard navigation selects Settings.
- Tree keyboard Left selects the parent and then collapses it (ten rows become
  two). List End selects the last row. File-list End selects the last file and
  scrolls horizontally. The split-pane separator responds to ArrowRight.
- Static gallery inspection covers typography, window chrome, tree/list/details
  views, and scrolling. Corrected font inheritance in the static compositions.

## Automated checks

- `npm run build` and `npm run lint` pass.
- `npm test`: 13 passing tests, including a browser-source migration guard.
- `scripts/verify-web-font.py`: all 3,052 glyphs in 14 WOFF faces preserve exact
  bitmap geometry, advances, bearings, and baselines.
- `npm run verify:fonts`: five source screenshot crops have zero differences
  against the offline bitmap renderer.
- `npm run verify:apps`: retained offline painters still match the original
  initial app screenshots. These percentages do not validate the DOM output.

No pixel-perfect browser screenshot percentage is claimed. The browser owns
font rasterization; icon bitmaps, glyph source geometry, physical-pixel scaling,
layout dimensions, and interaction checks are verified separately.
