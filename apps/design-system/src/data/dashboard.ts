/**
 * Dashboard service — the read model the Dashboard screen consumes.
 * Derives view data from the seed. This is the seam a real API/repository
 * would sit behind; the screen depends on these functions, not on the raw data.
 */
import {
  orgStats,
  identities,
  certificationCampaigns,
  certificationStatus,
  sodPolicyStatus,
  highRiskSodPolicies,
  myWork,
  type SeedIdentity,
  type SeedSodPolicy,
  type SeedCertCampaign,
  type Tone,
} from './seed';

export interface DonutDatum {
  label: string;
  value: number;
  tone: Tone;
}

export interface DashboardData {
  kpis: { key: string; label: string; value: string; tone: Tone }[];
  certification: { total: number; segments: DonutDatum[] };
  deadlines: SeedCertCampaign[];
  sod: { total: number; segments: DonutDatum[]; highRisk: SeedSodPolicy[] };
  highRiskUsers: SeedIdentity[];
}

export function getDashboardData(): DashboardData {
  const certSegments: DonutDatum[] = [
    { label: 'Completed', value: certificationStatus.completed, tone: 'success' },
    { label: 'In Progress', value: certificationStatus.inProgress, tone: 'info' },
    { label: 'Ready to launch', value: certificationStatus.readyToLaunch, tone: 'brand' },
    { label: 'Others', value: certificationStatus.others, tone: 'neutral' },
  ];
  const sodSegments: DonutDatum[] = [
    { label: 'Active', value: sodPolicyStatus.active, tone: 'success' },
    { label: 'Draft', value: sodPolicyStatus.draft, tone: 'warning' },
    { label: 'Violations', value: sodPolicyStatus.violations, tone: 'danger' },
  ];
  const sum = (xs: DonutDatum[]) => xs.reduce((n, x) => n + x.value, 0);

  return {
    kpis: [
      { key: 'applications', label: 'Applications', value: String(orgStats.applications), tone: 'brand' },
      { key: 'identities', label: 'User Identities', value: String(orgStats.identities), tone: 'info' },
      { key: 'entitlements', label: 'Entitlements', value: String(orgStats.entitlements), tone: 'success' },
      { key: 'orphans', label: 'Orphan Accounts', value: String(orgStats.orphanAccounts), tone: 'warning' },
    ],
    certification: { total: sum(certSegments), segments: certSegments },
    deadlines: certificationCampaigns,
    sod: { total: sum(sodSegments), segments: sodSegments, highRisk: highRiskSodPolicies },
    highRiskUsers: identities.filter((i) => i.riskLevel === 'critical').slice(0, 3),
  };
}

/** Pending-work counts used by dashboard + nav badges. */
export function getMyWorkCounts() {
  return myWork;
}
