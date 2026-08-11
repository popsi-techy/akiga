'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import KeyboardDoubleArrowLeft from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import MailOutline from '@mui/icons-material/MailOutline';
import CallSplit from '@mui/icons-material/CallSplit';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import SkipNext from '@mui/icons-material/SkipNext';
import Logout from '@mui/icons-material/Logout';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import DragIndicator from '@mui/icons-material/DragIndicator';
import {
  Avatar,
  Button,
  StatusChip,
  Input,
  Drawer,
  Dialog,
  Menu,
  FlowCanvas,
  useToast,
  type FlowNodeLike,
  type FlowInsertLoc,
} from '@ds/components';
import { getApprovalPolicy, updateApprovalPolicy } from '@/data/approval-policies';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  APPROVER_TYPE_LABEL,
  type ApprovalPolicy,
  type PolicyNode,
  type PolicyNodeType,
  type ApprovalLevelConfig as ALConfig,
  type NotificationConfig as NConfig,
} from '@/data/automation-types';
import { getUser, getGovernanceGroup } from '@/data/directory';
import { defaultNotificationConfig } from '@/data/notification-templates';
import {
  NODE_META,
  PALETTE_ORDER,
  createNode,
  insertNode,
  deleteNode,
  updateNode,
  findNode,
  allNodes,
  isNodeComplete,
  defaultConfig,
  reconcileOutcomes,
  laneBranches,
} from '@/lib/policy-tree';
import type { ParallelConfig, PolicyBranch } from '@/data/automation-types';
import { ApprovalLevelConfig } from '@/components/product/automation/ApprovalLevelConfig';
import { NotificationConfig } from '@/components/product/automation/NotificationConfig';
import { ConditionalBranchConfig } from '@/components/product/automation/ConditionalBranchConfig';
import { ParallelBranchConfig } from '@/components/product/automation/ParallelBranchConfig';
import { EmptyState } from '@/components/product/automation/config-kit';
import { LaneLabel, ConditionLaneLabel, ParallelLaneLabel, AutoResolveBody, OUTCOME_TONE } from '@/components/product/automation/LaneLabel';

/** One-line summary shown on a node card. */
function slaLabel(sla?: ALConfig['sla']): string {
  if (!sla) return '';
  const parts: string[] = [];
  if (sla.days) parts.push(`${sla.days}d`);
  if (sla.hours) parts.push(`${sla.hours}h`);
  if (sla.minutes) parts.push(`${sla.minutes}m`);
  return parts.join(' ');
}
function nodeSummary(node: PolicyNode): string {
  if (node.type === 'conditionalBranch') {
    const paths = (node.branches ?? []).filter((b) => b.kind === 'if' || b.kind === 'elseif').length;
    return `${paths} condition path${paths === 1 ? '' : 's'} + fallback`;
  }
  if (node.type === 'parallelBranch') {
    const c = node.config as ParallelConfig | undefined;
    const n = c?.lanes.length ?? 0;
    return `${n} parallel approver${n === 1 ? '' : 's'}`;
  }
  if (node.type === 'approvalLevel') {
    const c = node.config as ALConfig | undefined;
    if (!c?.approverType) return 'No approver selected';
    let who = APPROVER_TYPE_LABEL[c.approverType];
    if (c.approverType === 'governanceGroup') who = getGovernanceGroup(c.governanceGroupId ?? '')?.name ?? who;
    else if (c.approverType === 'user') who = getUser(c.userId ?? '')?.name ?? who;
    const sla = slaLabel(c.sla);
    return sla ? `${who} · SLA ${sla}` : who;
  }
  if (node.type === 'notification') {
    const c = node.config as NConfig | undefined;
    const on = [c?.email.enabled && 'Email', c?.slack.enabled && 'Slack'].filter(Boolean);
    return on.length ? on.join(' + ') : 'No channels enabled';
  }
  return NODE_META[node.type].title;
}

const POLICY_SEL = '__policy__';

const ICONS: Record<string, React.ComponentType<{ sx?: object }>> = {
  person: PersonOutline,
  mail: MailOutline,
  call_split: CallSplit,
  account_tree: AccountTreeOutlined,
  skip_next: SkipNext,
  logout: Logout,
};

/** Icon-tile colors grouped by palette section (decorative — categorical, not text). */
const SECTION_TILE: Record<string, { bg: string; fg: string }> = {
  Tasks: { bg: '#E8F1FE', fg: '#2E7CF6' }, //         blue
  Branching: { bg: '#FFF1E3', fg: '#F59E0B' }, //     amber
  'Flow Control': { bg: '#E4F6EF', fg: '#0EA47A' }, // teal
};
const tileFor = (section: string) => SECTION_TILE[section] ?? { bg: 'var(--ds-color-surface-hover)', fg: 'var(--ds-color-icon-default)' };
/** Section order — shared by the sidebar palette and the canvas quick-insert menu. */
const PALETTE_SECTIONS = ['Tasks', 'Branching', 'Flow Control'] as const;

type Hist = { doc: ApprovalPolicy; past: ApprovalPolicy[]; future: ApprovalPolicy[] };

export default function ApprovalPolicyBuilderPage() {
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
  const [versionsOpen, setVersionsOpen] = React.useState(false);
  const [draggingKind, setDraggingKind] = React.useState<string | null>(null);

  const doc = hist?.doc ?? null;
  /** The builder is opened from a policy's detail page, so back returns there. */
  const detailHref = `/iga/automation/approval-policies/${params.id}`;

  React.useEffect(() => {
    const p = getApprovalPolicy(params.id);
    if (p) {
      setHist({ doc: p, past: [], future: [] });
      setSavedSnapshot(JSON.stringify(p));
    }
    setLoaded(true);
  }, [params.id]);

  const dirty = doc != null && JSON.stringify(doc) !== savedSnapshot;

  // Mirrors the SoD workspace trail: the editor is a step *inside* the policy,
  // so the crumb keeps the policy itself reachable in one click.
  useSetBreadcrumbs(
    doc
      ? [
          { label: 'Approval Policies', href: '/iga/automation/approval-policies' },
          { label: doc.policyName, href: detailHref },
          { label: 'Workflow builder' },
        ]
      : null,
  );

  // warn on tab close / refresh while dirty
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  /** Structural change → pushes undo history. */
  const commit = (next: ApprovalPolicy) =>
    setHist((h) => (h ? { doc: next, past: [...h.past, h.doc].slice(-50), future: [] } : h));
  /** Data edit (meta) → no history entry. */
  const patchDoc = (patch: Partial<ApprovalPolicy>) =>
    setHist((h) => (h ? { ...h, doc: { ...h.doc, ...patch } } : h));

  const undo = () =>
    setHist((h) => {
      if (!h || h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return { doc: prev, past: h.past.slice(0, -1), future: [h.doc, ...h.future] };
    });
  const redo = () =>
    setHist((h) => {
      if (!h || h.future.length === 0) return h;
      const next = h.future[0];
      return { doc: next, past: [...h.past, h.doc], future: h.future.slice(1) };
    });

  const handleInsert = (loc: FlowInsertLoc, kind: string) => {
    if (!doc) return;
    const node = createNode(kind as PolicyNodeType);
    commit({ ...doc, root: insertNode(doc.root, loc, node) });
    setSelectedId(node.id);
    setConfigOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!doc) return;
    commit({ ...doc, root: deleteNode(doc.root, id) });
    if (selectedId === id) setSelectedId(null);
  };

  // config edits are data edits (no history entry, like meta)
  const setNodeConfig = (id: string, config: Record<string, unknown> | undefined) =>
    setHist((h) => {
      if (!h) return h;
      let root = updateNode(h.doc.root, id, { config });
      // outcome-branching nodes: keep Approved/Rejected/SLA-breach/… lanes in sync with config
      const n = findNode(root, id);
      if (n && n.type === 'approvalLevel') {
        root = updateNode(root, id, { branches: reconcileOutcomes(n) });
      } else if (n && n.type === 'parallelBranch') {
        // Parallel: first tier = approver lanes, second tier = Approved/Rejected outcome.
        root = updateNode(root, id, { branches: laneBranches(n), outcomeBranches: reconcileOutcomes(n, n.outcomeBranches ?? []) });
      }
      return { ...h, doc: { ...h.doc, root } };
    });
  /** Patch arbitrary node fields (e.g. conditional branches). No history entry. */
  const setNodePatch = (id: string, patch: Partial<PolicyNode>) =>
    setHist((h) => (h ? { ...h, doc: { ...h.doc, root: updateNode(h.doc.root, id, patch) } } : h));
  // Reset the step to its type's defaults — config AND branch structure (conditional
  // branches / parallel lanes / approval outcomes live in `branches`, not `config`,
  // so a config-only reset would leave conditions untouched). Undoable.
  const resetNode = (node: PolicyNode) => {
    if (!doc) return;
    const fresh = createNode(node.type);
    commit({ ...doc, root: updateNode(doc.root, node.id, { config: fresh.config, branches: fresh.branches, outcomeBranches: fresh.outcomeBranches }) });
  };

  const incomplete = doc ? allNodes(doc.root).filter((n) => !isNodeComplete(n)) : [];

  // Approver summary per parallel lane id — shown on the lane's canvas label.
  const laneApprover = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (doc) for (const n of allNodes(doc.root)) {
      if (n.type !== 'parallelBranch') continue;
      for (const l of (n.config as ParallelConfig | undefined)?.lanes ?? []) {
        const a = l.approver;
        map[l.id] = !a.approverType
          ? 'Not configured'
          : a.approverType === 'governanceGroup'
            ? getGovernanceGroup(a.governanceGroupId ?? '')?.name ?? APPROVER_TYPE_LABEL[a.approverType]
            : a.approverType === 'user'
              ? getUser(a.userId ?? '')?.name ?? APPROVER_TYPE_LABEL[a.approverType]
              : APPROVER_TYPE_LABEL[a.approverType];
      }
    }
    return map;
  }, [doc]);

  const save = () => {
    if (!doc) return;
    const saved = updateApprovalPolicy(doc); // keeps current status (no demotion)
    setHist((h) => (h ? { ...h, doc: saved } : h));
    setSavedSnapshot(JSON.stringify(saved));
    toast.success('Policy saved');
  };

  const saveAndActivate = () => {
    if (!doc) return;
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} step${incomplete.length > 1 ? 's' : ''} still incomplete`);
      return;
    }
    const saved = updateApprovalPolicy({ ...doc, status: 'active' });
    setHist((h) => (h ? { ...h, doc: saved } : h));
    setSavedSnapshot(JSON.stringify(saved));
    toast.success('Policy activated');
  };

  const goBack = () => {
    if (dirty) setBackConfirm(true);
    else router.push(detailHref);
  };

  // ---- render helpers ---------------------------------------------------
  const renderCard = (n: FlowNodeLike, { dense }: { dense: boolean }) => {
    const node = n as PolicyNode;
    const meta = NODE_META[node.type];
    const Icon = ICONS[meta.icon] ?? PersonOutline;
    const tile = tileFor(meta.section);
    const complete = isNodeComplete(node);
    const selected = selectedId === node.id;
    const summary = nodeSummary(node);
    const displayTitle = node.name?.trim() || meta.title;

    // Conditional Branch renders as a rhombus (diamond) rather than a card.
    if (node.type === 'conditionalBranch') {
      const paths = (node.branches ?? []).filter((b) => (b as PolicyBranch).kind === 'if' || (b as PolicyBranch).kind === 'elseif').length;
      return (
        <div className="ds-node-in group relative flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); }}
            className="relative grid h-[188px] w-[188px] place-items-center"
          >
            <span
              style={selected ? { borderColor: tile.fg } : undefined}
              className={[
                'absolute left-1/2 top-1/2 h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-2xl border bg-surface transition-all duration-150',
                selected ? 'shadow-sm' : 'border-border group-hover:border-border-strong',
              ].join(' ')}
            />
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
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}
            aria-label={`Delete ${meta.title}`}
            className="absolute right-8 top-8 z-10 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid"
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      );
    }

    // Flow-control steps (Skip / Exit) render as a compact pill: icon tile + title.
    if (node.type === 'skip' || node.type === 'exit') {
      return (
        <div className="ds-node-in group relative flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setConfigOpen(true); }}
            style={selected ? { borderColor: tile.fg } : undefined}
            className={['inline-flex items-center gap-2.5 rounded-pill border bg-surface px-4 py-2 text-left transition-all duration-150', selected ? 'shadow-sm' : 'border-border hover:border-border-strong hover:shadow-sm'].join(' ')}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}><Icon sx={{ fontSize: 16 }} /></span>
            <span className="text-body-medium text-text-primary">{displayTitle}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}
            aria-label={`Delete ${meta.title}`}
            className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid"
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </button>
        </div>
      );
    }

    // Approval Level: Fallback chip sits directly under the card (no branch tier).
    // Parallel: chip is rendered between branch lanes and outcomes via renderBetweenTiers.
    const fb = node.type === 'approvalLevel' ? (node.config as ALConfig | undefined)?.fallback : undefined;
    const showFallbackChip = Boolean(fb?.enabled && fb.action === 'fallbackApprover' && (fb.approverEmail ?? '').trim());
    const fallbackEmail = (fb?.approverEmail ?? '').trim();

    return (
      <div className="ds-node-in group relative flex flex-col items-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(node.id);
            setConfigOpen(true);
          }}
          style={selected ? { borderColor: tile.fg } : undefined}
          className={[
            'flex w-[320px] items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-left transition-all duration-150',
            selected ? 'shadow-sm' : 'border-border hover:border-border-strong hover:shadow-sm',
          ].join(' ')}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}>
            <Icon sx={{ fontSize: 18 }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-medium leading-tight text-text-primary">{displayTitle}</span>
            {(!dense || node.type === 'parallelBranch' || node.type === 'notification' || node.type === 'approvalLevel') && (
              <span className="mt-1 block truncate text-caption leading-tight text-text-secondary">{summary}</span>
            )}
          </span>
          {complete ? (
            <CheckCircleOutlined sx={{ fontSize: 17, color: 'var(--ds-color-status-success-fg)' }} titleAccess="Complete" />
          ) : (
            <WarningAmberOutlined sx={{ fontSize: 17, color: 'var(--ds-color-status-warning-fg)' }} titleAccess="Incomplete" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(node.id);
          }}
          aria-label={`Delete ${meta.title}`}
          className="absolute -right-2 -top-2 hidden h-6 w-6 place-items-center rounded-full border border-border bg-surface text-icon shadow-sm transition-colors hover:text-danger group-hover:grid"
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
        {showFallbackChip && (
          <>
            <div className="h-5 w-0.5 border-l-2 border-border-strong" aria-hidden />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(node.id);
                setConfigOpen(true);
              }}
              title="Open fallback configuration"
              className="flex w-[240px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-all duration-150 hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
                style={{ backgroundColor: tile.bg, color: tile.fg }}
              >
                <PersonOutline sx={{ fontSize: 16 }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm-medium leading-tight text-text-primary">Fallback Approver</span>
                <span className="mt-0.5 block truncate text-caption leading-tight text-text-secondary">{fallbackEmail}</span>
              </span>
            </button>
          </>
        )}
      </div>
    );
  };

  const renderFallbackBetweenTiers = (n: FlowNodeLike) => {
    const node = n as PolicyNode;
    if (node.type !== 'parallelBranch') return null;
    const fb = (node.config as ParallelConfig | undefined)?.fallback;
    const email = (fb?.approverEmail ?? '').trim();
    if (!(fb?.enabled && fb.action === 'fallbackApprover' && email)) return null;
    const tile = tileFor(NODE_META[node.type].section);
    return (
      <div className="flex flex-col items-center">
        <div className="h-5 w-0.5 border-l-2 border-border-strong" aria-hidden />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(node.id);
            setConfigOpen(true);
          }}
          title="Open fallback configuration"
          className="flex w-[240px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-all duration-150 hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
            style={{ backgroundColor: tile.bg, color: tile.fg }}
          >
            <PersonOutline sx={{ fontSize: 16 }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-sm-medium leading-tight text-text-primary">Fallback Approver</span>
            <span className="mt-0.5 block truncate text-caption leading-tight text-text-secondary">{email}</span>
          </span>
        </button>
      </div>
    );
  };

  const policyCard = () => {
    if (!doc) return null;
    const selected = selectedId === POLICY_SEL;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(POLICY_SEL);
          setConfigOpen(true);
        }}
        className={[
          'flex w-[320px] items-center gap-3 rounded-lg border bg-surface px-4 py-3 text-left transition-shadow',
          selected ? 'border-brand shadow-sm ring-2 ring-brand-subtle' : 'border-border hover:shadow-sm',
        ].join(' ')}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
          <PersonAddAltOutlined sx={{ fontSize: 18 }} />
        </span>
        <span className="min-w-0 flex-1">
          {/* `body-medium`, not `-strong`: this card names the policy you are already
              inside (it is in the page header too), so it is context. The steps below
              are the protagonist and carry the 600. */}
          <span className="block truncate text-body-medium text-text-primary">{doc.policyName}</span>
          <span className="mt-0.5 block truncate text-caption text-text-secondary">
            {doc.description || 'Add description'}
          </span>
        </span>
      </button>
    );
  };

  // Ordered by section so the quick-insert menu groups exactly like the sidebar.
  const palette = PALETTE_SECTIONS.flatMap((section) =>
    PALETTE_ORDER.filter((kind) => NODE_META[kind].section === section).map((kind) => ({
      kind,
      label: NODE_META[kind].title,
      icon: React.createElement(ICONS[NODE_META[kind].icon] ?? PersonOutline, { sx: { fontSize: 17 } }),
      section,
      tile: tileFor(section),
    })),
  );

  // ---- states -----------------------------------------------------------
  if (loaded && !doc) {
    return (
      <div className="-mx-8 -my-6 grid h-[calc(100%+3rem)] place-items-center bg-canvas">
        <div className="text-center">
          <div className="text-h5 text-text-primary">Policy not found</div>
          <p className="mt-1 text-body-sm text-text-secondary">This policy may have been deleted.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push('/iga/automation/approval-policies')}>
              Back to Approval Policies
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-canvas px-5 py-2.5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={goBack} aria-label="Back to policy details" className="grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover">
            <ArrowBackOutlined sx={{ fontSize: 20 }} />
          </button>
          <Avatar name={doc?.policyName ?? 'Policy'} initials={(doc?.policyName ?? 'P').charAt(0).toUpperCase()} size="sm" />
          <span className="text-h5 text-text-primary">{doc?.policyName ?? '…'}</span>
          {doc && (
            <StatusChip intent={doc.status === 'active' ? 'success' : 'neutral'} label={doc.status === 'active' ? 'Active' : 'Draft'} />
          )}
          {dirty && <span className="text-caption text-text-tertiary">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" startIcon={<HistoryOutlined />} onClick={() => setVersionsOpen(true)}>
            Versions
          </Button>
          <Button variant="secondary" startIcon={<SaveOutlined />} onClick={save} disabled={!dirty}>
            Save
          </Button>
          <Button
            startIcon={<CheckCircleOutlined />}
            onClick={saveAndActivate}
            disabled={incomplete.length > 0}
            title={incomplete.length > 0 ? `${incomplete.length} steps incomplete` : undefined}
          >
            Save &amp; Activate
          </Button>
          <Menu items={[{ label: 'Duplicate (soon)', onClick: () => toast.info('Duplicate coming soon') }, { label: 'Export JSON (soon)', onClick: () => toast.info('Export coming soon') }]} />
        </div>
      </div>

      {/* body: palette · canvas · config */}
      <div className="flex min-h-0 flex-1">
        {/* palette */}
        {paletteOpen ? (
          <div className="flex w-[248px] shrink-0 flex-col border-r border-border bg-surface">
            <div className="flex shrink-0 items-center justify-between px-4 py-3">
              <span className="text-caption-strong uppercase tracking-wider text-text-tertiary">Components</span>
              <button type="button" onClick={() => setPaletteOpen(false)} aria-label="Collapse components" className="grid h-6 w-6 place-items-center rounded text-icon hover:bg-surface-hover">
                <KeyboardDoubleArrowLeft sx={{ fontSize: 18 }} />
              </button>
            </div>
            <div className="ds-scroll flex-1 overflow-y-auto px-3 pb-4">
              {PALETTE_SECTIONS.map((section) => (
                <div key={section} className="mb-3">
                  <div className="mb-1.5 px-1 text-caption-strong uppercase tracking-wide text-text-tertiary">{section}</div>
                  <div className="space-y-2">
                    {PALETTE_ORDER.filter((k) => NODE_META[k].section === section).map((kind) => {
                      const Icon = ICONS[NODE_META[kind].icon] ?? PersonOutline;
                      const tile = tileFor(section);
                      return (
                        <div
                          key={kind}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData('text/kind', kind); setDraggingKind(kind); }}
                          onDragEnd={() => setDraggingKind(null)}
                          className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-border bg-canvas px-2.5 py-2 text-body-sm-strong text-text-primary transition-all hover:border-border-strong hover:shadow-sm active:cursor-grabbing"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md" style={{ backgroundColor: tile.bg, color: tile.fg }}>
                            <Icon sx={{ fontSize: 17 }} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{NODE_META[kind].title}</span>
                          <DragIndicator className="shrink-0 text-text-disabled opacity-60 transition-opacity group-hover:opacity-100" sx={{ fontSize: 16 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex w-11 shrink-0 flex-col items-center border-r border-border bg-surface pt-3">
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Expand components" className="grid h-7 w-7 place-items-center rounded text-icon hover:bg-surface-hover">
              <KeyboardDoubleArrowRight sx={{ fontSize: 18 }} />
            </button>
          </div>
        )}

        {/* canvas */}
        <div className="min-w-0 flex-1">
          {doc && (
            <FlowCanvas
              root={doc.root}
              renderCard={renderCard}
              headerCard={policyCard}
              palette={palette}
              onInsert={handleInsert}
              renderBranchLabel={(b, n) => {
                const br = b as unknown as PolicyBranch;
                const openParent = () => { setSelectedId((n as PolicyNode).id); setConfigOpen(true); };
                if (br.kind === 'if' || br.kind === 'elseif') {
                  return <ConditionLaneLabel label={br.label} group={br.condition} onOpen={openParent} />;
                }
                if (br.kind === 'outcome') return <LaneLabel text={br.label} tone={OUTCOME_TONE[br.label] ?? 'neutral'} upper onOpen={openParent} />;
                if (br.kind === 'parallelLane') {
                  return <ParallelLaneLabel label={br.label} approver={laneApprover[br.id]} onOpen={openParent} />;
                }
                return <LaneLabel text={br.label} onOpen={openParent} />;
              }}
              renderSealedBody={(b, n) => {
                const br = b as unknown as PolicyBranch;
                if (br.kind !== 'outcome') return null;
                const cfg = (n as PolicyNode).config as ALConfig | ParallelConfig | undefined;
                const openParent = () => { setSelectedId((n as PolicyNode).id); setConfigOpen(true); };

                if (br.label === 'SLA Breached') {
                  // Open path when creating a custom breach branch — no fixed pill.
                  if (cfg?.sla?.afterExpiry === 'createBranch') return null;
                  const approves = cfg?.sla?.afterExpiry === 'autoApprove';
                  return (
                    <AutoResolveBody
                      resolution={approves ? 'Auto Approve' : 'Auto Reject'}
                      tone={approves ? 'success' : 'danger'}
                      onOpen={openParent}
                    />
                  );
                }

                if (br.label === 'Approver Not Found') {
                  const action = cfg?.fallback?.action;
                  if (action === 'autoApprove') {
                    return <AutoResolveBody resolution="Auto Approve" tone="success" onOpen={openParent} />;
                  }
                  if (action === 'autoReject') {
                    return <AutoResolveBody resolution="Auto Reject" tone="danger" onOpen={openParent} />;
                  }
                  if (action === 'notify') {
                    return (
                      <AutoResolveBody
                        resolution="Notify"
                        tone="info"
                        icon={<MailOutline sx={{ fontSize: 16 }} />}
                        onOpen={openParent}
                      />
                    );
                  }
                  // Fallback Approver: person chip sits above the fan-out; this lane stays empty.
                  return null;
                }

                if (br.label === 'Fallback SLA Breached') {
                  if (cfg?.fallback?.approverResolution === 'createBranch') return null;
                  const res = cfg?.fallback?.approverResolution;
                  if (res === 'autoApprove') {
                    return <AutoResolveBody resolution="Auto Approve" tone="success" onOpen={openParent} />;
                  }
                  if (res === 'autoReject') {
                    return <AutoResolveBody resolution="Auto Reject" tone="danger" onOpen={openParent} />;
                  }
                  return <AutoResolveBody resolution="Select action" tone="neutral" onOpen={openParent} />;
                }

                return null;
              }}
              renderBetweenTiers={renderFallbackBetweenTiers}
              onClearSelection={() => setSelectedId(null)}
              view={view}
              onViewChange={setView}
              onUndo={undo}
              onRedo={redo}
              canUndo={(hist?.past.length ?? 0) > 0}
              canRedo={(hist?.future.length ?? 0) > 0}
              draggingKind={draggingKind}
              isTerminal={(n) => (n as PolicyNode).type === 'exit'}
            />
          )}
        </div>

        {/* config */}
        {configOpen ? (
          <ConfigPanel
            doc={doc}
            selectedId={selectedId}
            onCollapse={() => setConfigOpen(false)}
            onPatchMeta={patchDoc}
            onConfig={setNodeConfig}
            onPatchNode={setNodePatch}
            onReset={resetNode}
            onSave={save}
          />
        ) : (
          <div className="flex w-11 shrink-0 flex-col items-center border-l border-border bg-surface pt-3">
            <button type="button" onClick={() => setConfigOpen(true)} aria-label="Expand configuration" className="grid h-7 w-7 place-items-center rounded text-icon hover:bg-surface-hover">
              <KeyboardDoubleArrowLeft sx={{ fontSize: 18 }} />
            </button>
          </div>
        )}
      </div>

      {/* unsaved-leave guard */}
      <Dialog
        open={backConfirm}
        onClose={() => setBackConfirm(false)}
        title="Discard unsaved changes?"
        tone="danger"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => router.push(detailHref)}
      >
        You have unsaved changes to this policy. Leaving now will discard them.
      </Dialog>

      {/* versions (stub) */}
      <Drawer
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        title="Version history"
        subtitle="Published revisions of this policy."
        icon={<HistoryOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      >
        <div className="grid h-full place-items-center">
          <div className="text-center">
            <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-icon">
              <HistoryOutlined sx={{ fontSize: 24 }} />
            </span>
            <div className="text-body-strong text-text-primary">No versions yet</div>
            <p className="mx-auto mt-1 max-w-[240px] text-caption text-text-secondary">
              Durable version history is planned. For now, activating a policy publishes the current draft.
            </p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

// ---- config panel ------------------------------------------------------
function ConfigPanel({
  doc,
  selectedId,
  onCollapse,
  onPatchMeta,
  onConfig,
  onPatchNode,
  onReset,
  onSave,
}: {
  doc: ApprovalPolicy | null;
  selectedId: string | null;
  onCollapse: () => void;
  onPatchMeta: (patch: Partial<ApprovalPolicy>) => void;
  onConfig: (id: string, config: Record<string, unknown> | undefined) => void;
  onPatchNode: (id: string, patch: Partial<PolicyNode>) => void;
  onReset: (node: PolicyNode) => void;
  onSave: () => void;
}) {
  const node = doc && selectedId && selectedId !== POLICY_SEL ? findNode(doc.root, selectedId) : null;
  const isPolicy = selectedId === POLICY_SEL;
  const title = isPolicy ? 'Approval Policy' : node ? NODE_META[node.type].title : 'Configuration';
  const complete = node ? isNodeComplete(node) : true;

  return (
    <div className="flex w-[364px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        {node ? (
          <input
            value={node.name ?? NODE_META[node.type].title}
            placeholder={NODE_META[node.type].title}
            onChange={(e) => onPatchNode(node.id, { name: e.target.value })}
            aria-label="Step name"
            title="Rename this step"
            className="-ml-1 min-w-0 max-w-full truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-body-sm-strong text-text-primary placeholder:text-text-primary transition-colors [field-sizing:content] hover:border-border focus:border-brand focus:outline-none"
          />
        ) : (
          <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{title}</span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {node &&
            (complete ? (
              <StatusChip intent="success" label="Configured" />
            ) : (
              <StatusChip intent="warning" label="Incomplete" />
            ))}
          <button type="button" onClick={onCollapse} aria-label="Collapse configuration" className="grid h-6 w-6 place-items-center rounded text-icon hover:bg-surface-hover">
            <KeyboardDoubleArrowRight sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      <div className="ds-scroll flex-1 overflow-y-auto p-4">
        {isPolicy && doc && (
          <div className="space-y-4">
            <Input label="Policy name" size="sm" value={doc.policyName} onChange={(e) => onPatchMeta({ policyName: e.target.value })} />
            <Input label="Description" size="sm" multiline minRows={3} value={doc.description} onChange={(e) => onPatchMeta({ description: e.target.value })} />
          </div>
        )}
        {node && node.type === 'approvalLevel' && (
          <div className="space-y-4">
            <ApprovalLevelConfig
              config={(node.config as unknown as ALConfig) ?? (defaultConfig('approvalLevel') as unknown as ALConfig)}
              onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)}
            />
          </div>
        )}
        {node && node.type === 'notification' && (
          <div className="space-y-4">
            <NotificationConfig
              config={(node.config as unknown as NConfig) ?? (defaultNotificationConfig() as unknown as NConfig)}
              onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)}
            />
          </div>
        )}
        {node && node.type === 'conditionalBranch' && (
          <div className="space-y-4">
            <ConditionalBranchConfig node={node} onPatchNode={(patch) => onPatchNode(node.id, patch)} />
          </div>
        )}
        {node && node.type === 'parallelBranch' && (
          <div className="space-y-4">
            <ParallelBranchConfig
              config={(node.config as unknown as ParallelConfig) ?? (defaultConfig('parallelBranch') as unknown as ParallelConfig)}
              onChange={(cfg) => onConfig(node.id, cfg as unknown as Record<string, unknown>)}
            />
          </div>
        )}
        {node && (node.type === 'skip' || node.type === 'exit') && (
          <div className="space-y-4">
            <EmptyState
              icon={<TaskAltOutlined sx={{ fontSize: 22 }} />}
              title={NODE_META[node.type].title}
              message={
                node.type === 'skip'
                  ? 'Skips ahead toward the merge point. No configuration needed.'
                  : 'Ends this branch — it will not continue into the merge. No configuration needed.'
              }
            />
          </div>
        )}
        {!isPolicy && !node && (
          <EmptyState
            icon={<TaskAltOutlined sx={{ fontSize: 22 }} />}
            title="Nothing selected"
            message="Select the policy card or a step on the canvas to configure it."
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
