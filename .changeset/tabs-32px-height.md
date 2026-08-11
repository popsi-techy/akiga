---
"@akiga/design-system-app": minor
---

Tabs: a tab is now 32px tall (was 41.5px). MUI's default 12px block padding is zeroed and the height comes from `minHeight`, so the label is centred by the Tab's own flex and the band a page spends on section switching stays a thin strip. Also zeroes MUI's negative scroller margin, which clipped the 2px active underline on classic-scrollbar platforms.
