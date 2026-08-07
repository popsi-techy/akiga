/**
 * Canonical Risk Score tiers — the single source of truth for turning a 0–100
 * score into a tier + label. `RiskScoreChip` maps the tier onto the shared `status`
 * color roles as a one-hue-per-level ramp — Critical→danger (red), High→caution
 * (orange), Medium→warning (yellow), Low→info (blue) — so there is no separate risk
 * palette.
 *
 * Critical 75–100 · High 50–74 · Medium 25–49 · Low 0–24
 */
export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export function riskTier(score: number): RiskTier {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export const RISK_TIER_LABEL: Record<RiskTier, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
