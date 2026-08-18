'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import StopOutlined from '@mui/icons-material/StopOutlined';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowLeft from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import PersonAddAlt from '@mui/icons-material/PersonAddAlt';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import CallSplit from '@mui/icons-material/CallSplit';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import SkipNext from '@mui/icons-material/SkipNext';
import Logout from '@mui/icons-material/Logout';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import DragIndicator from '@mui/icons-material/DragIndicator';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import AddIcon from '@mui/icons-material/Add';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import {
  Avatar,
  Button,
  StatusChip,
  Input,
  Dialog,
  Menu,
  FlowCanvas,
  SegmentedControl,
  useToast,
  type FlowNodeLike,
  type FlowInsertLoc,
  type FlowSimulation,
  type SimNodeState,
} from '@ds/components';
import { getWorkflow, updateWorkflow, WORKFLOW_EVENT_META, eventFromType } from '@/data/workflows';
import type { AutomationWorkflow, WorkflowNode, WorkflowBlockType, WorkflowBranch, WorkflowEvent, WorkflowEventType, AssignEntitiesConfig as AEConfig, UserFilterConfig as UFConfig, MultisplitConfig as MSConfig, NotificationConfig as NConfig, DelayConfig as DlyConfig, WaitForUserConfig as WFUConfig, ProvisionAccountConfig, SetAttributesConfig, ManageLicenseConfig, RevokeAccessConfig, AccountActionConfig, DelegateAccessConfig, TriggerReviewConfig } from '@/data/automation-types';
import { BLOCK_META, BLOCK_PALETTE, paletteBlocksForEvent, createBlock, insertBlock, deleteBlock, updateBlock, findBlock, allBlocks, isBlockComplete, defaultConfigFor } from '@/lib/workflow-tree';
import { countConditionRules, isConditionGroupValid } from '@/lib/policy-tree';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { UserFilterConfig } from '@/components/product/automation/UserFilterConfig';
import { AssignEntitiesConfig } from '@/components/product/automation/AssignEntitiesConfig';
import { MultisplitConfig } from '@/components/product/automation/MultisplitConfig';
import { WfConditionalConfig } from '@/components/product/automation/WfConditionalConfig';
import { NotificationConfig } from '@/components/product/automation/NotificationConfig';
import { DelayConfig } from '@/components/product/automation/DelayConfig';
import { WaitForUserConfig } from '@/components/product/automation/WaitForUserConfig';
import {
  AccountActionConfigPanel,
  DelegateAccessConfigPanel,
  ManageLicenseConfigPanel,
  ProvisionAccountConfigPanel,
  RevokeAccessConfigPanel,
  SetAttributesConfigPanel,
  TriggerReviewConfigPanel,
} from '@/components/product/automation/LifecycleOpConfig';
import { EmptyState } from '@/components/product/automation/config-kit';
import { LaneLabel, ConditionLaneLabel, SplitLaneLabel } from '@/components/product/automation/LaneLabel';
import { SingleSelectDrawer } from '@/components/product/automation/SingleSelectDrawer';
import { TestRunBanner, TestRunPanel, type TestRunPhase } from '@/components/product/automation/TestRunPanel';
import { VersionsPanel } from '@/components/product/automation/VersionsPanel';
import { ConditionPreviewChip, ConditionPreviewLabel } from '@/components/product/ConditionPreviewChip';
import { flattenRules, ruleParts } from '@/components/product/automation/condition-format';
import { listApprovalPolicies } from '@/data/approval-policies';
import { buildWorkflowTestRunPlan, type TestRunPlan } from '@/lib/workflow-test-run';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';

const EVENT_SEL = '__event__';

// Block visuals live in one module shared with the read-only preview. They used
// to be duplicated here, and duplicated they drifted: a change to how an Assign
// Entities block summarises itself reached the preview and not the canvas.
import {
  EVENT_ICONS,
  EVENT_TYPES,
  ICONS,
  PALETTE_SECTIONS,
  blockSummary,
  tileFor,
} from '@/components/product/automation/workflow-visuals';

/** Builder-only: the palette drags a block *kind*, which may be an event. */
const isEventKind = (kind: string): kind is WorkflowEventType =>
  kind === 'joiner' || kind === 'mover' || kind === 'leaver';

type Hist = { doc: AutomationWorkflow; past: AutomationWorkflow[]; future: AutomationWorkflow[] };

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();

  const [loaded, setLoaded] = React.useState(false);
  const [hist, setHist] = React.useState<Hist | null>(null);
  const [savedSnapshot, setSavedSnapshot] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'outline' | 'detailed'>('detailed');
  const [paletteOpen, setPaletteOpen] = React.useState(true);
  const [configOpen, setConfigOpen] = React.useState(true);
  const [backConfirm, setBackConfirm] = React.useState(false);
  const [removeEventConfirm, setRemoveEventConfirm] = React.useState(false);
  const [versionsOpen, setVersionsOpen] = React.useState(false);
  const [paletteTab, setPaletteTab] = React.useState<'events' | 'components'>('events');
  const [draggingKind, setDraggingKind] = React.useState<string | null>(null);
  const [policyNodeId, setPolicyNodeId] = React.useState<string | null>(null); // Assign Entities → attach policy from canvas

  const doc = hist?.doc ?? null;

  // ---- Test run (dummy simulation) ------------------------------------
  const [testPhase, setTestPhase] = React.useState<TestRunPhase>('idle');
  const [testPlan, setTestPlan] = React.useState<TestRunPlan | null>(null);
  const [testRevealed, setTestRevealed] = React.useState(0);
  const [testElapsed, setTestElapsed] = React.useState(0);
  const [testTraceIds, setTestTraceIds] = React.useState<string[]>([]);
  const [testNodeStates, setTestNodeStates] = React.useState<Record<string, SimNodeState>>({});
  const [testTone, setTestTone] = React.useState<'success' | 'danger'>('success');
  const runNonceRef = React.useRef(0);
  const timersRef = React.useRef<number[]>([]);

  const clearTestTimers = React.useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const exitTestRun = React.useCallback(() => {
    clearTestTimers();
    setTestPhase('idle');
    setTestPlan(null);
    setTestRevealed(0);
    setTestElapsed(0);
    setTestTraceIds([]);
    setTestNodeStates({});
    setTestTone('success');
  }, [clearTestTimers]);

  const startTestRun = React.useCallback(() => {
    if (!doc) return;
    clearTestTimers();
    setVersionsOpen(false);
    const want = runNonceRef.current % 2 === 0 ? 'passed' : 'failed';
    runNonceRef.current += 1;
    const plan = buildWorkflowTestRunPlan(doc.root, want);
    setTestPlan(plan);
    setTestPhase('running');
    setTestRevealed(0);
    setTestElapsed(0);
    setTestTone('success');
    setConfigOpen(true);

    const all = allBlocks(doc.root);
    const states: Record<string, SimNodeState> = { __start__: 'active' };
    for (const n of all) states[n.id] = 'pending';
    states.__end__ = 'pending';
    setTestNodeStates(states);
    setTestTraceIds(['__start__']);

    let elapsed = 0;
    let revealed = 0;
    let visitIdx = 1;

    const tickStep = () => {
      if (revealed >= plan.steps.length) {
        setTestNodeStates((prev) => {
          const next = { ...prev };
          for (const id of Object.keys(next)) {
            if (id === plan.failedNodeId) next[id] = 'failed';
            else if (next[id] === 'pending' || next[id] === 'active') {
              next[id] = plan.visitOrder.includes(id) || id === '__start__' ? 'passed' : 'skipped';
            }
          }
          if (plan.result === 'passed') next.__end__ = 'passed';
          next.__start__ = 'passed';
          return next;
        });
        setTestTraceIds(plan.visitOrder);
        setTestTone(plan.result === 'failed' ? 'danger' : 'success');
        setTestPhase('done');
        return;
      }

      const step = plan.steps[revealed];
      setTestNodeStates((prev) => {
        const next = { ...prev };
        for (const [id, st] of Object.entries(next)) {
          if (st === 'active' && id !== step.nodeId) next[id] = 'passed';
        }
        next.__start__ = 'passed';
        next[step.nodeId] = 'active';
        return next;
      });

      const at = plan.visitOrder.indexOf(step.nodeId);
      if (at >= 0) {
        visitIdx = Math.max(visitIdx, at + 1);
        setTestTraceIds(plan.visitOrder.slice(0, visitIdx));
      }

      const t = window.setTimeout(() => {
        elapsed += step.durationMs;
        setTestElapsed(elapsed);
        revealed += 1;
        setTestRevealed(revealed);
        setTestNodeStates((prev) => ({
          ...prev,
          [step.nodeId]: step.status === 'failed' ? 'failed' : 'passed',
        }));
        if (step.status === 'failed') {
          setTestTone('danger');
          setTestTraceIds(plan.visitOrder.slice(0, plan.visitOrder.indexOf(step.nodeId) + 1));
          setTestPhase('done');
          return;
        }
        tickStep();
      }, step.durationMs);
      timersRef.current.push(t);
    };

    const startBeat = window.setTimeout(tickStep, 320);
    timersRef.current.push(startBeat);
  }, [doc, clearTestTimers]);

  React.useEffect(() => () => clearTestTimers(), [clearTestTimers]);

  const simulation: FlowSimulation | undefined =
    testPhase === 'idle'
      ? undefined
      : {
          active: true,
          nodeStates: testNodeStates,
          traceNodeIds: testTraceIds,
          traceTone: testTone,
        };

  React.useEffect(() => {
    const wf = getWorkflow(params.id);
    if (wf) {
      setHist({ doc: wf, past: [], future: [] });
      setSavedSnapshot(JSON.stringify(wf));
      if (wf.event) {
        setSelectedId(EVENT_SEL);
        setPaletteTab('components');
      }
    }
    setLoaded(true);
  }, [params.id]);

  const dirty = doc != null && JSON.stringify(doc) !== savedSnapshot;
  React.useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const commit = (next: AutomationWorkflow) => setHist((h) => (h ? { doc: next, past: [...h.past, h.doc].slice(-50), future: [] } : h));
  const patchDoc = (patch: Partial<AutomationWorkflow>) => setHist((h) => (h ? { ...h, doc: { ...h.doc, ...patch } } : h));
  const undo = () => setHist((h) => (h && h.past.length ? { doc: h.past[h.past.length - 1], past: h.past.slice(0, -1), future: [h.doc, ...h.future] } : h));
  const redo = () => setHist((h) => (h && h.future.length ? { doc: h.future[0], past: [...h.past, h.doc], future: h.future.slice(1) } : h));

  const handleInsert = (loc: FlowInsertLoc, kind: string) => {
    if (!doc) return;
    if (isEventKind(kind)) {
      if (doc.event) {
        toast.error('A lifecycle event is already on the canvas');
        return;
      }
      commit({ ...doc, event: eventFromType(kind) });
      setSelectedId(EVENT_SEL);
      setPaletteTab('components');
      setConfigOpen(true);
      return;
    }
    if (!doc.event) {
      toast.error('Place a lifecycle event first');
      return;
    }
    if (!paletteBlocksForEvent(doc.event.type).includes(kind as WorkflowBlockType)) return;
    const node = createBlock(kind as WorkflowBlockType);
    commit({ ...doc, root: insertBlock(doc.root, loc, node) });
    setSelectedId(node.id);
    setConfigOpen(true);
  };
  const handleDelete = (id: string) => {
    if (!doc) return;
    commit({ ...doc, root: deleteBlock(doc.root, id) });
    if (selectedId === id) setSelectedId(null);
  };
  const removeEvent = () => {
    if (!doc) return;
    commit({ ...doc, event: null, root: [] });
    setSelectedId(null);
    setPaletteTab('events');
    setRemoveEventConfirm(false);
  };
  const requestRemoveEvent = () => {
    if (!doc?.event) return;
    if (doc.root.length > 0) setRemoveEventConfirm(true);
    else removeEvent();
  };
  const setNodeConfig = (id: string, config: Record<string, unknown> | undefined) =>
    setHist((h) => (h ? { ...h, doc: { ...h.doc, root: updateBlock(h.doc.root, id, { config }) } } : h));
  const setNodePatch = (id: string, patch: Partial<WorkflowNode>) =>
    setHist((h) => (h ? { ...h, doc: { ...h.doc, root: updateBlock(h.doc.root, id, patch) } } : h));
  /** Reset a block's config (and branches) back to its type defaults. */
  const resetBlock = (node: WorkflowNode) => {
    const fresh = createBlock(node.type);
    setNodePatch(node.id, { config: fresh.config, branches: fresh.branches });
  };

  const incomplete = doc ? allBlocks(doc.root).filter((n) => !isBlockComplete(n)) : [];
  const canActivate = Boolean(doc?.event) && incomplete.length === 0;

  const save = () => {
    if (!doc) return;
    const saved = updateWorkflow(doc);
    setHist((h) => (h ? { ...h, doc: saved } : h));
    setSavedSnapshot(JSON.stringify(saved));
    toast.success('Workflow saved');
  };
  const saveAndActivate = () => {
    if (!doc) return;
    if (!doc.event) return toast.error('Place a lifecycle event first');
    if (incomplete.length > 0) return toast.error(`${incomplete.length} block${incomplete.length > 1 ? 's' : ''} still incomplete`);
    const saved = updateWorkflow({ ...doc, status: 'active' });
    setHist((h) => (h ? { ...h, doc: saved } : h));
    setSavedSnapshot(JSON.stringify(saved));
    toast.success('Workflow activated');
  };
  /** Back goes to this workflow's detail page, not the list — the builder is
      opened from the detail, so returning to the list would skip a level. */
  const goBack = () => (dirty ? setBackConfirm(true) : router.push(`/iga/automation/workflows/${params.id}`));

  // Without this the frame falls back to a generic "Automation Details" crumb.
  // Same trail as the approval-policy builder: list → this record → the editor.
  useSetBreadcrumbs(
    doc
      ? [
          { label: 'Workflows', href: '/iga/automation/workflows' },
          { label: doc.name, href: `/iga/automation/workflows/${params.id}` },
          { label: 'Workflow builder' },
        ]
      : null,
  );

  const allowedBlocks = paletteBlocksForEvent(doc?.event?.type);
  // Grouped by section so the quick-insert menu reads like the sidebar palette.
  // Before an event is chosen there is only one group, so it stays unlabelled.
  const blockPalette = doc?.event
    ? PALETTE_SECTIONS.flatMap((section) =>
        allowedBlocks
          .filter((kind) => BLOCK_META[kind].section === section)
          .map((kind) => ({
            kind,
            label: BLOCK_META[kind].title,
            icon: React.createElement(ICONS[BLOCK_META[kind].icon] ?? FilterAltOutlined, {
              sx: { fontSize: 17 },
            }),
            section,
            tile: tileFor(section),
          })),
      )
    : EVENT_TYPES.map((type) => ({
        kind: type,
        label: WORKFLOW_EVENT_META[type].label,
        icon: React.createElement(EVENT_ICONS[type], { sx: { fontSize: 17 } }),
        tile: tileFor('Events'),
      }));

  const renderCard = (n: FlowNodeLike, { dense }: { dense: boolean }) => {
    const node = n as WorkflowNode;
    const meta = BLOCK_META[node.type];
    const Icon = ICONS[meta.icon] ?? FilterAltOutlined;
    const tile = tileFor(meta.section);
    const complete = isBlockComplete(node);
    const selected = selectedId === node.id;
    const displayTitle = node.name?.trim() || meta.title;

    // Conditional Branch renders as a rhombus (diamond) rather than a card.
    if (node.type === 'wfConditionalBranch') {
      const paths = (node.branches ?? []).filter((b) => (b as WorkflowBranch).kind === 'if' || (b as WorkflowBranch).kind === 'elseif').length;
      return (
        <div className="ds-node-in group relative flex flex-col items-center">
          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); }} className="relative grid h-[188px] w-[188px] place-items-center">
            <span style={selected ? { borderColor: tile.fg } : undefined} className={['absolute left-1/2 top-1/2 h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-2xl border bg-surface transition-all duration-150', selected ? 'shadow-sm' : 'border-border group-hover:border-border-strong'].join(' ')} />
            <span className="relative z-[1] flex w-[130px] flex-col items-center gap-1 px-1 text-center">
              <span className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: tile.bg, color: tile.fg }}><Icon sx={{ fontSize: 18 }} /></span>
              <span className="text-body-sm-medium leading-tight text-text-primary">{displayTitle}</span>
              <span className="text-caption leading-tight text-text-secondary">{paths} condition{paths !== 1 ? 's' : ''}</span>
              {complete ? (
                <CheckCircleOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-success-fg)' }} titleAccess="Complete" />
              ) : (
                <WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-warning-fg)' }} titleAccess="Incomplete" />
              )}
            </span>
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }} aria-label={`Delete ${meta.title}`} className="absolute right-8 top-8 z-10 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid">
            <CloseIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      );
    }

    // Assign Entities — a structured block: criteria header · selection · attach-policy.
    if (node.type === 'assignEntities') {
      const c = (node.config as AEConfig | undefined) ?? { entitlements: [], technicalRoles: [], businessRoles: [] };
      const entCount = (c.entitlements?.length ?? 0) + (c.technicalRoles?.length ?? 0) + (c.businessRoles?.length ?? 0);
      const critRules = c.criteria ? flattenRules(c.criteria) : [];
      const critValid = c.criteria ? isConditionGroupValid(c.criteria) : false;
      // Birthright policies count separately: "3 entities" would misdescribe a
      // bundle that stands in for a dozen grants.
      const brCount = c.birthrightPolicies?.length ?? 0;
      const entParts = [
        entCount ? `${entCount} entit${entCount > 1 ? 'ies' : 'y'}` : null,
        brCount ? `${brCount} birthright polic${brCount > 1 ? 'ies' : 'y'}` : null,
      ].filter(Boolean);
      const entSummary = entParts.length
        ? `${entParts.join(' · ')}${c.approvalPolicyName ? ` · ${c.approvalPolicyName}` : ''}`
        : 'Nothing selected yet';
      return (
        <div className="ds-node-in group relative flex flex-col items-center">
          {/* outer container with a legend pill */}
          <div
            style={{ backgroundColor: 'color-mix(in srgb, var(--ds-color-background-subtle) 40%, transparent)', ...(selected ? { borderColor: tile.fg } : {}) }}
            className={['relative w-[340px] rounded-2xl border p-2.5 transition-all duration-150', selected ? 'shadow-sm' : 'border-border group-hover:border-border-strong group-hover:shadow-sm'].join(' ')}
          >
            {/* card 1 — criteria + entities */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <span className="shrink-0 text-micro uppercase tracking-wide text-text-tertiary">Criteria</span>
                <span className="inline-flex min-w-0 items-center gap-1 rounded-pill bg-subtle px-2 py-0.5 text-caption text-text-secondary">
                  <TuneOutlined sx={{ fontSize: 13 }} className="shrink-0" />
                  {critValid ? <ConditionPreviewLabel {...ruleParts(critRules[0])} /> : <span className="truncate">No additional criteria</span>}
                </span>
                {critValid && critRules.length > 1 && <span className="shrink-0 rounded-pill bg-subtle px-1.5 py-0.5 text-caption-medium text-text-secondary">+{critRules.length - 1}</span>}
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}><Icon sx={{ fontSize: 18 }} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-body-medium leading-tight text-text-primary">{displayTitle}</span>
                    {complete ? <CheckCircleOutlined sx={{ fontSize: 15, color: 'var(--ds-color-status-success-fg)' }} /> : <WarningAmberOutlined sx={{ fontSize: 15, color: 'var(--ds-color-status-warning-fg)' }} />}
                  </span>
                  <span className="mt-0.5 block truncate text-caption text-text-secondary">{entSummary}</span>
                </span>
              </button>
              {/* assigned items — grouped sections (detailed) or one compact row (outline) */}
              {entCount > 0 && (() => {
                const sections = [
                  { key: 'ent', label: 'Applications & Entitlements', items: c.entitlements ?? [] },
                  { key: 'br', label: 'Business Roles', items: c.businessRoles ?? [] },
                  { key: 'tr', label: 'Technical Roles', items: c.technicalRoles ?? [] },
                ].filter((s) => s.items.length > 0);
                // Entitlements (have an appName) render as an app-badge chip, matching the
                // SoD resolution "Needs Decision" access chip; roles stay plain text chips.
                const chip = (item: { id: string; name: string; appName?: string }) =>
                  item.appName ? (
                    <span key={item.id} className="inline-flex max-w-[170px] items-center gap-1 rounded-md border border-border bg-subtle py-1 pl-1 pr-2 text-caption">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-surface text-micro text-text-secondary">{item.appName.charAt(0).toUpperCase()}</span>
                      <span className="truncate">
                        <span className="text-text-tertiary">{item.appName}</span> <span className="font-emphasis text-text-primary">{item.name}</span>
                      </span>
                    </span>
                  ) : (
                    <span key={item.id} className="inline-flex max-w-[140px] items-center rounded-md border border-border bg-subtle px-2 py-1 text-caption-strong text-text-primary">
                      <span className="truncate">{item.name}</span>
                    </span>
                  );
                const more = (n: number) => <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-subtle px-1.5 py-1 text-caption-strong text-text-secondary">+{n}</span>;
                const open = (e: React.MouseEvent | React.KeyboardEvent) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); };
                return (
                  <div role="button" tabIndex={0} onClick={open} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } }} className="cursor-pointer focus-visible:outline-none">
                    {dense ? (
                      (() => {
                        const all = [...(c.entitlements ?? []), ...(c.businessRoles ?? []), ...(c.technicalRoles ?? [])];
                        return (
                          <div className="flex items-center gap-1.5 overflow-hidden border-t border-border px-3 py-2">
                            {all.slice(0, 3).map((it) => chip(it))}
                            {all.length > 3 && more(all.length - 3)}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="px-3 pb-3">
                        <div className="rounded-lg border border-border">
                          {sections.map((s, i) => (
                            <div key={s.key} className={[i > 0 ? 'border-t border-border' : '', 'px-3 py-2.5'].join(' ')}>
                              <div className="mb-1.5 text-micro uppercase tracking-wide text-text-tertiary">{s.label}</div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {s.items.slice(0, 3).map((it) => chip(it))}
                                {s.items.length > 3 && more(s.items.length - 3)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* card 2 — approval policy */}
            <div className="mt-2 rounded-lg border border-border bg-surface">
              {c.approvalPolicyId ? (
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setPolicyNodeId(node.id); }} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand"><ShieldOutlined sx={{ fontSize: 17 }} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-medium text-text-primary">{c.approvalPolicyName}</span>
                      <span className="block text-caption text-text-secondary">Approval policy</span>
                    </span>
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setNodeConfig(node.id, { ...c, approvalPolicyId: undefined, approvalPolicyName: undefined }); }} aria-label="Remove approval policy" className="shrink-0 rounded-md p-1 text-icon transition-colors hover:text-danger">
                    <DeleteOutline sx={{ fontSize: 17 }} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={(e) => { e.stopPropagation(); setPolicyNodeId(node.id); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-dashed border-border text-icon"><AddIcon sx={{ fontSize: 17 }} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-medium text-text-primary">Attach Approval Policy</span>
                    <span className="block text-caption text-text-secondary">Optional · click to select</span>
                  </span>
                </button>
              )}
            </div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }} aria-label="Delete Assign Entities" className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid">
            <CloseIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      );
    }

    // Flow-control blocks (Skip / Exit / Delay / Wait for user) render as a compact
    // pill: icon tile + title. Delay / Wait for user also show a summary to the right.
    if (node.type === 'skip' || node.type === 'exit' || node.type === 'delay' || node.type === 'waitForUser') {
      let sideLabel: string | null = null;
      if (node.type === 'delay') {
        const d = node.config as DlyConfig | undefined;
        const parts = [d?.days && `${d.days}d`, d?.hours && `${d.hours}h`, d?.minutes && `${d.minutes}m`].filter(Boolean);
        sideLabel = parts.length ? parts.join(' ') : 'Not set';
      } else if (node.type === 'waitForUser') {
        const w = node.config as WFUConfig | undefined;
        const parts = [w?.days && `${w.days}d`, w?.hours && `${w.hours}h`, w?.minutes && `${w.minutes}m`].filter(Boolean);
        if (!w || !parts.length || w.connectionIds.length < 1) {
          sideLabel = 'Not set';
        } else {
          const tries = w.unlimitedRetries ? '∞' : `${w.maxRetries} tries`;
          sideLabel = `Every ${parts.join(' ')} · ${tries} · ${w.connectionIds.length} app${w.connectionIds.length === 1 ? '' : 's'}`;
        }
      }
      return (
        <div className="ds-node-in group relative flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); }}
            style={selected ? { borderColor: tile.fg } : undefined}
            className={['inline-flex max-w-[360px] items-center gap-2.5 rounded-pill border bg-surface px-4 py-2 text-left transition-all duration-150', selected ? 'shadow-sm' : 'border-border hover:border-border-strong hover:shadow-sm'].join(' ')}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}><Icon sx={{ fontSize: 16 }} /></span>
            <span className="shrink-0 text-body-medium text-text-primary">{displayTitle}</span>
            {sideLabel && (
              <span className={['min-w-0 truncate text-body-sm-strong', sideLabel === 'Not set' ? 'text-text-tertiary' : 'text-text-secondary'].join(' ')}>{sideLabel}</span>
            )}
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }} aria-label={`Delete ${meta.title}`} className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid">
            <CloseIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      );
    }

    // User Filter — ONE card: the header stays exactly as the standard card, and in
    // detailed view a conditions box is added below it inside the same card.
    if (node.type === 'userFilter') {
      const cond = (node.config as UFConfig | undefined)?.condition;
      const rules = cond ? flattenRules(cond).filter((r) => Boolean(r.attribute)) : [];
      return (
        <div className="ds-node-in group relative flex flex-col items-center">
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); } }}
            style={selected ? { borderColor: tile.fg } : undefined}
            className={['w-[320px] cursor-pointer overflow-hidden rounded-xl border bg-surface text-left transition-all duration-150 focus-visible:outline-none', selected ? 'shadow-sm' : 'border-border group-hover:border-border-strong group-hover:shadow-sm'].join(' ')}
          >
            {/* header — identical to the standard card */}
            <div className="flex w-full items-center gap-3 px-4 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}><Icon sx={{ fontSize: 18 }} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-medium leading-tight text-text-primary">{displayTitle}</span>
                <span className="mt-1 block truncate text-caption leading-tight text-text-secondary">{blockSummary(node)}</span>
              </span>
              {complete ? (
                <CheckCircleOutlined sx={{ fontSize: 17, color: 'var(--ds-color-status-success-fg)' }} titleAccess="Complete" />
              ) : (
                <WarningAmberOutlined sx={{ fontSize: 17, color: 'var(--ds-color-status-warning-fg)' }} titleAccess="Incomplete" />
              )}
            </div>
            {/* conditions box — only when at least one rule has an attribute */}
            {!dense && cond && rules.length > 0 && (
              <div className="px-4 pb-4">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2.5">
                  {rules.map((r, i) => (
                    <React.Fragment key={r.id}>
                      {i > 0 && (
                        <span className="inline-flex shrink-0 items-center rounded-md bg-[var(--ds-color-status-info-subtle)] px-2 py-1 text-caption-strong uppercase tracking-wide text-[var(--ds-color-status-info-fg)]">
                          {cond.combinator}
                        </span>
                      )}
                      <ConditionPreviewChip {...ruleParts(r)} />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }} aria-label={`Delete ${meta.title}`} className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid">
            <CloseIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      );
    }

    return (
      <div className="ds-node-in group relative flex flex-col items-center">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); }}
          style={selected ? { borderColor: tile.fg } : undefined}
          className={['flex w-[320px] items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-left transition-all duration-150', selected ? 'shadow-sm' : 'border-border hover:border-border-strong hover:shadow-sm'].join(' ')}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}><Icon sx={{ fontSize: 18 }} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-medium leading-tight text-text-primary">{displayTitle}</span>
            {(!dense || node.type === 'multisplitBranch' || node.type === 'notification') && <span className="mt-1 block truncate text-caption leading-tight text-text-secondary">{blockSummary(node)}</span>}
          </span>
          {complete ? (
            <CheckCircleOutlined sx={{ fontSize: 17, color: 'var(--ds-color-status-success-fg)' }} titleAccess="Complete" />
          ) : (
            <WarningAmberOutlined sx={{ fontSize: 17, color: 'var(--ds-color-status-warning-fg)' }} titleAccess="Incomplete" />
          )}
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }} aria-label={`Delete ${meta.title}`} className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid">
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
      </div>
    );
  };

  const eventCard = () => {
    if (!doc?.event) return null;
    const selected = selectedId === EVENT_SEL;
    const EventIcon = EVENT_ICONS[doc.event.type];
    return (
      <div className="ds-node-in group relative flex flex-col items-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(EVENT_SEL);
            setConfigOpen(true);
          }}
          className={[
            'flex w-[320px] items-center gap-3 rounded-lg border bg-surface px-4 py-3 text-left transition-shadow',
            selected ? 'border-brand shadow-sm ring-2 ring-brand-subtle' : 'border-border hover:shadow-sm',
          ].join(' ')}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
            <EventIcon sx={{ fontSize: 18 }} />
          </span>
          <span className="min-w-0 flex-1">
            {/* Context card, same role as the policy card in the approval builder —
                one weight step below the steps it introduces. */}
            <span className="block truncate text-body-medium text-text-primary">
              {doc.event.label}
            </span>
            <span className="mt-0.5 block truncate text-caption text-text-secondary">
              {doc.event.description || 'Configure this event'}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            requestRemoveEvent();
          }}
          aria-label={`Remove ${doc.event.label}`}
          className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid"
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
      </div>
    );
  };

  if (loaded && !doc) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-canvas">
        <div className="text-center">
          <div className="text-h5 text-text-primary">Workflow not found</div>
          <div className="mt-4"><Button variant="secondary" onClick={() => router.push('/iga/automation/workflows')}>Back to Workflows</Button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-canvas px-5 py-2.5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={goBack} aria-label="Back to workflow details" className="grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover"><ArrowBackOutlined sx={{ fontSize: 20 }} /></button>
          <Avatar name={doc?.name ?? 'Workflow'} initials={(doc?.name ?? 'W').charAt(0).toUpperCase()} size="sm" />
          {/* Name owns the title weight; version is a qualifier — same baseline, quieter
              type and colour — so “Version 1” never competes with the workflow name.
              Matches the approval-policy builder exactly. */}
          <span className="flex min-w-0 items-baseline">
            <span className="truncate text-h5 text-text-primary">{doc?.name ?? '…'}</span>
            {doc && (
              <>
                <span className="mx-1.5 shrink-0 text-body text-text-disabled" aria-hidden>
                  –
                </span>
                <span className="shrink-0 text-body text-text-tertiary">Version 1</span>
              </>
            )}
          </span>
          {doc && <StatusChip intent={doc.status === 'active' ? 'success' : 'neutral'} label={doc.status === 'active' ? 'Active' : 'Draft'} />}
          {dirty && <span className="text-caption text-text-tertiary">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            startIcon={testPhase === 'running' ? <StopOutlined /> : <PlayArrowOutlined />}
            onClick={() => {
              if (testPhase === 'running') exitTestRun();
              else startTestRun();
            }}
            disabled={!doc || !doc.event || (doc.root?.length ?? 0) === 0}
            title={
              !doc?.event
                ? 'Add a lifecycle event before running a test'
                : !doc?.root?.length
                  ? 'Add steps before running a test'
                  : undefined
            }
          >
            {testPhase === 'running' ? 'Stop' : testPhase === 'done' ? 'Run again' : 'Test run'}
          </Button>
          <Button
            variant="secondary"
            startIcon={<HistoryOutlined />}
            onClick={() => {
              if (versionsOpen) {
                setVersionsOpen(false);
                return;
              }
              if (testPhase !== 'idle') exitTestRun();
              setVersionsOpen(true);
              setConfigOpen(true);
            }}
          >
            Versions
          </Button>
          <Button variant="secondary" startIcon={<SaveOutlined />} onClick={save} disabled={!dirty}>Save</Button>
          <Button startIcon={<CheckCircleOutlined />} onClick={saveAndActivate} disabled={!canActivate} title={!doc?.event ? 'Event required' : incomplete.length ? `${incomplete.length} blocks incomplete` : undefined}>Save &amp; Activate</Button>
          <Menu items={[{ label: 'Duplicate (soon)', onClick: () => toast.info('Coming soon') }, { label: 'Export JSON (soon)', onClick: () => toast.info('Coming soon') }]} />
        </div>
      </div>

      {testPhase !== 'idle' && (
        <TestRunBanner
          phase={testPhase}
          result={testPlan?.result}
          onExit={exitTestRun}
          onStop={exitTestRun}
        />
      )}

      <div className="flex min-h-0 flex-1">
        {/* palette */}
        {paletteOpen ? (
          <div className="flex w-[248px] shrink-0 flex-col border-r border-border bg-surface">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-3">
              <SegmentedControl
                fullWidth
                size="sm"
                ariaLabel="Palette category"
                value={paletteTab}
                onChange={setPaletteTab}
                options={[
                  { value: 'events', label: 'Events' },
                  { value: 'components', label: 'Components' },
                ]}
              />
              <button type="button" onClick={() => setPaletteOpen(false)} aria-label="Collapse palette" className="grid h-6 w-6 shrink-0 place-items-center rounded text-icon hover:bg-surface-hover"><KeyboardDoubleArrowLeft sx={{ fontSize: 18 }} /></button>
            </div>
            <div className="ds-scroll flex-1 overflow-y-auto px-3 pb-4 pt-3">
              {paletteTab === 'events' ? (
                <div>
                  <p className="mb-2 px-1 text-caption leading-4 text-text-secondary">
                    {doc?.event
                      ? 'Remove the event from the canvas to choose a different lifecycle trigger.'
                      : 'Drop an event first to start adding components.'}
                  </p>
                  <div className="space-y-2">
                    {EVENT_TYPES.map((type) => {
                      const Icon = EVENT_ICONS[type];
                      const tile = tileFor('Events');
                      const disabled = Boolean(doc?.event);
                      return (
                        <div
                          key={type}
                          draggable={!disabled}
                          onDragStart={(e) => {
                            if (disabled) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData('text/kind', type);
                            setDraggingKind(type);
                          }}
                          onDragEnd={() => setDraggingKind(null)}
                          aria-disabled={disabled}
                          className={[
                            'group flex items-center gap-2.5 rounded-lg border border-border bg-canvas px-2.5 py-2 text-body-sm-strong text-text-primary transition-all',
                            disabled
                              ? 'cursor-not-allowed opacity-50'
                              : 'cursor-grab hover:border-border-strong hover:shadow-sm active:cursor-grabbing',
                          ].join(' ')}
                        >
                          <span
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
                            style={{ backgroundColor: tile.bg, color: tile.fg }}
                          >
                            <Icon sx={{ fontSize: 17 }} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {WORKFLOW_EVENT_META[type].label}
                          </span>
                          {!disabled && (
                            <DragIndicator
                              className="shrink-0 text-text-disabled opacity-60 transition-opacity group-hover:opacity-100"
                              sx={{ fontSize: 16 }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  {!doc?.event && (
                    <p className="mb-2 px-1 text-caption leading-4 text-text-secondary">
                      Place a lifecycle event before adding components.
                    </p>
                  )}
                  {PALETTE_SECTIONS.map((section) => {
                    const visibleBlocks = doc?.event ? allowedBlocks : BLOCK_PALETTE;
                    const kinds = visibleBlocks.filter((k) => BLOCK_META[k].section === section);
                    if (kinds.length === 0) return null;
                    return (
                      <div key={section} className="mb-3">
                        <div className="mb-1.5 px-1 text-caption-strong uppercase tracking-wide text-text-tertiary">
                          {section}
                        </div>
                        <div className="space-y-2">
                          {kinds.map((kind) => {
                            const Icon = ICONS[BLOCK_META[kind].icon] ?? FilterAltOutlined;
                            const tile = tileFor(section);
                            const enabled = Boolean(doc?.event);
                            return (
                              <div
                                key={kind}
                                draggable={enabled}
                                onDragStart={(e) => {
                                  if (!enabled) {
                                    e.preventDefault();
                                    return;
                                  }
                                  e.dataTransfer.setData('text/kind', kind);
                                  setDraggingKind(kind);
                                }}
                                onDragEnd={() => setDraggingKind(null)}
                                aria-disabled={!enabled}
                                className={[
                                  'group flex items-center gap-2.5 rounded-lg border border-border bg-canvas px-2.5 py-2 text-body-sm-strong text-text-primary transition-all',
                                  enabled
                                    ? 'cursor-grab hover:border-border-strong hover:shadow-sm active:cursor-grabbing'
                                    : 'cursor-not-allowed opacity-50',
                                ].join(' ')}
                              >
                                <span
                                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
                                  style={{ backgroundColor: tile.bg, color: tile.fg }}
                                >
                                  <Icon sx={{ fontSize: 17 }} />
                                </span>
                                <span className="min-w-0 flex-1 truncate">{BLOCK_META[kind].title}</span>
                                {enabled && (
                                  <DragIndicator
                                    className="shrink-0 text-text-disabled opacity-60 transition-opacity group-hover:opacity-100"
                                    sx={{ fontSize: 16 }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex w-11 shrink-0 flex-col items-center border-r border-border bg-surface pt-3">
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Expand palette" className="grid h-7 w-7 place-items-center rounded text-icon hover:bg-surface-hover"><KeyboardDoubleArrowRight sx={{ fontSize: 18 }} /></button>
          </div>
        )}

        {/* canvas */}
        <div className="min-w-0 flex-1">
          {doc && (
            <FlowCanvas
              root={doc.root}
              renderCard={renderCard}
              headerCard={doc.event ? eventCard : undefined}
              palette={blockPalette}
              onInsert={handleInsert}
              renderBranchLabel={(b, n) => {
                const br = b as unknown as WorkflowBranch;
                const openParent = () => { setSelectedId((n as WorkflowNode).id); setConfigOpen(true); };
                if (br.kind === 'if' || br.kind === 'elseif') { return <ConditionLaneLabel label={br.label} group={br.condition} onOpen={openParent} />; }
                if (br.kind === 'split') { return <SplitLaneLabel label={br.label} matchValues={br.matchValues} onOpen={openParent} />; }
                return <LaneLabel text={br.label} onOpen={openParent} />;
              }}
              onClearSelection={() => setSelectedId(null)}
              view={view}
              onViewChange={setView}
              onUndo={undo}
              onRedo={redo}
              canUndo={(hist?.past.length ?? 0) > 0}
              canRedo={(hist?.future.length ?? 0) > 0}
              emptyHint={doc.event ? 'Add component' : 'Drop lifecycle event'}
              draggingKind={testPhase === 'idle' ? draggingKind : null}
              isTerminal={(n) => (n as WorkflowNode).type === 'exit'}
              readOnly={testPhase !== 'idle'}
              simulation={simulation}
            />
          )}
        </div>

        {/* right rail — Test Run, Versions, or Configuration (one at a time) */}
        {testPhase !== 'idle' ? (
          <TestRunPanel
            phase={testPhase}
            plan={testPlan}
            revealedCount={testRevealed}
            elapsedMs={testElapsed}
            onRunAgain={startTestRun}
            onExit={exitTestRun}
          />
        ) : versionsOpen ? (
          <VersionsPanel doc={doc} onClose={() => setVersionsOpen(false)} />
        ) : configOpen ? (
          <WfConfigPanel
            doc={doc}
            selectedId={selectedId}
            onCollapse={() => setConfigOpen(false)}
            onPatchEvent={(patch) => doc?.event && patchDoc({ event: { ...doc.event, ...patch } })}
            onConfig={setNodeConfig}
            onPatchNode={setNodePatch}
            onReset={resetBlock}
            onSave={save}
          />
        ) : (
          <div className="flex w-11 shrink-0 flex-col items-center border-l border-border bg-surface pt-3">
            <button type="button" onClick={() => setConfigOpen(true)} aria-label="Expand configuration" className="grid h-7 w-7 place-items-center rounded text-icon hover:bg-surface-hover"><KeyboardDoubleArrowLeft sx={{ fontSize: 18 }} /></button>
          </div>
        )}
      </div>

      <Dialog open={backConfirm} onClose={() => setBackConfirm(false)} title="Discard unsaved changes?" tone="danger" confirmLabel="Discard" cancelLabel="Keep editing" onConfirm={() => router.push(`/iga/automation/workflows/${params.id}`)}>
        You have unsaved changes to this workflow. Leaving now will discard them.
      </Dialog>
      <Dialog
        open={removeEventConfirm}
        onClose={() => setRemoveEventConfirm(false)}
        title="Remove lifecycle event?"
        tone="danger"
        confirmLabel="Remove event"
        cancelLabel="Cancel"
        onConfirm={removeEvent}
      >
        Removing the event will also clear all components on the canvas.
      </Dialog>
      {/* Attach-policy drawer opened from an Assign Entities block on the canvas. */}
      {policyNodeId && doc && (() => {
        const n = findBlock(doc.root, policyNodeId);
        const cfg = (n?.config as AEConfig | undefined) ?? { entitlements: [], technicalRoles: [], businessRoles: [] };
        const active = listApprovalPolicies().filter((p) => p.status === 'active');
        return (
          <SingleSelectDrawer
            open
            onClose={() => setPolicyNodeId(null)}
            title="Attach Approval Policy"
            subtitle={active.length ? 'Only active policies can be attached.' : undefined}
            items={active.map((p) => ({ id: p.id, primary: p.policyName, secondary: p.description || 'Approval policy' }))}
            selectedId={cfg.approvalPolicyId}
            onSelect={(id) => {
              const p = active.find((x) => x.id === id);
              setNodeConfig(policyNodeId, { ...cfg, approvalPolicyId: id, approvalPolicyName: p?.policyName });
            }}
          />
        );
      })()}
    </div>
  );
}

function WfConfigPanel({
  doc,
  selectedId,
  onCollapse,
  onPatchEvent,
  onConfig,
  onPatchNode,
  onReset,
  onSave,
}: {
  doc: AutomationWorkflow | null;
  selectedId: string | null;
  onCollapse: () => void;
  onPatchEvent: (patch: Partial<WorkflowEvent>) => void;
  onConfig: (id: string, config: Record<string, unknown> | undefined) => void;
  onPatchNode: (id: string, patch: Partial<WorkflowNode>) => void;
  onReset: (node: WorkflowNode) => void;
  onSave: () => void;
}) {
  const isEvent = selectedId === EVENT_SEL;
  const node = doc && selectedId && selectedId !== EVENT_SEL ? findBlock(doc.root, selectedId) : null;
  const title = isEvent ? 'Event' : node ? BLOCK_META[node.type].title : 'Configuration';
  const complete = node ? isBlockComplete(node) : true;

  return (
    <div className="flex w-[364px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        {node ? (
          <input
            value={node.name ?? BLOCK_META[node.type].title}
            placeholder={BLOCK_META[node.type].title}
            onChange={(e) => onPatchNode(node.id, { name: e.target.value })}
            aria-label="Block name"
            title="Rename this block"
            className="-ml-1 min-w-0 max-w-full truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-body-sm-strong text-text-primary placeholder:text-text-primary transition-colors [field-sizing:content] hover:border-border focus:border-brand focus:outline-none"
          />
        ) : (
          <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{title}</span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {node && (complete ? <StatusChip intent="success" label="Configured" /> : <StatusChip intent="warning" label="Incomplete" />)}
          {isEvent && doc?.event && <StatusChip intent="info" label={WORKFLOW_EVENT_META[doc.event.type].label} />}
          <button type="button" onClick={onCollapse} aria-label="Collapse configuration" className="grid h-6 w-6 place-items-center rounded text-icon hover:bg-surface-hover"><KeyboardDoubleArrowRight sx={{ fontSize: 18 }} /></button>
        </div>
      </div>

      <div className="ds-scroll flex-1 overflow-y-auto p-4">
        {isEvent && (
          <div className="space-y-4">
            {doc?.event ? (
              <>
                <div>
                  <div className="mb-1.5 text-body-sm-strong text-text-primary">Event type</div>
                  <p className="text-body-sm text-text-secondary">
                    {WORKFLOW_EVENT_META[doc.event.type].label} — placed from the Events palette.
                  </p>
                </div>
                <Input label="Event name" size="sm" value={doc.event.label} onChange={(e) => onPatchEvent({ label: e.target.value })} />
                <Input label="Description" size="sm" multiline minRows={3} value={doc.event.description} onChange={(e) => onPatchEvent({ description: e.target.value })} />
              </>
            ) : (
              <EmptyState
                icon={<PersonAddAlt sx={{ fontSize: 22 }} />}
                title="No event yet"
                message="Drag Joiner, Mover, or Leaver from the Events palette onto the canvas."
              />
            )}
          </div>
        )}
        {node && (
          <div className="space-y-4">
            {node.type === 'userFilter' && <UserFilterConfig config={(node.config as unknown as UFConfig) ?? (defaultConfigFor('userFilter') as unknown as UFConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'assignEntities' && <AssignEntitiesConfig config={(node.config as unknown as AEConfig) ?? (defaultConfigFor('assignEntities') as unknown as AEConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'notification' && <NotificationConfig config={(node.config as unknown as NConfig) ?? (defaultConfigFor('notification') as unknown as NConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'multisplitBranch' && <MultisplitConfig node={node} onPatchNode={(patch) => onPatchNode(node.id, patch)} />}
            {node.type === 'wfConditionalBranch' && <WfConditionalConfig node={node} onPatchNode={(patch) => onPatchNode(node.id, patch)} />}
            {node.type === 'delay' && <DelayConfig config={(node.config as unknown as DlyConfig) ?? (defaultConfigFor('delay') as unknown as DlyConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'waitForUser' && <WaitForUserConfig config={(node.config as unknown as WFUConfig) ?? (defaultConfigFor('waitForUser') as unknown as WFUConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {/* Lifecycle operations. Each reads its own config with the shared
                default as the fallback, so a node saved before its config existed
                still opens rather than throwing on undefined. */}
            {node.type === 'provisionAccount' && <ProvisionAccountConfigPanel config={(node.config as unknown as ProvisionAccountConfig) ?? (defaultConfigFor('provisionAccount') as unknown as ProvisionAccountConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'setAttributes' && <SetAttributesConfigPanel config={(node.config as unknown as SetAttributesConfig) ?? (defaultConfigFor('setAttributes') as unknown as SetAttributesConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'manageLicense' && <ManageLicenseConfigPanel config={(node.config as unknown as ManageLicenseConfig) ?? (defaultConfigFor('manageLicense') as unknown as ManageLicenseConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'revokeAccess' && <RevokeAccessConfigPanel config={(node.config as unknown as RevokeAccessConfig) ?? (defaultConfigFor('revokeAccess') as unknown as RevokeAccessConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'accountAction' && <AccountActionConfigPanel config={(node.config as unknown as AccountActionConfig) ?? (defaultConfigFor('accountAction') as unknown as AccountActionConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'delegateAccess' && <DelegateAccessConfigPanel config={(node.config as unknown as DelegateAccessConfig) ?? (defaultConfigFor('delegateAccess') as unknown as DelegateAccessConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {node.type === 'triggerReview' && <TriggerReviewConfigPanel config={(node.config as unknown as TriggerReviewConfig) ?? (defaultConfigFor('triggerReview') as unknown as TriggerReviewConfig)} onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)} />}
            {(node.type === 'skip' || node.type === 'exit') && (
              <EmptyState
                icon={<TaskAltOutlined sx={{ fontSize: 22 }} />}
                title={BLOCK_META[node.type].title}
                message={node.type === 'skip' ? 'Skips ahead toward the merge point. No configuration needed.' : 'Ends this branch. No configuration needed.'}
              />
            )}
          </div>
        )}
        {!isEvent && !node && (
          <EmptyState
            icon={<TaskAltOutlined sx={{ fontSize: 22 }} />}
            title="Nothing selected"
            message="Select the event or a block on the canvas to configure it."
          />
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3">
        {node && (
          <Button variant="secondary" onClick={() => onReset(node)}>
            Reset
          </Button>
        )}
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
}
