/**
 * Workflows service — hybrid persistence (localStorage `iga.workflows.v1`).
 * No seed: an empty list is valid. Load runs the legacy migration.
 */
import type { AutomationWorkflow, WorkflowEvent, WorkflowEventType, WorkflowRow } from './automation-types';
import { migrateSeq } from '@/lib/workflow-tree';

const STORE_KEY = 'iga.workflows.v1';
interface Store {
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

function readStore(): Store {
  if (!hasWindow()) return { workflows: {} };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { workflows: {} };
    const parsed = JSON.parse(raw) as Store;
    return parsed?.workflows ? parsed : { workflows: {} };
  } catch {
    return { workflows: {} };
  }
}
function writeStore(store: Store): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}
function nowIso() {
  return new Date().toISOString();
}
function makeId() {
  return `wf-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
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
}): AutomationWorkflow {
  const store = readStore();
  const ts = nowIso();
  const wf: AutomationWorkflow = {
    id: makeId(),
    name: input.name?.trim() || 'New Workflow',
    description: input.description?.trim() || '',
    status: 'draft',
    event: input.eventType ? eventFromType(input.eventType) : null,
    root: [],
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
