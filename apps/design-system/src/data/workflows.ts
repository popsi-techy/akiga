/**
 * Workflows service — hybrid persistence (localStorage `iga.workflows.v1`).
 * The seed primes an empty store; thereafter localStorage is the source of
 * truth. Bump `SEED_VERSION` to top-up missing sample workflows without
 * overwriting ones the administrator already edited or created.
 */
import type {
  AutomationWorkflow,
  ConditionGroup,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowNode,
  WorkflowRow,
} from './automation-types';
import { migrateSeq } from '@/lib/workflow-tree';
import { defaultNotificationConfig } from './notification-templates';

const STORE_KEY = 'iga.workflows.v1';
/** Bump to add newly-authored sample workflows to existing stores. */
const SEED_VERSION = 1;

interface Store {
  version?: number;
  workflows: Record<string, AutomationWorkflow>;
}

const hasWindow = () => typeof window !== 'undefined';

/** Default label + description for each lifecycle event type. */
export const WORKFLOW_EVENT_META: Record<
  WorkflowEventType,
  { label: string; description: string }
> = {
  joiner: {
    label: 'Joiner',
    description: 'Starts when a new identity joins the organization.',
  },
  mover: {
    label: 'Mover',
    description: 'Starts when an identity changes role, department, or location.',
  },
  leaver: {
    label: 'Leaver',
    description: 'Starts when an identity leaves the organization.',
  },
};

export function eventFromType(type: WorkflowEventType): WorkflowEvent {
  const meta = WORKFLOW_EVENT_META[type];
  return { type, label: meta.label, description: meta.description };
}

function rule(id: string, attribute: string, value: string): ConditionGroup['children'][number] {
  return { kind: 'rule', id, attribute, operator: 'equals', value };
}

function orGroup(id: string, ...children: ConditionGroup['children']): ConditionGroup {
  return { kind: 'group', id, combinator: 'OR', children };
}

function andGroup(id: string, ...children: ConditionGroup['children']): ConditionGroup {
  return { kind: 'group', id, combinator: 'AND', children };
}

/**
 * The live joiner automation the Execution History already narrates.
 *
 * Node ids match `workflow-runs.ts` (`n1`…`n5`) so a run's step list and the
 * canvas are the same tree, not two stories about the same hire.
 */
const JOINER_ONBOARDING: AutomationWorkflow = {
  id: 'wf-joiner-onboarding',
  name: 'Joiner onboarding',
  description:
    'When a new identity joins Data, Finance or Engineering, grant the role-appropriate access and send a welcome.',
  status: 'active',
  event: eventFromType('joiner'),
  createdAt: '2026-03-12T09:00:00.000Z',
  updatedAt: '2026-08-09T06:02:00.000Z',
  root: [
    {
      id: 'n1',
      type: 'userFilter',
      name: 'User Filter',
      config: {
        condition: orGroup(
          'grp-depts',
          rule('r-data', 'department', 'Data'),
          rule('r-fin', 'department', 'Finance'),
          rule('r-eng', 'department', 'Engineering'),
        ),
      },
    },
    {
      id: 'n2',
      type: 'wfConditionalBranch',
      name: 'Conditional Branch',
      branches: [
        {
          id: 'br-if',
          label: 'IF',
          kind: 'if',
          condition: andGroup('grp-title', rule('r-title', 'jobTitle', 'Data Engineer')),
          seq: [
            {
              id: 'n3',
              type: 'assignEntities',
              name: 'Assign Entities',
              config: {
                entitlements: [{ id: 'ent-snow-read', name: 'Snowflake Read', appName: 'Snowflake' }],
                technicalRoles: [],
                businessRoles: [],
              },
            },
          ],
        },
        {
          id: 'br-else',
          label: 'ELSE',
          kind: 'else',
          locked: true,
          seq: [
            {
              id: 'n4',
              type: 'assignEntities',
              name: 'Assign Entities',
              config: {
                entitlements: [{ id: 'ent-ns-read', name: 'NetSuite Read', appName: 'NetSuite' }],
                technicalRoles: [],
                businessRoles: [{ id: 'br-fin-analyst', name: 'Finance Analyst', appName: 'Workday' }],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'n5',
      type: 'notification',
      name: 'Notification',
      config: {
        ...defaultNotificationConfig(),
        email: {
          enabled: true,
          template: {
            name: 'Joiner welcome',
            subject: 'Welcome to {{resource}}',
            body: '<p>Hi {{requester.name}},</p><p>Your joiner access has been granted. Check your email for next steps.</p>',
          },
        },
      },
    },
  ],
};

const WORKFLOW_SEED: AutomationWorkflow[] = [JOINER_ONBOARDING];

function seedStore(): Store {
  const workflows: Record<string, AutomationWorkflow> = {};
  for (const wf of WORKFLOW_SEED) workflows[wf.id] = structuredClone(wf);
  return { version: SEED_VERSION, workflows };
}

function readStore(): Store {
  if (!hasWindow()) return seedStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.workflows) {
      const seeded = seedStore();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    if (parsed.version !== SEED_VERSION) {
      for (const wf of WORKFLOW_SEED) {
        if (!parsed.workflows[wf.id]) parsed.workflows[wf.id] = structuredClone(wf);
      }
      parsed.version = SEED_VERSION;
      window.localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return seedStore();
  }
}

function writeStore(store: Store): void {
  if (!hasWindow()) return;
  store.version = store.version ?? SEED_VERSION;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}
function nowIso() {
  return new Date().toISOString();
}
function makeId() {
  return `wf-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Fresh ids through a cloned tree, branches included. See `createWorkflow`. */
function remintIds(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map((n) => ({
    ...n,
    id: `wf-${Math.random().toString(36).slice(2, 9)}`,
    branches: n.branches?.map((b) => ({
      ...b,
      id: `br-${Math.random().toString(36).slice(2, 9)}`,
      seq: remintIds(b.seq),
    })),
  }));
}

export function listWorkflows(): WorkflowRow[] {
  const { workflows } = readStore();
  return Object.values(workflows)
    .map(({ id, name, status, createdAt, updatedAt, event }) => ({
      id,
      name,
      eventType: event?.type ?? null,
      status,
      createdAt,
      updatedAt,
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getWorkflow(id: string): AutomationWorkflow | null {
  const wf = readStore().workflows[id];
  if (!wf) return null;
  return { ...wf, root: migrateSeq(wf.root) };
}

export function createWorkflow(input: {
  name?: string;
  description?: string;
  /** Optional — builders place the lifecycle event from the Events palette. */
  eventType?: WorkflowEventType;
  /**
   * A starting tree, from a template. Node ids are re-minted on the way in —
   * a template is read from module scope and shared by every preview, so storing
   * its ids would make two workflows created from one template share node
   * identity, and editing either would corrupt the other.
   */
  root?: WorkflowNode[];
}): AutomationWorkflow {
  const store = readStore();
  const ts = nowIso();
  const wf: AutomationWorkflow = {
    id: makeId(),
    name: input.name?.trim() || 'New Workflow',
    description: input.description?.trim() || '',
    status: 'draft',
    event: input.eventType ? eventFromType(input.eventType) : null,
    root: input.root ? remintIds(structuredClone(input.root)) : [],
    createdAt: ts,
    updatedAt: ts,
  };
  store.workflows[wf.id] = wf;
  writeStore(store);
  return wf;
}

export function updateWorkflow(wf: AutomationWorkflow): AutomationWorkflow {
  const store = readStore();
  const next = { ...wf, updatedAt: nowIso() };
  store.workflows[wf.id] = next;
  writeStore(store);
  return next;
}

export function deleteWorkflow(id: string): void {
  const store = readStore();
  delete store.workflows[id];
  writeStore(store);
}
