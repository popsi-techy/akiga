---
"@akiga/design-system-app": patch
---

Tabs that do not fit now collapse into a More menu instead of a scrolling strip. Scroll arrows hid both the fact that there was more and how much: the sections past the fold were invisible, uncounted, and reachable only by dragging. The strip measures itself against a hidden ruler, drops as many tabs as it must, and puts them behind a More button that states the count and lists them; it re-decides on every resize with no work from the caller. Choosing a hidden section leaves no visible tab selected, so More takes the brand underline and marks the section inside its menu.

Two side effects of getting the measurement exact: a tab is now as wide as its label, since MUI's hidden 90px floor made the gap after a short label wider than the gap after a long one, and MUI's extra letter-spacing is dropped so labels match the type scale. `MenuActionItem` gains `selected`, which turns a menu of actions into a radio group so the current choice is announced and not only tinted.
