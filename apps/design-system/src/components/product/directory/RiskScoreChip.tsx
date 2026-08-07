'use client';

import * as React from 'react';
import { StatusChip } from '@ds/components';
import { riskTier, RISK_TIER_LABEL, type RiskTier } from '@/lib/risk';

/**
 * 4-level risk tier → StatusChip intents, one distinct hue per level so severity
 * reads as a ramp: blue → yellow → orange → red.
 *
 * Low is `info` (blue) rather than `neutral` (grey): grey reads as "no data", but a
 * low score is a real measurement. High is `caution`, the orange step added for
 * exactly this — before it, High and Medium both landed on yellow.
 */
const RISK_INTENT: Record<RiskTier, 'danger' | 'caution' | 'warning' | 'info'> = {
  critical: 'danger', // red
  high: 'caution', // orange
  medium: 'warning', // yellow
  low: 'info', // blue
};

/**
 * Canonical Risk Score badge — the ONE way a 0–100 score is shown. The score maps
 * to its 4-level tier (`riskTier()`) and renders through the shared `StatusChip`
 * (no dot, "Tier (score)"), so a risk score looks identical to a `SeverityChip`
 * wherever the two appear. Pass `showLabel={false}` for a score-only chip.
 */
export function RiskScoreChip({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const tier = riskTier(score);
  return (
    <StatusChip
      intent={RISK_INTENT[tier]}
      dot={false}
      label={showLabel ? `${RISK_TIER_LABEL[tier]} (${score})` : String(score)}
    />
  );
}

/**
 * The same tier ramp as a dot, for places where a chip would crowd out the name it
 * describes — a graph node, a dense legend. Uses the `fill` status role, which is the
 * one chosen to clear 3:1 as a graphical object (WCAG 1.4.11); the score stays
 * available to screen readers and on hover, since colour alone is never the message.
 */
export function RiskDot({ score }: { score: number }) {
  const tier = riskTier(score);
  const text = `Risk score ${score}, ${RISK_TIER_LABEL[tier]}`;
  return (
    <span title={text} className="inline-flex shrink-0 items-center">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: `var(--ds-color-status-${RISK_INTENT[tier]}-fill)` }}
      />
      <span className="sr-only">{text}</span>
    </span>
  );
}

export default RiskScoreChip;
