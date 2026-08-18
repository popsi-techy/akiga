'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { StatusChip } from '@ds/components';
import type { IdentityKind } from '@/data/seed';

/**
 * Internal or external — the one way this classification is shown.
 *
 * ## Why an icon and not a dot
 *
 * A dot is a state light: it says "this is currently true" and its colour carries
 * the meaning. Workforce and external are not states — nobody's classification
 * flickers — so a dot in front of one implies a liveness it does not have. The
 * icon says the category outright and, at chip size, is read before the word
 * beside it, which is what matters in a column where every row carries one.
 *
 * ## The colours
 *
 * Workforce is `info` — the calm, unremarkable default. External is `caution`: not
 * because a contractor is a fault, but because that population carries a sponsor
 * and an end date and is the one a reviewer is asked about first, so it is worth
 * finding in a column without reading. Neither is ever `danger`; the red on these
 * screens belongs to the expired-access row, which is a genuine fault and only
 * appears when something is actually wrong.
 *
 * The icon still does the identifying work — it is why this chip takes an icon
 * rather than a dot — and the tint is what makes the exception findable at a
 * glance in a list of twenty.
 *
 * ## Why these icons
 *
 * A person for the workforce and a badge for the external one: an employee is
 * simply a person in the directory, where an external is someone who had to be
 * *issued* something to be here — a pass, a contract, an end date. The badge is the
 * thing that makes them present, so it is the more honest mark for them, and the
 * two glyphs are separable at a glance in a column of twenty.
 *
 * They are also the sidebar's own marks for those two lists. A reader who clicked
 * "External Identities" in the nav meets the same badge in the table cell, so the
 * chip is recognised rather than read — an icon vocabulary that differs between the
 * nav and the content makes the reader learn one idea twice. Freeing `person` for
 * the child meant giving the Identities *group* a different mark, since a child
 * wearing its parent's icon reads as a duplicate rather than a category.
 */
const META: Record<IdentityKind, { label: string; intent: 'info' | 'caution'; icon: React.ReactNode }> = {
  internal: { label: 'Workforce', intent: 'info', icon: <PersonOutline /> },
  external: { label: 'External', intent: 'caution', icon: <BadgeOutlined /> },
};

export function IdentityKindChip({ kind }: { kind: IdentityKind }) {
  const m = META[kind];
  return <StatusChip intent={m.intent} label={m.label} icon={m.icon} />;
}

export default IdentityKindChip;
