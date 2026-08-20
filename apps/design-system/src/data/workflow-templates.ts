/**
 * The workflow template library.
 *
 * Eleven lifecycle processes, each expressed as a **real node tree** — not a
 * description of one. That is the load-bearing decision here: because a template
 * *is* a workflow, the gallery can preview it with the same renderer the builder
 * and the detail page use, and "what you saw" and "what you got" cannot diverge.
 * A template stored as prose plus a shopping list would need a second renderer to
 * preview, and the second renderer is where the lie creeps in.
 *
 * ## What a template is allowed to leave undone
 *
 * Templates ship with plausible targets ("Microsoft Entra ID"), plausible
 * attribute rules and plausible retention windows, because a preview full of
 * "select a system" placeholders previews nothing. What they cannot do is invent
 * *your* connections, groups or licence SKUs — so every template declares
 * `needsAttention`, the honest list of what an administrator must confirm before
 * switching it on. The gallery shows that list *before* you commit, which is the
 * difference between a template and a surprise.
 *
 * ## Naming
 *
 * Titles use the lifecycle vocabulary an IGA administrator already has — Joiner /
 * Mover / Leaver crossed with the population (Employee, Student, Contractor) —
 * rather than invented product names, so the gallery is scannable by someone who
 * has never opened it.
 */

import type {
  AutomationWorkflow,
  WorkflowEventType,
  WorkflowNode,
  WorkflowBlockType,
} from './automation-types';
import { eventFromType } from './workflows';
import { defaultConfigFor } from '@/lib/workflow-tree';

// ---- authoring helpers -------------------------------------------------

/**
 * Deterministic ids.
 *
 * A template is a *value*, read at module scope and cloned per use. Random ids
 * would make the server and the client disagree about the same template and React
 * would call it a hydration error, so ids are derived from position instead.
 */
let seq = 0;
function node(type: WorkflowBlockType, config?: Record<string, unknown>, name?: string): WorkflowNode {
  seq += 1;
  const base: WorkflowNode = { id: `tpl-${seq}`, type };
  const merged = { ...(defaultConfigFor(type) ?? {}), ...(config ?? {}) };
  if (Object.keys(merged).length > 0) base.config = merged;
  if (name) base.name = name;
  return base;
}

const sys = (...names: string[]) => names.map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name }));

// ---- template shape ----------------------------------------------------

export interface WorkflowTemplate {
  id: string;
  /** The lifecycle event it hangs off — also the gallery's grouping. */
  event: WorkflowEventType;
  /** The population it serves, for the gallery's second-level grouping. */
  audience: 'Employee' | 'Student' | 'Contractor';
  name: string;
  /** One sentence, short enough to finish in three caption lines in the gallery rail. */
  summary: string;
  /** The systems it touches, for the card's chips. */
  systems: string[];
  /** What an administrator must confirm before switching it on. Never empty. */
  needsAttention: string[];
  root: WorkflowNode[];
}

/** Attribute rules read as `attribute = expression`, which is how a transform reads. */
const rule = (attribute: string, value: string, conditional = false) => ({ attribute, value, conditional });

// ---- JOINER ------------------------------------------------------------

const employeeOnboarding: WorkflowTemplate = {
  id: 'employee-onboarding',
  event: 'joiner',
  audience: 'Employee',
  name: 'Employee onboarding',
  summary:
    'A new hire gets an account, mailbox, licence, birthright access, and a welcome to them and their manager.',
  systems: ['PeopleSoft HCM', 'Microsoft Entra ID', 'Office 365'],
  needsAttention: [
    'Map the HRMS connection that raises the new-hire event',
    'Confirm the UPN and mail-domain expressions against your naming standard',
    'Point the licence step at your own M365 SKUs',
    'Replace the placeholder role-based access with your birthright policies',
  ],
  root: [
    node('waitForUser', { minutes: 30, maxRetries: 6, connectionIds: [] }, 'Wait for the HRMS record'),
    node(
      'provisionAccount',
      { targets: sys('Microsoft Entra ID'), mode: 'create', services: ['Mailbox', 'OneDrive', 'Teams'] },
      'Create the directory account',
    ),
    node(
      'setAttributes',
      {
        rules: [
          rule('userPrincipalName', 'first.last@{company.domain}'),
          rule('mail', 'first.last@{company.domain}', true),
          rule('department', '{hrms.department}'),
          rule('manager', '{hrms.managerId}'),
        ],
      },
      'Set UPN, mail and org attributes',
    ),
    node('manageLicense', { action: 'assign', licenses: ['Microsoft 365 E3'], conditional: true }),
    node('assignEntities', undefined, 'Grant role-based access'),
    node('notification', undefined, 'Welcome the new hire and their manager'),
  ],
};

const employeeRehire: WorkflowTemplate = {
  id: 'employee-rehire',
  event: 'joiner',
  audience: 'Employee',
  name: 'Employee rehire',
  summary:
    'A returning employee keeps their identity. The account is re-enabled with access for the new role.',
  systems: ['PeopleSoft HCM', 'Active Directory', 'Microsoft Entra ID', 'Office 365'],
  needsAttention: [
    'Confirm your policy on reusing the previous username and mail address',
    'Check that role-based access resolves from the NEW position, not the previous one',
    'Verify the audit trail retains the prior employment and termination events',
  ],
  root: [
    node('userFilter', undefined, 'Only records marked as a rehire'),
    node(
      'provisionAccount',
      {
        targets: sys('Active Directory', 'Microsoft Entra ID'),
        mode: 'reactivate',
        preserveIdentifiers: true,
        services: ['Mailbox'],
      },
      'Re-enable the existing account',
    ),
    node('setAttributes', { rules: [rule('department', '{hrms.department}'), rule('title', '{hrms.jobTitle}')] }),
    node('manageLicense', { action: 'assign', licenses: ['Microsoft 365 E3'] }),
    node('assignEntities', undefined, 'Grant access for the new role'),
    node('notification', undefined, 'Tell the manager and IT'),
  ],
};

const studentEnrolment: WorkflowTemplate = {
  id: 'student-enrolment',
  event: 'joiner',
  audience: 'Student',
  name: 'Student enrolment',
  summary:
    'A new admission gets an account, mailbox, class membership, and access to the LMS, library and portal.',
  systems: ['PeopleSoft SIS', 'Microsoft Entra ID', 'Office 365', 'Blackboard'],
  needsAttention: [
    'Map the SIS connection that raises the admission event',
    'Confirm the student UPN expression — it usually differs from staff',
    'Point LMS and library access at your own applications',
  ],
  root: [
    node('waitForUser', { minutes: 30, maxRetries: 6, connectionIds: [] }, 'Wait for the SIS record'),
    node(
      'provisionAccount',
      { targets: sys('Microsoft Entra ID'), mode: 'create', services: ['Mailbox', 'OneDrive', 'Teams'] },
      'Create the student account',
    ),
    node(
      'setAttributes',
      { rules: [rule('userPrincipalName', '{studentId}@students.{domain}'), rule('department', '{sis.programme}')] },
      'Set the student UPN and programme',
    ),
    node('manageLicense', { action: 'assign', licenses: ['Microsoft 365 A3 for students'] }),
    node('assignEntities', undefined, 'Grant LMS, library and portal access'),
    node('notification', undefined, 'Send credentials, password setup and MFA steps'),
  ],
};

const studentReturning: WorkflowTemplate = {
  id: 'student-returning',
  event: 'joiner',
  audience: 'Student',
  name: 'Returning student',
  summary:
    'A student back from leave is restored on the same identity, with access rebuilt from their programme.',
  systems: ['PeopleSoft SIS', 'Microsoft Entra ID', 'Blackboard'],
  needsAttention: [
    'Confirm the identity is restored rather than duplicated',
    'Check access is rebuilt from the CURRENT programme, which may have changed',
    'Verify the departure reason is retained on the identity',
  ],
  root: [
    node('userFilter', undefined, 'Only re-enrolment records'),
    node(
      'provisionAccount',
      { targets: sys('Microsoft Entra ID'), mode: 'reactivate', preserveIdentifiers: true, services: ['Mailbox'] },
      'Restore the student account',
    ),
    node('setAttributes', { rules: [rule('department', '{sis.programme}')] }),
    node('manageLicense', { action: 'assign', licenses: ['Microsoft 365 A3 for students'] }),
    node('assignEntities', undefined, 'Re-grant programme access'),
    node('notification', undefined, 'Confirm the restored access'),
  ],
};

const contractorJoiner: WorkflowTemplate = {
  id: 'contractor-joiner',
  event: 'joiner',
  audience: 'Contractor',
  name: 'Contractor onboarding',
  summary:
    'A contractor gets a time-boxed identity and only the access their engagement needs.',
  systems: ['PeopleSoft HCM', 'Microsoft Entra ID'],
  needsAttention: [
    'Confirm the contract end date is written onto the account as its expiry',
    'Review the minimum access set — contractors should inherit no birthright access',
    'Decide whether a renewal extends this identity or requires approval',
  ],
  root: [
    node('userFilter', undefined, 'Only contractor records'),
    node(
      'provisionAccount',
      { targets: sys('Microsoft Entra ID'), mode: 'create', services: ['Mailbox'] },
      'Create a time-boxed account',
    ),
    node(
      'setAttributes',
      {
        rules: [
          rule('accountExpires', '{hrms.contractEndDate}'),
          rule('employeeType', 'Contractor'),
          rule('company', '{hrms.vendor}'),
        ],
      },
      'Stamp the contract end date',
    ),
    node('assignEntities', undefined, 'Grant only the engagement access'),
    node('notification', undefined, 'Notify the contractor and their sponsor'),
  ],
};

// ---- MOVER -------------------------------------------------------------

const employeeMove: WorkflowTemplate = {
  id: 'employee-move',
  event: 'mover',
  audience: 'Employee',
  name: 'Employee role or department change',
  summary:
    'A change of department, role or manager updates attributes and access, and puts the old permissions in review.',
  systems: ['PeopleSoft HCM', 'Microsoft Entra ID', 'Office 365'],
  needsAttention: [
    'Confirm which HRMS fields count as a move (department, title, cost centre, reporting line)',
    'Check the sister-company branch if you operate more than one mail domain',
    'Set who reviews the previous role’s access and how long they get',
  ],
  root: [
    node('userFilter', undefined, 'Only meaningful position changes'),
    node(
      'setAttributes',
      {
        rules: [
          rule('department', '{hrms.department}'),
          rule('title', '{hrms.jobTitle}'),
          rule('manager', '{hrms.managerId}'),
          rule('physicalDeliveryOfficeName', '{hrms.campus}'),
        ],
      },
      'Update org attributes',
    ),
    // A conditional branch, not a note in a description: moving between sister
    // companies changes the mail domain and the licence, and that is a different
    // path rather than a footnote on this one.
    node('wfConditionalBranch', undefined, 'Moved between sister companies?'),
    node('assignEntities', undefined, 'Grant access for the new position'),
    node('revokeAccess', { scope: 'roleBased' }, 'Remove access from the previous role'),
    node(
      'triggerReview',
      { scope: 'previousRole', reviewer: 'newManager', dueInDays: 14 },
      'Review what the previous role granted',
    ),
    node('notification', undefined, 'Tell both managers and IT'),
  ],
};

const studentMove: WorkflowTemplate = {
  id: 'student-move',
  event: 'mover',
  audience: 'Student',
  name: 'Student programme change',
  summary:
    'A change of major, programme or enrolment rebuilds class membership and application access.',
  systems: ['PeopleSoft SIS', 'Microsoft Entra ID', 'Blackboard'],
  needsAttention: [
    'Confirm which SIS statuses mean suspension, probation and leave of absence',
    'Decide what stays reachable during a leave — identity and mail usually do',
    'Check the campus-transfer branch if you run more than one campus domain',
  ],
  root: [
    node('userFilter', undefined, 'Only programme or status changes'),
    node('setAttributes', { rules: [rule('department', '{sis.programme}'), rule('company', '{sis.college}')] }),
    // Full-time / part-time / exchange / suspended are not two cases, so this is a
    // multisplit rather than an if/else — one lane per status, all evaluated.
    node('multisplitBranch', { splitAttributes: [] }, 'Split by enrolment status'),
    node('assignEntities', undefined, 'Rebuild LMS and application access'),
    node('revokeAccess', { scope: 'roleBased' }, 'Remove access from the previous programme'),
    node('notification', undefined, 'Confirm the change to the student'),
  ],
};

// ---- LEAVER ------------------------------------------------------------

const employeeOffboarding: WorkflowTemplate = {
  id: 'employee-offboarding',
  event: 'leaver',
  audience: 'Employee',
  name: 'Employee offboarding',
  summary:
    'Sign-in is killed at once, then access, licence, mailbox and files are wound down after retention.',
  systems: ['PeopleSoft HCM', 'Microsoft Entra ID', 'Office 365'],
  needsAttention: [
    'Confirm your retention window before deletion — the template assumes 30 days',
    'Decide between a shared mailbox and a litigation hold for your jurisdiction',
    'Name who inherits the mailbox and OneDrive when there is no successor',
    'Check the notification list covers IT security, HR, the manager and the helpdesk',
  ],
  root: [
    node(
      'accountAction',
      { actions: ['disableSignIn', 'revokeSessions', 'blockMfa', 'convertMailbox'] },
      'Contain the account immediately',
    ),
    node('revokeAccess', { scope: 'all', targets: sys('Microsoft Entra ID', 'Office 365') }, 'Remove all access'),
    node('manageLicense', { action: 'reclaim', licenses: ['Microsoft 365 E3'] }),
    node(
      'delegateAccess',
      { delegateTo: 'manager', assets: ['Mailbox', 'OneDrive'] },
      'Hand over mailbox and files',
    ),
    node('notification', undefined, 'Alert IT security, HR, manager and helpdesk'),
    node('delay', { days: 30 }, 'Retention window'),
    node('accountAction', { actions: ['archiveData', 'deleteAccount'], retentionDays: 30 }, 'Archive, then delete'),
  ],
};

const studentGraduation: WorkflowTemplate = {
  id: 'student-graduation',
  event: 'leaver',
  audience: 'Student',
  name: 'Student graduation',
  summary:
    'Access stays through a grace period for transcripts, then becomes an alumni identity.',
  systems: ['PeopleSoft SIS', 'Microsoft Entra ID', 'Office 365'],
  needsAttention: [
    'Confirm the grace period — the template assumes 30 days',
    'Set your alumni mail domain and decide whether alumni mail is offered at all',
    'Choose the alumni licence tier, or none',
  ],
  root: [
    node('delay', { days: 30 }, 'Post-graduation grace period'),
    node('revokeAccess', { scope: 'roleBased' }, 'Remove student application access'),
    node(
      'setAttributes',
      { rules: [rule('userPrincipalName', '{studentId}@alumni.{domain}'), rule('employeeType', 'Alumni')] },
      'Convert to an alumni identity',
    ),
    node('manageLicense', { action: 'downgrade', licenses: ['Alumni (A1)'] }),
    node('assignEntities', undefined, 'Grant alumni portal, careers and library'),
    node('notification', undefined, 'Explain what changes and when'),
  ],
};

const studentWithdrawal: WorkflowTemplate = {
  id: 'student-withdrawal',
  event: 'leaver',
  audience: 'Student',
  name: 'Student dismissal or withdrawal',
  summary:
    'Application access stops at once; mail stays briefly, then the account is deactivated. No alumni conversion.',
  systems: ['PeopleSoft SIS', 'Microsoft Entra ID', 'Blackboard'],
  needsAttention: [
    'Confirm the mail grace period — the template assumes 14 days',
    'Check your archival requirement for student records',
    'Note deliberately: this path does NOT convert to alumni',
  ],
  root: [
    node('revokeAccess', { scope: 'all', targets: sys('Blackboard') }, 'Stop application access now'),
    node('delay', { days: 14 }, 'Mail grace period'),
    node('accountAction', { actions: ['disableSignIn', 'archiveData'], retentionDays: 14 }, 'Deactivate and archive'),
    node('manageLicense', { action: 'reclaim', licenses: ['Microsoft 365 A3 for students'] }),
    node('notification', undefined, 'Notify the registry and IT'),
  ],
};

const contractorEnd: WorkflowTemplate = {
  id: 'contractor-end',
  event: 'leaver',
  audience: 'Contractor',
  name: 'Contractor contract end',
  summary:
    'Everyone is warned a week before the contract ends; on the date the account is disabled unless it was extended.',
  systems: ['PeopleSoft HCM', 'Microsoft Entra ID'],
  needsAttention: [
    'Confirm the advance-warning window — the template assumes 7 days',
    'Decide what a renewal does: extend this identity, or run the leaver path',
    'Check who is warned besides the contractor and their manager',
  ],
  root: [
    node('notification', undefined, 'Warn contractor, manager and HR (7 days out)'),
    node('delay', { days: 7 }, 'Wait for the contract end date'),
    node('wfConditionalBranch', undefined, 'Contract extended?'),
    node('accountAction', { actions: ['disableSignIn', 'revokeSessions'] }, 'Disable on the end date'),
    node('revokeAccess', { scope: 'all' }, 'Remove all access'),
    node('manageLicense', { action: 'reclaim', licenses: ['Microsoft 365 E3'] }),
  ],
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  employeeOnboarding,
  employeeRehire,
  studentEnrolment,
  studentReturning,
  contractorJoiner,
  employeeMove,
  studentMove,
  employeeOffboarding,
  studentGraduation,
  studentWithdrawal,
  contractorEnd,
];

export const templateById = (id: string) => WORKFLOW_TEMPLATES.find((t) => t.id === id) ?? null;

export const templatesForEvent = (event: WorkflowEventType) =>
  WORKFLOW_TEMPLATES.filter((t) => t.event === event);

/**
 * A template rendered as a workflow, for the preview.
 *
 * Deliberately the same `AutomationWorkflow` shape the builder edits, so the
 * gallery can hand it straight to `WorkflowFlowPreview`. The id is a sentinel: it
 * is never stored, and `createWorkflowFromTemplate` mints a real one.
 */
export function templateAsWorkflow(t: WorkflowTemplate): AutomationWorkflow {
  return {
    id: `preview-${t.id}`,
    name: t.name,
    description: t.summary,
    status: 'draft',
    event: eventFromType(t.event),
    root: structuredClone(t.root),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** How many steps a reader is committing to, for the card. */
export const templateStepCount = (t: WorkflowTemplate) => t.root.length;
