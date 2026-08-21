---
"@akiga/design-system-app": patch
---

Applications list no longer crashes when an onboarded app in localStorage is missing name or description. AppIcon, Avatar, and the onboarded store now treat those fields as optional and fall back instead of calling trim on undefined.
