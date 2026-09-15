import type { FileAttachment } from '@ds/components';
import type {
  ApprovalDecision,
  ApprovalHop,
  AuditEvent,
  GovernanceIdentity,
  GovernanceRequest,
  GovernanceRequestItem,
  LevelCompletionRule,
  LifecycleStage,
  LifecycleStageId,
  ResourceType,
} from './request-governance';

/**
 * Six requests: one still moving and one finished for each kind of resource an access
 * request can be about — application, entitlement, technical role.
 *
 * The catalogue used to hold fourteen, which was a lot of rows saying the same few things.
 * What a demo store has to cover is the **shapes** the screens draw, and there are only
 * six: three resource types × in-flight or closed. Every extra row after that is another
 * name to read past.
 *
 * Every request carries **two lines of its own type**, because the board's whole premise is
 * a cart whose lines move independently — a single-line request never exercises the rail,
 * the per-line canvas or the "1 pending" count. Within each cart one line is usually ahead
 * of the other, which is the case the request-level status has to summarise.
 *
 * Approval chains vary on purpose: some levels are one person, some are a group under one
 * of the policy builder's completion rules (`anyOne`, `all`, `majority`, `threshold`), and
 * one chain runs four levels deep. A level whose rule closed before everyone answered keeps
 * the people it passed over, because "any one of two" still owes the reader the second
 * name.
 */

/**
 * Evidence filed with an approval decision.
 *
 * A real one-page PDF rather than a placeholder string: the attachment field can preview
 * what it is given, and a decision whose "signed approval" opens to nothing is a worse
 * demo than no attachment at all.
 */
const PDF_DATA_URL =
  'data:application/pdf;base64,JVBERi0xLjEKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCAzMDAgMTQ0XT4+ZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxNzYKJSVFT0Y=';

const evidence = (id: string, name: string, size: number, addedAt: string): FileAttachment => ({
  id,
  name,
  size,
  mimeType: 'application/pdf',
  kind: 'pdf',
  dataUrl: PDF_DATA_URL,
  addedAt,
});

/** Machine steps take seconds. Spelling each one out invented a precision nobody chose. */
const after = (iso: string, seconds: number): string =>
  new Date(new Date(iso).getTime() + seconds * 1000).toISOString();

// ---- the cast ----------------------------------------------------------

const amelia: GovernanceIdentity = {
  id: 'u-amelia',
  name: 'Amelia Ford',
  email: 'amelia.ford@acme.com',
  title: 'Access Reviewer',
};
const mohammed: GovernanceIdentity = {
  id: 'u-mohammed',
  name: 'Mohammed Ali',
  email: 'mohammed.ali@acme.com',
  title: 'VP of Engineering',
};
const jessica: GovernanceIdentity = {
  id: 'u-jessica',
  name: 'Jessica Liu',
  email: 'jessica.liu@acme.com',
  title: 'UX Designer',
};
const ananya: GovernanceIdentity = {
  id: 'u-ananya',
  name: 'Ananya Patel',
  email: 'ananya.patel@acme.com',
  title: 'Data Scientist',
};
const priya: GovernanceIdentity = {
  id: 'u-priya',
  name: 'Priya Shah',
  email: 'priya.shah@acme.com',
  title: 'Access Reviewer',
};
const david: GovernanceIdentity = {
  id: 'u-david',
  name: 'David Chen',
  email: 'david.chen@acme.com',
  title: 'Application Owner',
};
const elena: GovernanceIdentity = {
  id: 'u-elena',
  name: 'Elena Vasquez',
  email: 'elena.vasquez@acme.com',
  title: 'Security Analyst',
};
const marcus: GovernanceIdentity = {
  id: 'u-marcus',
  name: 'Marcus Webb',
  email: 'marcus.webb@acme.com',
  title: 'IT Operations',
};
const noah: GovernanceIdentity = {
  id: 'u-noah',
  name: 'Noah Okonkwo',
  email: 'noah.okonkwo@acme.com',
  title: 'Finance Analyst',
};
const leila: GovernanceIdentity = {
  id: 'u-leila',
  name: 'Leila Hassan',
  email: 'leila.hassan@acme.com',
  title: 'HR Business Partner',
};

function audit(id: string, at: string, actor: string, action: string, detail: string): AuditEvent {
  return { id, at, actor, action, detail };
}

function stages(partial: Partial<Record<LifecycleStage['id'], LifecycleStage>>): LifecycleStage[] {
  const order: LifecycleStage['id'][] = ['submission', 'policy', 'approval', 'provisioning'];
  return order.map((id) => partial[id] ?? { id, state: 'pending' });
}

// ---- one person's answer ----------------------------------------------

const approvedBy = (
  approver: GovernanceIdentity,
  decidedAt: string,
  note?: string,
  attachments?: FileAttachment[],
): ApprovalDecision => ({ approver, state: 'done', decision: 'approved', decidedAt, note, attachments });

const waitingOn = (approver: GovernanceIdentity): ApprovalDecision => ({
  approver,
  state: 'current',
  decision: 'pending',
});

/** Asked, then the level closed under its rule before they got to it. */
const passedOver = (approver: GovernanceIdentity): ApprovalDecision => ({
  approver,
  state: 'skipped',
  decision: 'pending',
});

// ---- one level ---------------------------------------------------------

/** A level one person decides: their answer is the level's. */
function level(id: string, label: string, d: ApprovalDecision): ApprovalHop {
  return {
    id,
    label,
    approver: d.approver,
    state: d.state,
    decision: d.decision,
    decidedAt: d.decidedAt,
    note: d.note,
    attachments: d.attachments,
  };
}

/**
 * A level a group decides, under one of the policy builder's completion rules.
 *
 * `closedAt` is stated rather than derived. A seed records what happened; re-deriving "did
 * the rule close, and on which answer" here would be a second copy of
 * `requiredApprovalCount`, living in the fixtures, free to disagree with the one the
 * product reads.
 */
function groupLevel(spec: {
  id: string;
  label: string;
  rule: LevelCompletionRule;
  /** How many must approve. Only the `threshold` rule needs it spelled out. */
  requiredApprovals?: number;
  approvers: ApprovalDecision[];
  /** When the rule was satisfied. Omit while the level is still asking. */
  closedAt?: string;
}): ApprovalHop {
  return {
    id: spec.id,
    label: spec.label,
    approver: spec.approvers[0].approver,
    state: spec.closedAt ? 'done' : 'current',
    decision: spec.closedAt ? 'approved' : 'pending',
    decidedAt: spec.closedAt,
    approvers: spec.approvers,
    completionRule: spec.rule,
    requiredApprovals: spec.requiredApprovals,
  };
}

// ---- one cart line -----------------------------------------------------

/**
 * A cart line with **its own** lifecycle record.
 *
 * Lines in one cart move at their own pace, and until now only the request carried stages:
 * a line at a different stage got the request's list re-stated, which kept the identity and
 * dropped everything recorded on it, so the canvas had nothing to draw. Each line now owns
 * its submission, policy, approval and provisioning entries, which is what lets two lines
 * of the same request show two genuinely different flows.
 */
function line(spec: {
  id: string;
  resourceType: ResourceType;
  resourceName: string;
  resourceDetail: string;
  /** Where the resource lives. Omitted for a technical role, which spans applications. */
  appName?: string;
  appType?: string;
  riskScore: number;
  sodConflict?: boolean;
  sodSummary?: string;
  slaDueAt: string;
  submittedAt: string;
  submittedBy: GovernanceIdentity;
  policyNote: string;
  hops: ApprovalHop[];
  /** When the grant landed in the target system. Omit while the line is still moving. */
  provisionedAt?: string;
}): GovernanceRequestItem {
  const settled =
    spec.hops.length > 0 &&
    spec.hops.every((h) => h.decision === 'approved' || h.decision === 'rejected');
  const approvalStartedAt = after(spec.submittedAt, 26);
  const approvalClosedAt = settled ? spec.hops[spec.hops.length - 1].decidedAt : undefined;
  const currentStage: LifecycleStageId = settled ? 'provisioning' : 'approval';

  return {
    id: spec.id,
    resourceType: spec.resourceType,
    resourceName: spec.resourceName,
    resourceDetail: spec.resourceDetail,
    appName: spec.appName,
    appType: spec.appType,
    riskScore: spec.riskScore,
    sodConflict: spec.sodConflict ?? false,
    sodSummary: spec.sodSummary,
    slaDueAt: spec.slaDueAt,
    currentStage,
    stages: stages({
      submission: {
        id: 'submission',
        state: 'done',
        startedAt: spec.submittedAt,
        completedAt: after(spec.submittedAt, 8),
        actor: spec.submittedBy,
      },
      policy: {
        id: 'policy',
        state: 'done',
        startedAt: after(spec.submittedAt, 8),
        completedAt: approvalStartedAt,
        note: spec.policyNote,
      },
      approval: {
        id: 'approval',
        state: settled ? 'done' : 'current',
        startedAt: approvalStartedAt,
        completedAt: approvalClosedAt,
        hops: spec.hops,
      },
      provisioning: spec.provisionedAt
        ? {
            id: 'provisioning',
            state: 'done',
            startedAt: approvalClosedAt,
            completedAt: spec.provisionedAt,
          }
        : settled
          ? { id: 'provisioning', state: 'current', startedAt: approvalClosedAt }
          : { id: 'provisioning', state: 'pending' },
    }),
  };
}

/**
 * A request built from its lines.
 *
 * The lead line is the one still furthest back, and the request wears its stages: a cart is
 * only as far along as the line holding it up, and the header claiming "Provisioning" while
 * a line sits unapproved is the summary contradicting the list under it.
 */
function request(spec: {
  id: string;
  requester: GovernanceIdentity;
  target: GovernanceIdentity;
  origin: GovernanceRequest['origin'];
  submittedAt: string;
  businessJustification: string;
  attachments?: FileAttachment[];
  closedAt?: string;
  autoEscalate?: boolean;
  items: [GovernanceRequestItem, GovernanceRequestItem];
  audit: AuditEvent[];
}): GovernanceRequest {
  const lead = spec.items[0];
  return {
    id: spec.id,
    reference: spec.id.replace('rg-', 'RG-'),
    resourceType: lead.resourceType,
    resourceName: lead.resourceName,
    resourceDetail: lead.resourceDetail,
    appName: lead.appName,
    appType: lead.appType,
    requester: spec.requester,
    target: spec.target,
    origin: spec.origin,
    riskScore: Math.max(...spec.items.map((i) => i.riskScore ?? 0)),
    sodConflict: spec.items.some((i) => i.sodConflict),
    sodSummary: spec.items.find((i) => i.sodSummary)?.sodSummary,
    submittedAt: spec.submittedAt,
    businessJustification: spec.businessJustification,
    attachments: spec.attachments,
    slaDueAt: lead.slaDueAt ?? spec.submittedAt,
    closedAt: spec.closedAt,
    currentStage: lead.currentStage ?? 'approval',
    stages: lead.stages ?? [],
    autoEscalate: spec.autoEscalate ?? false,
    audit: spec.audit,
    items: spec.items,
  };
}

// ---- applications ------------------------------------------------------

const rg2401 = request({
  id: 'rg-2401',
  requester: ananya,
  target: ananya,
  origin: 'end_user',
  submittedAt: '2026-09-10T09:05:00.000Z',
  businessJustification:
    'Taking over the revenue reporting pack this quarter. I need the CRM and the warehouse together — the pack joins pipeline data to the billing extract, and reading one without the other tells me nothing.',
  audit: [
    audit('a-2401-4', '2026-09-11T09:20:00.000Z', 'Connector', 'Provisioning complete', 'Snowflake account created.'),
    audit('a-2401-3', '2026-09-11T09:15:00.000Z', 'David Chen', 'Level approved', 'Snowflake — application owner.'),
    audit('a-2401-2', '2026-09-10T11:40:00.000Z', 'Mohammed Ali', 'Level approved', 'Manager approved both lines.'),
    audit('a-2401-1', '2026-09-10T09:05:00.000Z', 'Ananya Patel', 'Request submitted', 'Salesforce and Snowflake for Ananya Patel.'),
  ],
  items: [
    line({
      id: 'rg-2401-salesforce',
      resourceType: 'application',
      resourceName: 'Salesforce',
      resourceDetail: 'Production org — pipeline and forecast objects',
      appName: 'Salesforce',
      appType: 'Salesforce',
      riskScore: 72,
      slaDueAt: '2026-09-16T17:00:00.000Z',
      submittedAt: '2026-09-10T09:05:00.000Z',
      submittedBy: ananya,
      policyNote: 'High risk. No SoD conflict against the finance policy pack.',
      hops: [
        level(
          'hop-2401-sf-1',
          'Manager',
          approvedBy(
            mohammed,
            '2026-09-10T11:40:00.000Z',
            'Ananya owns the revenue pack this quarter. Production org only, no admin objects.',
          ),
        ),
        // Two owners, either of whom can clear it — and neither has yet, which is the
        // state a rail card has to read as "waiting on someone", not "half done".
        groupLevel({
          id: 'hop-2401-sf-2',
          label: 'Application owner',
          rule: 'anyOne',
          approvers: [waitingOn(david), waitingOn(marcus)],
        }),
      ],
    }),
    line({
      id: 'rg-2401-snowflake',
      resourceType: 'application',
      resourceName: 'Snowflake',
      resourceDetail: 'Analytics warehouse — REPORTING role',
      appName: 'Snowflake',
      appType: 'Snowflake',
      riskScore: 44,
      slaDueAt: '2026-09-15T17:00:00.000Z',
      submittedAt: '2026-09-10T09:05:00.000Z',
      submittedBy: ananya,
      policyNote: 'Medium risk. Read-only warehouse role.',
      hops: [
        level('hop-2401-sn-1', 'Manager', approvedBy(mohammed, '2026-09-10T11:42:00.000Z', 'Same pack, same quarter.')),
        level(
          'hop-2401-sn-2',
          'Application owner',
          approvedBy(david, '2026-09-11T09:15:00.000Z', 'REPORTING role only. No warehouse resize rights.'),
        ),
      ],
      provisionedAt: '2026-09-11T09:20:00.000Z',
    }),
  ],
});

const rg2402 = request({
  id: 'rg-2402',
  requester: leila,
  target: jessica,
  origin: 'joiner',
  submittedAt: '2026-08-26T08:30:00.000Z',
  businessJustification:
    'Day-one tooling for Jessica, starting Monday on the design team. Standard joiner bundle for the role.',
  closedAt: '2026-08-28T15:12:00.000Z',
  audit: [
    audit('a-2402-4', '2026-08-28T15:12:00.000Z', 'Connector', 'Provisioning complete', 'Slack account created.'),
    audit('a-2402-3', '2026-08-27T10:35:00.000Z', 'Connector', 'Provisioning complete', 'Google Workspace account created.'),
    audit('a-2402-2', '2026-08-27T10:30:00.000Z', 'Marcus Webb', 'Level approved', 'IT Operations cleared the joiner bundle.'),
    audit('a-2402-1', '2026-08-26T08:30:00.000Z', 'Leila Hassan', 'Request submitted', 'Google Workspace and Slack for Jessica Liu.'),
  ],
  items: [
    line({
      id: 'rg-2402-workspace',
      resourceType: 'application',
      resourceName: 'Google Workspace',
      resourceDetail: 'Mail, calendar and drive',
      appName: 'Google Workspace',
      appType: 'Google Workspace',
      riskScore: 28,
      slaDueAt: '2026-08-31T17:00:00.000Z',
      submittedAt: '2026-08-26T08:30:00.000Z',
      submittedBy: leila,
      policyNote: 'Low risk. Matches the design joiner profile.',
      hops: [
        level('hop-2402-gw-1', 'Manager', approvedBy(mohammed, '2026-08-26T12:05:00.000Z', 'Standard joiner bundle.')),
        level(
          'hop-2402-gw-2',
          'IT Operations',
          approvedBy(
            marcus,
            '2026-08-27T10:30:00.000Z',
            'Licence assigned from the design pool. Mailbox set up ahead of Monday.',
            [evidence('att-2402-1', 'joiner-checklist-jliu.pdf', 31400, '2026-08-27T10:28:00.000Z')],
          ),
        ),
      ],
      provisionedAt: '2026-08-27T10:35:00.000Z',
    }),
    line({
      id: 'rg-2402-slack',
      resourceType: 'application',
      resourceName: 'Slack',
      resourceDetail: 'Workspace member',
      appName: 'Slack',
      appType: 'Slack',
      riskScore: 18,
      slaDueAt: '2026-08-31T17:00:00.000Z',
      submittedAt: '2026-08-26T08:30:00.000Z',
      submittedBy: leila,
      policyNote: 'Low risk. Auto-approved profile, manager confirmation only.',
      hops: [level('hop-2402-sl-1', 'Manager', approvedBy(mohammed, '2026-08-26T12:06:00.000Z', 'Same bundle.'))],
      provisionedAt: '2026-08-28T15:12:00.000Z',
    }),
  ],
});

// ---- entitlements ------------------------------------------------------

const rg2403 = request({
  id: 'rg-2403',
  requester: noah,
  target: noah,
  origin: 'end_user',
  submittedAt: '2026-09-07T09:40:00.000Z',
  businessJustification:
    'Covering the vendor payment runs for the September close while Priya is on leave. The conflicting Vendor Maintain access on my account is already queued for removal on the 30th.',
  attachments: [evidence('att-2403-req-1', 'close-calendar-september.pdf', 52100, '2026-09-07T09:38:00.000Z')],
  audit: [
    audit('a-2403-4', '2026-09-09T11:15:00.000Z', 'Priya Shah', 'Level approved', 'Finance exception board — 1 of 2 required approvals.'),
    audit('a-2403-3', '2026-09-08T10:20:00.000Z', 'Elena Vasquez', 'Level approved', 'Security review cleared under any-one-of-two.'),
    audit('a-2403-2', '2026-09-07T13:05:00.000Z', 'Mohammed Ali', 'Level approved', 'Manager approved for the September close.'),
    audit('a-2403-1', '2026-09-07T09:40:00.000Z', 'Noah Okonkwo', 'Request submitted', 'Payment Release and Bank Master Data on SAP S/4HANA Finance.'),
  ],
  items: [
    line({
      id: 'rg-2403-payment-release',
      resourceType: 'entitlement',
      resourceName: 'Payment Release',
      resourceDetail: 'Release outgoing vendor payments',
      appName: 'SAP S/4HANA Finance',
      appType: 'SAP',
      riskScore: 85,
      sodConflict: true,
      sodSummary: 'Conflicts with Vendor Maintain, already held on the same account.',
      // Past due. The one breached line in the store, so the rail, the canvas and the SLA
      // column all have something to be red about.
      slaDueAt: '2026-09-11T17:00:00.000Z',
      submittedAt: '2026-09-07T09:40:00.000Z',
      submittedBy: noah,
      policyNote: 'SoD conflict with Vendor Maintain. Routed to the finance exception chain.',
      hops: [
        level(
          'hop-2403-pr-1',
          'Manager',
          approvedBy(mohammed, '2026-09-07T13:05:00.000Z', 'Needed for the September close. Time-boxed to the 30th.'),
        ),
        // Closed on the first answer, with the second person kept — "No longer required"
        // is a fact about the ask, and dropping Amelia would hide that she was asked.
        groupLevel({
          id: 'hop-2403-pr-2',
          label: 'Security review',
          rule: 'anyOne',
          closedAt: '2026-09-08T10:20:00.000Z',
          approvers: [
            approvedBy(
              elena,
              '2026-09-08T10:20:00.000Z',
              'Compensating control agreed: Vendor Maintain is removed on 30 Sep and the pair is monitored until then.',
              [evidence('att-2403-1', 'compensating-control.pdf', 58900, '2026-09-08T10:18:00.000Z')],
            ),
            passedOver(amelia),
          ],
        }),
        groupLevel({
          id: 'hop-2403-pr-3',
          label: 'Finance exception board',
          rule: 'threshold',
          requiredApprovals: 2,
          approvers: [
            approvedBy(
              priya,
              '2026-09-09T11:15:00.000Z',
              'Satisfied with the removal date. Please confirm the payment ceiling stays at the current limit.',
            ),
            waitingOn(david),
            waitingOn(marcus),
          ],
        }),
      ],
    }),
    line({
      id: 'rg-2403-bank-master',
      resourceType: 'entitlement',
      resourceName: 'Bank Master Data',
      resourceDetail: 'Maintain vendor bank details',
      appName: 'SAP S/4HANA Finance',
      appType: 'SAP',
      riskScore: 64,
      slaDueAt: '2026-09-16T17:00:00.000Z',
      submittedAt: '2026-09-07T09:40:00.000Z',
      submittedBy: noah,
      policyNote: 'High risk. No conflict on this line.',
      hops: [
        level('hop-2403-bm-1', 'Manager', approvedBy(mohammed, '2026-09-07T13:06:00.000Z', 'Same close, same window.')),
        level('hop-2403-bm-2', 'Security review', waitingOn(elena)),
      ],
    }),
  ],
});

const rg2404 = request({
  id: 'rg-2404',
  requester: jessica,
  target: jessica,
  origin: 'end_user',
  submittedAt: '2026-08-31T07:22:00.000Z',
  businessJustification:
    'Picking up the release rota for the onboarding service from September. I need to push branches and to ship the builds I cut.',
  closedAt: '2026-09-02T16:40:00.000Z',
  audit: [
    audit('a-2404-4', '2026-09-02T16:40:00.000Z', 'Connector', 'Provisioning complete', 'PROD_DEPLOY granted on GitHub.'),
    audit('a-2404-3', '2026-09-02T14:05:00.000Z', 'Marcus Webb', 'Level approved', 'Release board — second of two required approvals.'),
    audit('a-2404-2', '2026-09-01T09:30:00.000Z', 'David Chen', 'Level approved', 'Release board — first of two required approvals.'),
    audit('a-2404-1', '2026-08-31T07:22:00.000Z', 'Jessica Liu', 'Request submitted', 'PROD_DEPLOY and Write on GitHub.'),
  ],
  items: [
    line({
      id: 'rg-2404-prod-deploy',
      resourceType: 'entitlement',
      resourceName: 'PROD_DEPLOY',
      resourceDetail: 'Ship production releases',
      appName: 'GitHub',
      appType: 'GitHub',
      riskScore: 67,
      slaDueAt: '2026-09-04T17:00:00.000Z',
      submittedAt: '2026-08-31T07:22:00.000Z',
      submittedBy: jessica,
      policyNote: 'High risk. Cleared against the GitHub production policy pack.',
      hops: [
        level(
          'hop-2404-pd-1',
          'Manager',
          approvedBy(mohammed, '2026-08-31T10:15:00.000Z', 'Jessica takes the release rota from 1 Sep.'),
        ),
        // Both must answer, and they did so a day apart — which is exactly the case a
        // single timestamp at the top of a level could not tell the truth about.
        groupLevel({
          id: 'hop-2404-pd-2',
          label: 'Release board',
          rule: 'all',
          closedAt: '2026-09-02T14:05:00.000Z',
          approvers: [
            approvedBy(
              david,
              '2026-09-01T09:30:00.000Z',
              'Scoped to the onboarding service repositories. Payments stays out of it.',
              [evidence('att-2404-1', 'release-scope-onboarding.pdf', 47300, '2026-09-01T09:28:00.000Z')],
            ),
            approvedBy(
              marcus,
              '2026-09-02T14:05:00.000Z',
              'Deploy window and rollback runbook confirmed with the on-call rota.',
            ),
          ],
        }),
      ],
      provisionedAt: '2026-09-02T16:40:00.000Z',
    }),
    line({
      id: 'rg-2404-write',
      resourceType: 'entitlement',
      resourceName: 'Write',
      resourceDetail: 'Push to repositories and open pull requests',
      appName: 'GitHub',
      appType: 'GitHub',
      riskScore: 45,
      slaDueAt: '2026-09-04T17:00:00.000Z',
      submittedAt: '2026-08-31T07:22:00.000Z',
      submittedBy: jessica,
      policyNote: 'Medium risk. Standard for the engineering profile.',
      hops: [
        level('hop-2404-wr-1', 'Manager', approvedBy(mohammed, '2026-08-31T10:16:00.000Z', 'Same rota.')),
      ],
      provisionedAt: '2026-08-31T10:20:00.000Z',
    }),
  ],
});

// ---- technical roles ---------------------------------------------------
// No `appName`: a technical role bundles access that can span applications, so naming one
// of them would claim a scope the role does not have.

const rg2405 = request({
  id: 'rg-2405',
  requester: priya,
  target: ananya,
  origin: 'manager',
  submittedAt: '2026-09-11T08:00:00.000Z',
  businessJustification:
    'Ananya is taking over identity administration while the platform team is reorganised. She needs the administrator role and the engineering baseline that goes under it.',
  audit: [
    audit('a-2405-4', '2026-09-12T09:45:00.000Z', 'Elena Vasquez', 'Level approved', 'Security board — 1 of 2 required approvals.'),
    audit('a-2405-3', '2026-09-11T10:26:00.000Z', 'Connector', 'Provisioning complete', 'Engineering Baseline granted.'),
    audit('a-2405-2', '2026-09-11T10:20:00.000Z', 'Mohammed Ali', 'Level approved', 'Manager approved both lines.'),
    audit('a-2405-1', '2026-09-11T08:00:00.000Z', 'Priya Shah', 'Request submitted', 'IAM Administrator and Engineering Baseline for Ananya Patel.'),
  ],
  items: [
    line({
      id: 'rg-2405-iam-admin',
      resourceType: 'role',
      resourceName: 'IAM Administrator',
      resourceDetail: 'Technical role — manage identities, roles and policies',
      riskScore: 88,
      slaDueAt: '2026-09-16T12:00:00.000Z',
      submittedAt: '2026-09-11T08:00:00.000Z',
      submittedBy: priya,
      policyNote: 'Critical risk. Routed to the security board under the privileged-role policy.',
      hops: [
        level(
          'hop-2405-iam-1',
          'Manager',
          approvedBy(mohammed, '2026-09-11T10:20:00.000Z', 'Agreed as part of the platform handover.'),
        ),
        // Majority of three: two answers close it, one is in. The board is still asking.
        groupLevel({
          id: 'hop-2405-iam-2',
          label: 'Security board',
          rule: 'majority',
          approvers: [
            approvedBy(
              elena,
              '2026-09-12T09:45:00.000Z',
              'Hardware key already enforced on the account. Re-attest at the Q4 certification.',
            ),
            waitingOn(david),
            waitingOn(marcus),
          ],
        }),
      ],
    }),
    line({
      id: 'rg-2405-eng-baseline',
      resourceType: 'role',
      resourceName: 'Engineering Baseline',
      resourceDetail: 'Technical role — repositories, CI and the internal docs wiki',
      riskScore: 24,
      slaDueAt: '2026-09-16T12:00:00.000Z',
      submittedAt: '2026-09-11T08:00:00.000Z',
      submittedBy: priya,
      policyNote: 'Low risk. Baseline role for the engineering profile.',
      hops: [
        level('hop-2405-eb-1', 'Manager', approvedBy(mohammed, '2026-09-11T10:21:00.000Z', 'Baseline goes with the role.')),
      ],
      provisionedAt: '2026-09-11T10:26:00.000Z',
    }),
  ],
});

const rg2406 = request({
  id: 'rg-2406',
  requester: marcus,
  target: marcus,
  origin: 'end_user',
  submittedAt: '2026-08-24T08:15:00.000Z',
  businessJustification:
    'Taking over the production on-call rotation from 1 Sep. I need administrator access to run the quarterly failover drills and to clear incidents out of hours without waking a second person.',
  attachments: [
    evidence('att-2406-req-1', 'on-call-handover.pdf', 73200, '2026-08-24T08:12:00.000Z'),
    evidence('att-2406-req-2', 'failover-drill-plan.pdf', 39100, '2026-08-24T08:13:00.000Z'),
  ],
  closedAt: '2026-08-27T10:05:00.000Z',
  audit: [
    audit('a-2406-5', '2026-08-27T10:05:00.000Z', 'Connector', 'Provisioning complete', 'Production Administrator granted.'),
    audit('a-2406-4', '2026-08-27T09:48:00.000Z', 'Priya Shah', 'Level approved', 'IT Operations — final level.'),
    audit('a-2406-3', '2026-08-26T16:40:00.000Z', 'Elena Vasquez', 'Level approved', 'Security cleared with session recording.'),
    audit('a-2406-2', '2026-08-25T14:05:00.000Z', 'David Chen', 'Level approved', 'Application owner scoped to the payments boundary.'),
    audit('a-2406-1', '2026-08-24T08:15:00.000Z', 'Marcus Webb', 'Request submitted', 'Production Administrator and SRE On-Call.'),
  ],
  items: [
    line({
      id: 'rg-2406-prod-admin',
      resourceType: 'role',
      resourceName: 'Production Administrator',
      resourceDetail: 'Technical role — administer production accounts and run failover drills',
      riskScore: 91,
      slaDueAt: '2026-08-31T17:00:00.000Z',
      submittedAt: '2026-08-24T08:15:00.000Z',
      submittedBy: marcus,
      policyNote: 'Critical risk. Four-level chain under the privileged-role policy.',
      // The long chain: four levels, each one person. What a completed audit trail looks
      // like when nothing was delegated and nobody was passed over.
      hops: [
        level(
          'hop-2406-pa-1',
          'Manager',
          approvedBy(
            mohammed,
            '2026-08-24T11:30:00.000Z',
            'Marcus is taking over the on-call rotation from 1 Sep and needs production administration to run the failover drills.',
          ),
        ),
        level(
          'hop-2406-pa-2',
          'Application owner',
          approvedBy(
            david,
            '2026-08-25T14:05:00.000Z',
            'Scoped to the two production accounts in the payments boundary. Sandbox stays out of it.',
            [evidence('att-2406-1', 'aws-account-scope.pdf', 50400, '2026-08-25T14:02:00.000Z')],
          ),
        ),
        level(
          'hop-2406-pa-3',
          'Security',
          approvedBy(
            elena,
            '2026-08-26T16:40:00.000Z',
            'Hardware key enforced on the account and session recording is on. Re-attest at the Q4 certification.',
            [
              evidence('att-2406-2', 'security-review-CHG-5102.pdf', 67300, '2026-08-26T16:36:00.000Z'),
              evidence('att-2406-3', 'session-recording-policy.pdf', 32100, '2026-08-26T16:38:00.000Z'),
            ],
          ),
        ),
        level(
          'hop-2406-pa-4',
          'IT Operations',
          approvedBy(
            priya,
            '2026-08-27T09:48:00.000Z',
            'Break-glass runbook updated and the rotation calendar reflects the handover. Cleared to provision.',
          ),
        ),
      ],
      provisionedAt: '2026-08-27T10:05:00.000Z',
    }),
    line({
      id: 'rg-2406-sre-oncall',
      resourceType: 'role',
      resourceName: 'SRE On-Call',
      resourceDetail: 'Technical role — paging, incident command and the status page',
      riskScore: 58,
      slaDueAt: '2026-08-31T17:00:00.000Z',
      submittedAt: '2026-08-24T08:15:00.000Z',
      submittedBy: marcus,
      policyNote: 'Medium risk. Paired with the rotation handover.',
      hops: [
        level('hop-2406-so-1', 'Manager', approvedBy(mohammed, '2026-08-24T11:31:00.000Z', 'Same handover.')),
        groupLevel({
          id: 'hop-2406-so-2',
          label: 'Operations review',
          rule: 'all',
          closedAt: '2026-08-25T15:22:00.000Z',
          approvers: [
            approvedBy(priya, '2026-08-25T09:10:00.000Z', 'Rotation calendar updated from 1 Sep.'),
            approvedBy(david, '2026-08-25T15:22:00.000Z', 'Paging routes moved across. Status page access included.'),
          ],
        }),
      ],
      provisionedAt: '2026-08-25T15:30:00.000Z',
    }),
  ],
});

export const requestGovernanceSeed: GovernanceRequest[] = [
  rg2401,
  rg2402,
  rg2403,
  rg2404,
  rg2405,
  rg2406,
];
