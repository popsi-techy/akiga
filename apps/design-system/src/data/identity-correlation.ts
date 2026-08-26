/**
 * User identity correlation — rules that match discovered application accounts
 * to identities. One configuration per application.
 *
 * Hybrid persistence: the seed primes an empty store on first visit, then
 * localStorage is the source of truth. Screens call these functions; they never
 * touch storage themselves.
 */

const STORE_KEY = 'iga.identityCorrelation.v1';
const SEED_VERSION = 1;

export type CorrelationMatchingMode = 'multi' | 'chained';

export type CorrelationStrategyKind =
  | 'email'
  | 'email-local-part'
  | 'employee-id'
  | 'display-name';

export const CORRELATION_STRATEGY_OPTIONS: {
  value: CorrelationStrategyKind;
  label: string;
  description: string;
}[] = [
  {
    value: 'email',
    label: 'Email',
    description: 'Match account email to identity email.',
  },
  {
    value: 'email-local-part',
    label: 'Email local part',
    description: 'Match the part before @ when domains differ.',
  },
  {
    value: 'employee-id',
    label: 'Employee ID',
    description: 'Match the HR employee number on both records.',
  },
  {
    value: 'display-name',
    label: 'Display name',
    description: 'Match full name — a weaker fallback.',
  },
];

export const CORRELATION_MODE_OPTIONS: {
  value: CorrelationMatchingMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'multi',
    label: 'Multi',
    description: 'Runs every enabled matcher and keeps matches at or above the confidence threshold.',
  },
  {
    value: 'chained',
    label: 'Chained',
    description: 'Tries matchers in priority order and stops at the first match at or above the threshold.',
  },
];

export function correlationStrategyLabel(kind: CorrelationStrategyKind): string {
  return CORRELATION_STRATEGY_OPTIONS.find((o) => o.value === kind)?.label ?? kind;
}

export function correlationModeLabel(mode: CorrelationMatchingMode): string {
  return CORRELATION_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

export interface CorrelationStrategy {
  id: string;
  kind: CorrelationStrategyKind;
  /** Lower runs first when matching is chained. */
  priority: number;
  enabled: boolean;
}

export interface CorrelationConfig {
  id: string;
  applicationId: string;
  matchingMode: CorrelationMatchingMode;
  /** 1–100. Matches below this score are ignored. */
  confidenceThreshold: number;
  strategies: CorrelationStrategy[];
  autoLink: boolean;
  manualOverride: boolean;
  /** Create an identity when no matcher succeeds. */
  autoCreate: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CorrelationConfigDraft = Omit<CorrelationConfig, 'id' | 'createdAt' | 'updatedAt'>;

interface Store {
  version: number;
  configs: Record<string, CorrelationConfig>;
}

const hasWindow = () => typeof window !== 'undefined';

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function seedStore(): Store {
  const stamp = '2026-08-18T10:00:00.000Z';
  const list: CorrelationConfig[] = [
    {
      id: 'corr-okta',
      applicationId: 'app-okta',
      matchingMode: 'multi',
      confidenceThreshold: 80,
      strategies: [
        { id: 's-okta-email', kind: 'email', priority: 1, enabled: true },
        { id: 's-okta-name', kind: 'display-name', priority: 2, enabled: true },
      ],
      autoLink: true,
      manualOverride: true,
      autoCreate: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'corr-github',
      applicationId: 'app-github',
      matchingMode: 'chained',
      confidenceThreshold: 70,
      strategies: [
        { id: 's-gh-local', kind: 'email-local-part', priority: 1, enabled: true },
        { id: 's-gh-name', kind: 'display-name', priority: 2, enabled: true },
      ],
      autoLink: true,
      manualOverride: true,
      autoCreate: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'corr-salesforce',
      applicationId: 'app-salesforce',
      matchingMode: 'multi',
      confidenceThreshold: 85,
      strategies: [
        { id: 's-sf-email', kind: 'email', priority: 1, enabled: true },
        { id: 's-sf-eid', kind: 'employee-id', priority: 2, enabled: true },
      ],
      autoLink: true,
      manualOverride: false,
      autoCreate: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'corr-aws',
      applicationId: 'app-aws',
      matchingMode: 'chained',
      confidenceThreshold: 75,
      strategies: [
        { id: 's-aws-eid', kind: 'employee-id', priority: 1, enabled: true },
        { id: 's-aws-email', kind: 'email', priority: 2, enabled: true },
      ],
      autoLink: false,
      manualOverride: true,
      autoCreate: false,
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'corr-workday',
      applicationId: 'app-workday',
      matchingMode: 'multi',
      confidenceThreshold: 90,
      strategies: [{ id: 's-wd-eid', kind: 'employee-id', priority: 1, enabled: true }],
      autoLink: true,
      manualOverride: true,
      autoCreate: true,
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
  const configs: Record<string, CorrelationConfig> = {};
  for (const c of list) configs[c.id] = c;
  return { version: SEED_VERSION, configs };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.configs || parsed.version !== SEED_VERSION) {
      const s = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
      return s;
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(s: Store): void {
  if (hasWindow()) window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

/** Newest activity first. */
export function listCorrelationConfigs(): CorrelationConfig[] {
  return Object.values(readStore().configs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCorrelationConfig(id: string): CorrelationConfig | null {
  return readStore().configs[id] ?? null;
}

export function applicationHasCorrelation(applicationId: string, exceptId?: string): boolean {
  return listCorrelationConfigs().some((c) => c.applicationId === applicationId && c.id !== exceptId);
}

export function emptyCorrelationDraft(): CorrelationConfigDraft {
  return {
    applicationId: '',
    matchingMode: 'multi',
    confidenceThreshold: 80,
    strategies: [{ id: newId('s'), kind: 'email', priority: 1, enabled: true }],
    autoLink: true,
    manualOverride: true,
    autoCreate: false,
  };
}

export function addCorrelationStrategy(strategies: CorrelationStrategy[]): CorrelationStrategy[] {
  const used = new Set(strategies.map((s) => s.kind));
  const nextKind = CORRELATION_STRATEGY_OPTIONS.find((o) => !used.has(o.value))?.value;
  if (!nextKind) return strategies;
  const priority = strategies.reduce((m, s) => Math.max(m, s.priority), 0) + 1;
  return [...strategies, { id: newId('s'), kind: nextKind, priority, enabled: true }];
}

export function createCorrelationConfig(draft: CorrelationConfigDraft): CorrelationConfig {
  const s = readStore();
  const id = newId('corr');
  const stamp = nowIso();
  const config: CorrelationConfig = { ...draft, id, createdAt: stamp, updatedAt: stamp };
  s.configs[id] = config;
  writeStore(s);
  return config;
}

export function updateCorrelationConfig(id: string, draft: CorrelationConfigDraft): CorrelationConfig | null {
  const s = readStore();
  const existing = s.configs[id];
  if (!existing) return null;
  const config: CorrelationConfig = { ...existing, ...draft, id, updatedAt: nowIso() };
  s.configs[id] = config;
  writeStore(s);
  return config;
}

export function deleteCorrelationConfig(id: string): void {
  const s = readStore();
  delete s.configs[id];
  writeStore(s);
}
