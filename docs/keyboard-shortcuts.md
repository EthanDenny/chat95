# App keyboard shortcuts

Opening, restoring, or switching apps gives keyboard focus to the app. Control
Panel focuses its selected icon; other apps focus their window. Native input
editing and text selection keep their own keys. The host OS/browser may reserve
some key combinations before they reach the page; shortcuts below operate on
keyboard events delivered to the app. Mac Command shortcuts stay with the host.

| App | Keys | Action |
| --- | --- | --- |
| All | Alt + underlined menu letter | Open menu |
| All | F10 | Focus menu bar |
| Menus | Arrows, Home, End, Enter, initial letter | Navigate or invoke command |
| Menus | Escape | Back out of popup, then return to app |
| All | Alt+F4 | Close window; dismiss a modal first |
| Calculator | Digits, operators, decimal point/comma, Enter or = | Calculate; Enter always equals |
| Calculator | Escape, Delete, Backspace | Clear, clear entry, backspace |
| Calculator | F9, @, R | Change sign, square root, reciprocal |
| Calculator | Ctrl+L/R/M/P | Clear/recall/store/add memory |
| Calculator | Ctrl+C/V | Copy/paste number (subject to browser clipboard permission) |
| Browser | Alt+D, Ctrl+L, Ctrl+O, F6 | Focus and select address |
| Browser | Enter in address | Navigate |
| Browser | Alt+Left/Right, Alt+Home | Back, forward, home |
| Browser | F5, Ctrl+R, Escape | Refresh or stop |
| Browser | F4, Ctrl+D, Ctrl+P | Address history, add favorite, print dialog |
| Control Panel | Arrows, Home/End, Page Up/Down, typing | Navigate icons |
| Control Panel | Enter | Open focused applet |
| All | F1 | Help menu or browser help page |

Calculator key mappings are cross-checked with the Windows 95 Calculator table
in [Alan Jorgensen's case study, Appendix A, page 136](https://cs.fit.edu/media/TechnicalReports/cs-2002-09.pdf#page=151).

Verification: unit tests cover command mapping, calculator key sequences,
modifier isolation, composition, and native text-editing exclusions. Browser
checks cover Enter after a clicked calculator digit, memory recall/sign, menu
accelerators and focus recovery, app/taskbar switching, address selection,
history, refresh/stop, Print, Control Panel navigation, and modal/window close.
