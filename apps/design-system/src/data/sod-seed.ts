/**
 * SoD Resolution seed — deterministic (no Date.now/Math.random at module scope).
 * Each user violates ONE SoD policy; conflicts are conflicting access combinations
 * (mostly pairs; the first rule is a 3-way AND) they hold under that policy.
 * Primes the localStorage store.
 */
import type { SodAccess, SodPolicy, SodReview, SodRule, ReviewStatus, Person, AcceptedRisk, AuditEntry } from './sod-types';

export const sodAccess: SodAccess[] = [
  { id: 'gw-read', name: 'Read Access', appId: 'app-gw', appName: 'Google Workspace', type: 'entitlement', detail: 'Directory · read', description: 'View directory records and user profiles.', risk: 20 },
  { id: 'gw-write', name: 'Write Access', appId: 'app-gw', appName: 'Google Workspace', type: 'entitlement', detail: 'Directory · write', description: 'Create and modify directory records.', risk: 55 },
  { id: 'gw-delete', name: 'Delete Access', appId: 'app-gw', appName: 'Google Workspace', type: 'entitlement', detail: 'Directory · delete', description: 'Delete directory records permanently.', risk: 72 },
  { id: 'gw-admin', name: 'Super Admin', appId: 'app-gw', appName: 'Google Workspace', type: 'technicalRole', detail: 'Workspace admin', description: 'Full administration of the Google Workspace tenant.', risk: 90 },
  { id: 'sap-journal', name: 'Journal Post', appId: 'app-sap', appName: 'SAP S/4HANA Finance', type: 'entitlement', detail: 'GL · GL.Journal_Post', description: 'Post journal entries to the general ledger.', risk: 68 },
  { id: 'sap-pay', name: 'Payment Release', appId: 'app-sap', appName: 'SAP S/4HANA Finance', type: 'entitlement', detail: 'AP · AP.Pay_Release', description: 'Release outgoing vendor payments.', risk: 85 },
  { id: 'sap-approve', name: 'Finance Approver', appId: 'app-sap', appName: 'SAP S/4HANA Finance', type: 'businessRole', detail: 'AP · Approver', description: 'Approve accounts-payable transactions.', risk: 78 },
  { id: 'sap-vendor', name: 'Vendor Maintain', appId: 'app-sap', appName: 'SAP S/4HANA Finance', type: 'entitlement', detail: 'AP · Vendor.Edit', description: 'Create and edit vendor master data.', risk: 60 },
  { id: 'sap-invoice', name: 'Invoice Approve', appId: 'app-sap', appName: 'SAP S/4HANA Finance', type: 'entitlement', detail: 'AP · AP.Invoice_Approve', description: 'Approve supplier invoices for payment.', risk: 66 },
  { id: 'fd-read', name: 'Read Access', appId: 'app-fd', appName: 'Freshdesk', type: 'entitlement', detail: 'Tickets · read', description: 'View support tickets and conversations.', risk: 12 },
  { id: 'fd-agent', name: 'Agent', appId: 'app-fd', appName: 'Freshdesk', type: 'businessRole', detail: 'Support agent', description: 'Handle and resolve customer support tickets.', risk: 25 },
  { id: 'sf-export', name: 'Data Export', appId: 'app-sf', appName: 'Salesforce', type: 'entitlement', detail: 'Reports · export', description: 'Export report and record data in bulk.', risk: 58 },
  { id: 'sf-admin', name: 'System Administrator', appId: 'app-sf', appName: 'Salesforce', type: 'technicalRole', detail: 'Org admin', description: 'Full administration of the Salesforce org.', risk: 88 },
  { id: 'aws-policy', name: 'Policy Write', appId: 'app-aws', appName: 'AWS', type: 'entitlement', detail: 'IAM · Policy.Write', description: 'Create and modify IAM policies.', risk: 80 },
  { id: 'aws-admin', name: 'AdministratorAccess', appId: 'app-aws', appName: 'AWS', type: 'technicalRole', detail: 'Account admin', description: 'Full administrative access to the AWS account.', risk: 95 },
];
export const accessById: Record<string, SodAccess> = Object.fromEntries(sodAccess.map((a) => [a.id, a]));

/** Applications referenced by SoD access — name + description for canonical display. */
export const sodApps: { id: string; name: string; description: string }[] = [
  { id: 'app-gw', name: 'Google Workspace', description: 'Email, docs, and directory for the workforce.' },
  { id: 'app-sap', name: 'SAP S/4HANA Finance', description: 'Core finance, accounting, and procurement system.' },
  { id: 'app-fd', name: 'Freshdesk', description: 'Customer support ticketing and helpdesk.' },
  { id: 'app-sf', name: 'Salesforce', description: 'CRM for sales, service, and marketing teams.' },
  { id: 'app-aws', name: 'AWS', description: 'Cloud infrastructure and services.' },
];
export const sodAppById: Record<string, { id: string; name: string; description: string }> = Object.fromEntries(sodApps.map((a) => [a.id, a]));

export const sodPolicies: SodPolicy[] = [
  { id: 'pol-fin', name: 'Finance SoD Policy', severity: 'critical', description: 'Prevents one person from both initiating and approving financial transactions.', status: 'active', createdOn: '2026-01-14T09:20:00.000Z', updatedOn: '2026-07-02T11:05:00.000Z' },
  { id: 'pol-acc', name: 'Access Governance Policy', severity: 'high', description: 'Restricts conflicting read/write/delete on the same directory.', status: 'active', createdOn: '2026-02-03T14:45:00.000Z', updatedOn: '2026-06-18T08:30:00.000Z' },
  { id: 'pol-priv', name: 'Privileged Access Policy', severity: 'high', description: 'Limits combinations that grant unchecked administrative power.', status: 'inactive', createdOn: '2026-03-11T10:10:00.000Z', updatedOn: '2026-08-04T16:40:00.000Z' },
  { id: 'pol-data', name: 'Data Handling Policy', severity: 'medium', description: 'Separates data read from bulk export and deletion.', status: 'draft', createdOn: '2026-08-09T13:15:00.000Z', updatedOn: '2026-08-09T13:15:00.000Z' },
];
export const policyById: Record<string, SodPolicy> = Object.fromEntries(sodPolicies.map((p) => [p.id, p]));

/** Access that conflict with one another under each policy (pairs + one 3-way on rule 0). */
const POLICY_CONFLICTS: Record<string, string[]> = {
  'pol-fin': ['sap-journal', 'sap-pay', 'sap-approve', 'sap-vendor', 'sap-invoice'],
  'pol-acc': ['gw-read', 'gw-write', 'gw-delete', 'gw-admin'],
  'pol-priv': ['gw-admin', 'aws-admin', 'aws-policy', 'sf-admin'],
  'pol-data': ['fd-read', 'sf-export', 'gw-read', 'sf-admin'],
};
const POLICY_CODE: Record<string, string> = { 'pol-fin': 'FIN', 'pol-acc': 'ACC', 'pol-priv': 'PRIV', 'pol-data': 'DATA' };
const POLICY_ORDER = ['pol-fin', 'pol-acc', 'pol-priv', 'pol-data'];

function pairs(ids: string[]): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) out.push([ids[i], ids[j]]);
  return out;
}

export const CURRENT_REVIEWER: Person = { id: 'rev-amelia', name: 'Amelia Ford', title: 'Access Reviewer', email: 'amelia.ford@acme.com' };
export const sodReviewers: Person[] = [
  CURRENT_REVIEWER,
  { id: 'rev-marcus', name: 'Marcus Lee', title: 'Access Reviewer', email: 'marcus.lee@acme.com' },
  { id: 'rev-priya', name: 'Priya Sharma', title: 'Senior Reviewer', email: 'priya.sharma@acme.com' },
  { id: 'rev-daniel', name: 'Daniel White', title: 'Access Reviewer', email: 'daniel.white@acme.com' },
];
export const riskApprovers: Person[] = [
  { id: 'apr-rachel', name: 'Rachel Kim', title: 'VP, Internal Audit' },
  { id: 'apr-tom', name: 'Tom Nguyen', title: 'Director, GRC' },
  { id: 'apr-sofia', name: 'Sofia Rossi', title: 'CISO' },
];
const personById: Record<string, Person> = Object.fromEntries([...sodReviewers, ...riskApprovers].map((p) => [p.id, p]));

/** Fresh V3 Active queue for Amelia — all Not Started (no drafts / submissions). */
const V3_FRESH_USERS = ['Alice Brown', 'John Doe', 'Carlos Diaz', 'Emma Clark', 'Noah Patel'];
/** Submitted V3 resolutions where Amelia accepted residual risk. */
const V3_ACCEPTED_RISK_USERS = ['Olivia Bennett', 'Liam Foster'];
/** Remaining users for admin / other-reviewer demos (never assigned to Amelia). */
const OTHER_USERS = [
  'Jane Smith',
  'Bob Wilson',
  'Frank Moore',
  'Grace Hall',
  'Henry Adams',
  'Ivy Chen',
  'Jack Taylor',
];
const STATUS_CYCLE: ReviewStatus[] = [
  'assigned',
  'inProgress',
  'completed',
  'overdue',
  'unassigned',
  'assigned',
  'completed',
];
const REVIEWER_CYCLE = [
  'rev-marcus',
  'rev-priya',
  'rev-daniel',
  'rev-marcus',
  '',
  'rev-priya',
  'rev-daniel',
];
const sevFromRisk = (r: number): SodReview['severity'] => (r >= 90 ? 'critical' : r >= 78 ? 'high' : r >= 65 ? 'medium' : 'low');
const email = (name: string) => `${name.toLowerCase().replace(/ /g, '.')}@acme.com`;
const p2 = (n: number) => String(n).padStart(2, '0');

/** Deterministic profile attributes for the user-details drawer. */
const DESIGNATIONS = ['VP of Engineering', 'Finance Analyst', 'Support Lead', 'Data Scientist', 'Product Manager', 'Sales Representative', 'HR Manager', 'Security Analyst', 'Cloud Architect', 'IT Administrator', 'Compliance Officer'];
const DEPARTMENTS = ['Engineering', 'Finance', 'Customer Support', 'Data', 'Product', 'Sales', 'People', 'Security', 'IT', 'Operations', 'Compliance'];
const MANAGERS = ['Nadia Rahman', 'Marcus Lee', 'Priya Sharma', 'Daniel White'];

/** Dummy resolution audit trail — full journey for demos (card + event-logs drawer). */
function seedAuditTrail(args: {
  ruleCount: number;
  policyName: string;
  reviewer?: Person;
  status: ReviewStatus;
  draftRemovedDetail?: string;
  draftAcceptedDetail?: string;
  removedDetail?: string;
  acceptedDetail?: string;
  submissionRef?: string;
}): AuditEntry[] {
  const entries: AuditEntry[] = [
    {
      at: '2026-07-12T08:00:00.000Z',
      actor: 'System',
      action: 'Violation detected',
      detail: `${args.ruleCount} violation${args.ruleCount === 1 ? '' : 's'} under ${args.policyName}`,
    },
  ];
  if (!args.reviewer) return entries;

  const emailTo = args.reviewer.email ?? args.reviewer.name;
  entries.push(
    {
      at: '2026-07-14T09:00:00.000Z',
      actor: 'Nadia Rahman (Admin)',
      action: 'Reviewer assigned',
      detail: `Assigned to ${args.reviewer.name}`,
    },
    {
      at: '2026-07-14T09:02:00.000Z',
      actor: 'System',
      action: 'Notification sent',
      detail: `Assignment email delivered to ${emailTo}`,
    },
  );

  if (args.status === 'completed') {
    entries.push(
      {
        at: '2026-07-15T10:00:00.000Z',
        actor: args.reviewer.name,
        action: 'Resolution started',
        detail: 'Opened resolution workspace',
      },
      {
        at: '2026-07-15T14:40:00.000Z',
        actor: args.reviewer.name,
        action: 'Access removed',
        detail: args.removedDetail ?? 'Conflicting entitlements removed',
      },
      {
        at: '2026-07-15T15:00:00.000Z',
        actor: args.reviewer.name,
        action: 'Risk accepted',
        detail: args.acceptedDetail ?? 'Residual risk accepted',
      },
      {
        at: '2026-07-15T15:12:00.000Z',
        actor: args.reviewer.name,
        action: 'Review submitted',
        detail: `Reference ${args.submissionRef ?? 'SOD-2026-0000'}`,
      },
      {
        at: '2026-07-15T15:13:00.000Z',
        actor: 'System',
        action: 'Notification sent',
        detail: 'Submission confirmation emailed to stakeholders',
      },
    );
    return entries;
  }

  if (args.status === 'assigned' || args.status === 'inProgress' || args.status === 'overdue') {
    entries.push(
      {
        at: '2026-07-16T11:20:00.000Z',
        actor: args.reviewer.name,
        action: 'Resolution started',
        detail: 'Opened resolution workspace',
      },
      {
        at: '2026-07-16T13:30:00.000Z',
        actor: args.reviewer.name,
        action: 'Draft saved — access removed',
        detail: args.draftRemovedDetail ?? 'Staged entitlement removal',
      },
      {
        at: '2026-07-17T10:15:00.000Z',
        actor: args.reviewer.name,
        action: 'Draft saved — risk accepted',
        detail: args.draftAcceptedDetail ?? 'Staged residual risk acceptance',
      },
    );
  }

  return entries;
}

function buildReview(name: string, i: number): SodReview {
  const userId = `usr-${name.toLowerCase().replace(/ /g, '-')}`;
  const policyId = POLICY_ORDER[i % POLICY_ORDER.length];
  const conflictIds = POLICY_CONFLICTS[policyId];
  const allPairs = pairs(conflictIds);
  const desired = 6 + ((i * 3) % 5); // 6–10
  const usePairs = allPairs.slice(0, Math.min(desired, allPairs.length));
  const rules: SodRule[] = usePairs.map(([a, b], k) => ({
    id: `${userId}-r${k}`,
    code: `SOD-${POLICY_CODE[policyId]}-${p2(k + 1)}`,
    label: `${accessById[a].name} + ${accessById[b].name}`,
    policyId,
    accessIds: [a, b],
  }));
  // First conflict is a 3-way AND so demos exercise multi-entitlement rules.
  if (rules.length > 0) {
    const third = conflictIds.find((id) => !rules[0].accessIds.includes(id));
    if (third) {
      rules[0].accessIds = [...rules[0].accessIds, third];
      rules[0].label = rules[0].accessIds.map((id) => accessById[id].name).join(' + ');
    }
  }
  const accessHeldIds = Array.from(new Set(rules.flatMap((r) => r.accessIds)));

  const riskScore = 62 + ((i * 9) % 38);
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
  const reviewerId = status === 'unassigned' ? '' : REVIEWER_CYCLE[i % REVIEWER_CYCLE.length] || 'rev-marcus';
  const reviewer = reviewerId ? personById[reviewerId] : undefined;
  const overdue = status === 'overdue';
  // Non-overdue reviews due Jul 30 so the reviewer countdown shows remaining days.
  const dueDate = reviewer ? `2026-07-${p2(overdue ? 16 : 30)}T${p2(9 + (i % 11))}:${p2((i * 13) % 60)}:00.000Z` : undefined;

  const base: SodReview = {
    id: `sod-${userId}`,
    userId,
    userName: name,
    userEmail: email(name),
    riskScore,
    severity: sevFromRisk(riskScore),
    employeeId: `34${p2((i * 13) % 100)}${p2((i * 29) % 100)}${p2((i * 7) % 100)}`,
    userTitle: DESIGNATIONS[i % DESIGNATIONS.length],
    userDepartment: DEPARTMENTS[i % DEPARTMENTS.length],
    managerName: MANAGERS[i % MANAGERS.length],
    policyIds: [policyId],
    policyNames: [policyById[policyId].name],
    accessHeldIds,
    rules,
    status,
    assignedReviewerId: reviewer?.id,
    assignedReviewerName: reviewer?.name,
    assignedAt: reviewer ? '2026-07-14T09:00:00.000Z' : undefined,
    dueDate,
    createdAt: '2026-07-12T08:00:00.000Z',
    updatedAt: '2026-07-16T13:30:00.000Z',
    removedAccessIds: [],
    acceptedRules: {},
    overallJustification: '',
    audit: [],
  };

  const draftRemoved = accessById[rules[0].accessIds[0]].name;
  const draftAccepted = `${rules[rules.length - 1].label} — 90 days (staged)`;

  if (status === 'inProgress') {
    base.removedAccessIds = [rules[0].accessIds[0]];
  }

  if (status === 'completed') {
    const accepted = rules[rules.length - 1];
    // Clear each resolved combination by removing all but one access (AND semantics).
    const removed = Array.from(
      new Set(
        rules.slice(0, -1).flatMap((r) => r.accessIds.slice(0, Math.max(1, r.accessIds.length - 1))),
      ),
    );
    const acceptance: AcceptedRisk = { justification: 'Compensating control in place; access required for month-end close.', duration: 90, approverId: 'apr-rachel', approverName: 'Rachel Kim', at: '2026-07-15T15:00:00.000Z' };
    const reference = `SOD-2026-${(1000 + i).toString()}`;
    base.removedAccessIds = removed;
    base.acceptedRules = { [accepted.id]: acceptance };
    base.overallJustification = 'Removed conflicting entitlements to restore separation of duties; one combination accepted with VP sign-off and a 90-day compensating control.';
    base.submission = { reference, at: '2026-07-15T15:12:00.000Z' };
    base.audit = seedAuditTrail({
      ruleCount: rules.length,
      policyName: policyById[policyId].name,
      reviewer,
      status,
      removedDetail: `${removed.length} entitlements/roles removed`,
      acceptedDetail: `${accepted.label} — 90 days (Rachel Kim)`,
      submissionRef: reference,
    });
    return base;
  }

  base.audit = seedAuditTrail({
    ruleCount: rules.length,
    policyName: policyById[policyId].name,
    reviewer,
    status,
    draftRemovedDetail: draftRemoved,
    draftAcceptedDetail: draftAccepted,
  });

  return base;
}

/**
 * Fresh Not Started review for the V3 Active queue — assigned to Amelia, no
 * draft work, no submission. Exactly three access combinations for the workspace.
 */
function buildNotStartedReview(name: string, i: number): SodReview {
  const userId = `usr-${name.toLowerCase().replace(/ /g, '-')}`;
  const policyId = POLICY_ORDER[i % POLICY_ORDER.length];
  const conflictIds = POLICY_CONFLICTS[policyId];
  const usePairs = pairs(conflictIds).slice(0, 3);
  const rules: SodRule[] = usePairs.map(([a, b], k) => ({
    id: `${userId}-r${k}`,
    code: `SOD-${POLICY_CODE[policyId]}-${p2(k + 1)}`,
    label: `${accessById[a].name} + ${accessById[b].name}`,
    policyId,
    accessIds: [a, b],
  }));
  if (rules.length > 0) {
    const third = conflictIds.find((id) => !rules[0].accessIds.includes(id));
    if (third) {
      rules[0].accessIds = [...rules[0].accessIds, third];
      rules[0].label = rules[0].accessIds.map((id) => accessById[id].name).join(' + ');
    }
  }
  const accessHeldIds = Array.from(new Set(rules.flatMap((r) => r.accessIds)));
  const riskScore = 68 + ((i * 7) % 28);
  const policyName = policyById[policyId].name;

  return {
    id: `sod-${userId}`,
    userId,
    userName: name,
    userEmail: email(name),
    riskScore,
    severity: sevFromRisk(riskScore),
    employeeId: `35${p2((i * 11) % 100)}${p2((i * 23) % 100)}${p2((i * 5) % 100)}`,
    userTitle: DESIGNATIONS[i % DESIGNATIONS.length],
    userDepartment: DEPARTMENTS[i % DEPARTMENTS.length],
    managerName: MANAGERS[i % MANAGERS.length],
    policyIds: [policyId],
    policyNames: [policyName],
    accessHeldIds,
    rules,
    status: 'assigned',
    assignedReviewerId: CURRENT_REVIEWER.id,
    assignedReviewerName: CURRENT_REVIEWER.name,
    assignedAt: '2026-07-28T09:00:00.000Z',
    dueDate: `2026-08-${p2(10 + i)}T11:00:00.000Z`,
    createdAt: '2026-07-26T08:00:00.000Z',
    updatedAt: '2026-07-28T09:00:00.000Z',
    removedAccessIds: [],
    acceptedRules: {},
    overallJustification: '',
    audit: [
      {
        at: '2026-07-26T08:00:00.000Z',
        actor: 'System',
        action: 'Violation detected',
        detail: `${rules.length} violation${rules.length === 1 ? '' : 's'} under ${policyName}`,
      },
      {
        at: '2026-07-28T09:00:00.000Z',
        actor: 'Nadia Rahman (Admin)',
        action: 'Reviewer assigned',
        detail: `Assigned to ${CURRENT_REVIEWER.name}`,
      },
      {
        at: '2026-07-28T09:02:00.000Z',
        actor: 'System',
        action: 'Notification sent',
        detail: `Assignment email delivered to ${CURRENT_REVIEWER.email}`,
      },
    ],
  };
}

/**
 * Removals that clear prior rules without breaking the accepted AND combination.
 * Skips access IDs the accepted rule still needs so history can list them.
 */
function seedRemovalsBeforeAcceptance(priorRules: SodRule[], accepted: SodRule): string[] {
  const keep = new Set(accepted.accessIds);
  const removed = new Set<string>();
  for (const rule of priorRules) {
    const removable = rule.accessIds.filter((id) => !keep.has(id));
    const need = Math.max(1, rule.accessIds.length - 1);
    if (removable.length >= need) {
      removable.slice(0, need).forEach((id) => removed.add(id));
      continue;
    }
    removable.forEach((id) => removed.add(id));
    const shared = rule.accessIds.filter((id) => keep.has(id));
    shared.slice(0, need - removable.length).forEach((id) => removed.add(id));
  }
  return [...removed];
}

/** Submitted review for Amelia — resolved with at least one accepted-risk combination. */
function buildSubmittedAcceptedRiskReview(name: string, i: number): SodReview {
  const userId = `usr-${name.toLowerCase().replace(/ /g, '-')}`;
  const policyId = POLICY_ORDER[(i + 2) % POLICY_ORDER.length];
  const conflictIds = POLICY_CONFLICTS[policyId];
  const usePairs = pairs(conflictIds).slice(0, 3);
  const rules: SodRule[] = usePairs.map(([a, b], k) => ({
    id: `${userId}-r${k}`,
    code: `SOD-${POLICY_CODE[policyId]}-${p2(k + 1)}`,
    label: `${accessById[a].name} + ${accessById[b].name}`,
    policyId,
    accessIds: [a, b],
  }));
  if (rules.length > 0) {
    const third = conflictIds.find((id) => !rules[0].accessIds.includes(id));
    if (third) {
      rules[0].accessIds = [...rules[0].accessIds, third];
      rules[0].label = rules[0].accessIds.map((id) => accessById[id].name).join(' + ');
    }
  }
  const accessHeldIds = Array.from(new Set(rules.flatMap((r) => r.accessIds)));
  const riskScore = 74 + ((i * 11) % 22);
  const policyName = policyById[policyId].name;
  const accepted = rules[rules.length - 1];
  const removed = seedRemovalsBeforeAcceptance(rules.slice(0, -1), accepted);
  const acceptance: AcceptedRisk = {
    justification:
      i === 0
        ? 'Business-critical access through month-end; compensating control documented with Internal Audit.'
        : 'Temporary exception approved by GRC; access limited to read-only reporting scope.',
    duration: i === 0 ? 90 : 30,
    approverId: i === 0 ? 'apr-rachel' : 'apr-tom',
    approverName: i === 0 ? 'Rachel Kim' : 'Tom Nguyen',
    at: `2026-07-${p2(20 + i)}T14:00:00.000Z`,
  };
  const reference = `SOD-2026-${(2100 + i).toString()}`;

  return {
    id: `sod-${userId}`,
    userId,
    userName: name,
    userEmail: email(name),
    riskScore,
    severity: sevFromRisk(riskScore),
    employeeId: `36${p2((i * 17) % 100)}${p2((i * 19) % 100)}${p2((i * 3) % 100)}`,
    userTitle: DESIGNATIONS[(i + 3) % DESIGNATIONS.length],
    userDepartment: DEPARTMENTS[(i + 2) % DEPARTMENTS.length],
    managerName: MANAGERS[(i + 1) % MANAGERS.length],
    policyIds: [policyId],
    policyNames: [policyName],
    accessHeldIds,
    rules,
    status: 'completed',
    assignedReviewerId: CURRENT_REVIEWER.id,
    assignedReviewerName: CURRENT_REVIEWER.name,
    assignedAt: '2026-07-18T09:00:00.000Z',
    dueDate: '2026-07-28T11:00:00.000Z',
    createdAt: '2026-07-16T08:00:00.000Z',
    updatedAt: '2026-07-22T15:30:00.000Z',
    removedAccessIds: removed,
    acceptedRules: { [accepted.id]: acceptance },
    removeJustification:
      'Removed privileged access that could be revoked without blocking month-end reporting workflows.',
    overallJustification:
      'Removed conflicting access where possible; accepted residual risk for one combination with documented approver sign-off.',
    submission: { reference, at: `2026-07-${p2(22 + i)}T15:12:00.000Z` },
    audit: seedAuditTrail({
      ruleCount: rules.length,
      policyName,
      reviewer: CURRENT_REVIEWER,
      status: 'completed',
      removedDetail: `${removed.length} entitlements/roles removed`,
      acceptedDetail: `${accepted.label} — ${acceptance.duration === 'permanent' ? 'Permanent' : `${acceptance.duration} days`} (${acceptance.approverName})`,
      submissionRef: reference,
    }),
  };
}

export const sodReviewSeed: SodReview[] = [
  ...V3_FRESH_USERS.map(buildNotStartedReview),
  ...V3_ACCEPTED_RISK_USERS.map(buildSubmittedAcceptedRiskReview),
  ...OTHER_USERS.map((name, i) => buildReview(name, i)),
];
