'use client';

import * as React from 'react';
import { StatusChip } from '@ds/components';
import { REPORT_STATE, type ReportState } from '@/data/reports';

/**
 * One state, one chip, everywhere in the hub.
 *
 * Every table in this module reports a state — a campaign run, a clause's evidence, a
 * subscription's last firing — and before this they each picked their own intent at the
 * call site. That is how "Partial" ends up amber in one table and grey in another, and how
 * a new state gets added to one screen and forgotten on the next. The mapping is a fact
 * about the domain, so it lives with the domain (`REPORT_STATE`) and this component is the
 * only thing that reads it.
 */
export function ReportStateChip({ state }: { state: ReportState }) {
  const s = REPORT_STATE[state];
  return <StatusChip intent={s.intent} label={s.label} />;
}
