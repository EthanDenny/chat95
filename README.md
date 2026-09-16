# Windows 95 Desktop

A local React + TypeScript app built with Vite. Features a classic teal desktop, a draggable window, keyboard movement, working window controls, a Start menu, and a live taskbar clock.

The entire desktop renders into a 640 × 480 canvas, including text, icons, focus indicators, and window controls. Text uses the original MS Sans Serif bitmap glyphs and spacing from SSERIFE.FON: 8pt for the UI, 10pt for the heading, and 24pt for the banner. Pixels are drawn directly, without browser font rasterization or thresholding. Bold uses a one-pixel horizontal overstrike. Font provenance and regeneration instructions are in public/fonts/README.md.

The canvas enlarges with nearest-neighbor sampling at the largest whole-number physical pixel scale that fits, with black borders filling the remaining space. Display density (Retina) and browser zoom are included in the scaling calculation. Viewports smaller than the native pixel buffer scroll instead of shrinking it. Transparent native controls preserve keyboard and screen-reader access.

## Development

```sh
npm install
npm run dev
```

Open `/test/design` for the component workbench. It includes editable interface text,
font weights and native sizes, caption controls, active/inactive title bars,
button states and an interactive button, raised/sunken surfaces, icons, and colors.
All component previews render at a fixed 2× physical pixel scale.

`src/win95.ts` owns the shared drawing primitives, palette, and control metrics.
`src/bitmapFont.ts` owns bitmap text. `src/designSamples.ts` composes specimens
from these same functions; `/test/desktop` is the working desktop. Changes to shared
primitives affect both pages.

## Production

```sh
npm run build
npm run preview
```

Drag the blue title bar to move the window, or focus it and use arrow keys to move one pixel (Shift moves ten). Double-click the title bar to maximize or restore. Reopen a closed window using the Welcome desktop shortcut or Start menu.

The index route `/` is blank white. Open `/test/desktop` for the desktop and `/test/design` for the component workbench.
