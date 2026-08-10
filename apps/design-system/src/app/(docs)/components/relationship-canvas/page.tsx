'use client';

import * as React from 'react';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import { PageHeader, Section, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { RelationshipCanvas, type CanvasEdge, type CanvasNode } from '@ds/components';

/** A miniature four-column model — enough to show columns, labels and a back-edge. */
type DemoNode = CanvasNode & { title: string; kind: keyof typeof ICON; meta: string };

const ICON = {
  department: BusinessOutlined,
  role: BadgeOutlined,
  application: AppsOutlined,
  policy: RuleOutlined,
  person: PersonOutline,
} as const;

const COLUMN_LABELS = ['Organization', 'Roles', 'Access', 'Controls', 'Responsibility'];

const NODES: DemoNode[] = [
  { id: 'finance', column: 0, title: 'Finance', kind: 'department', meta: 'Department · 186 people' },
  { id: 'analyst', column: 1, title: 'Finance Analyst', kind: 'role', meta: 'Business Role · 184 users' },
  { id: 'controller', column: 1, title: 'Financial Controller', kind: 'role', meta: 'Business Role · 12 users' },
  { id: 'sap', column: 2, title: 'SAP S/4HANA', kind: 'application', meta: 'Application · 124 users' },
  { id: 'netsuite', column: 2, title: 'NetSuite', kind: 'application', meta: 'Application · 64 users' },
  { id: 'apolicy', column: 3, title: 'Finance Applications', kind: 'policy', meta: 'Approval Policy · 4 levels' },
  { id: 'hana', column: 4, title: 'Hana Kim', kind: 'person', meta: 'Finance Manager' },
];

const EDGES: CanvasEdge[] = [
  { id: 'e1', source: 'finance', target: 'analyst', label: 'assigned through' },
  { id: 'e2', source: 'finance', target: 'controller', label: 'assigned through' },
  { id: 'e3', source: 'analyst', target: 'sap', label: 'assigned through' },
  { id: 'e4', source: 'controller', target: 'netsuite', label: 'assigned through' },
  { id: 'e5', source: 'sap', target: 'apolicy', label: 'governed by' },
  { id: 'e6', source: 'netsuite', target: 'apolicy', label: 'governed by' },
  { id: 'e7', source: 'apolicy', target: 'hana', label: 'owned by' },
  // A relationship that points back up the model — drawn as a return sweep.
  { id: 'e8', source: 'apolicy', target: 'finance', label: 'applies to' },
  { id: 'e9', source: 'analyst', target: 'controller', label: 'inherited from', inactive: true },
];

export default function RelationshipCanvasDocs() {
  const [selected, setSelected] = React.useState<string | null>('finance');
  const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState(false);

  const dimmed = React.useMemo(() => {
    if (!focus || !selected) return undefined;
    const keep = new Set([selected]);
    for (const e of EDGES) {
      if (e.source === selected) keep.add(e.target);
      if (e.target === selected) keep.add(e.source);
    }
    return new Set(NODES.filter((n) => !keep.has(n.id)).map((n) => n.id));
  }, [focus, selected]);

  const renderNode = (node: CanvasNode, ctx: { selected: boolean }) => {
    const model = NODES.find((n) => n.id === node.id)!;
    const Icon = ICON[model.kind];
    return (
      <div
        className={[
          'flex h-full w-full items-center gap-2.5 rounded-lg border bg-surface px-3 py-2',
          ctx.selected ? 'border-brand shadow-sm ring-2 ring-brand-subtle' : 'border-border hover:border-border-strong hover:shadow-sm',
        ].join(' ')}
      >
        <span
          className={[
            'grid h-7 w-7 shrink-0 place-items-center rounded-md',
            ctx.selected ? 'bg-brand-subtle text-brand' : 'bg-subtle text-icon',
          ].join(' ')}
        >
          <Icon sx={{ fontSize: 16 }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm-strong text-text-primary">{model.title}</span>
          <span className="block truncate text-caption text-text-tertiary">{model.meta}</span>
        </span>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Relationship Canvas"
        description="A layered relationship graph for entity models. Where Flow Canvas renders a sequence executing top-down, this renders a network of typed relationships as left-to-right columns. It owns column layout, crossing reduction, edge routing and labelling, zoom / pan / fit, selection and dimming; the consumer owns the node card and every decision about which nodes and edges exist."
      />

      <Section
        title="Columns carry meaning"
        description="A node's column is its place in the model, not a coordinate — organization, then roles, then access, then the controls governing it, then who is accountable. Layout is a pure function of the data, so the same node set always draws the same picture. Click a node to select it, a line to inspect the relationship, and drag the background to pan. This example is wider than the column it sits in, which is the normal case: it opens framed on the selection — press Fit to see the whole shape."
      >
        <div className="h-[460px] w-full overflow-hidden rounded-lg border border-border">
          <RelationshipCanvas
            nodes={NODES}
            edges={EDGES}
            columnLabels={COLUMN_LABELS}
            renderNode={renderNode}
            selectedNodeId={selected}
            selectedEdgeId={selectedEdge}
            dimmedNodeIds={dimmed}
            frameNodeId={selected}
            onNodeClick={(id) => {
              setSelected(id);
              setSelectedEdge(null);
            }}
            onEdgeClick={(id) => {
              setSelectedEdge(id);
              setSelected(null);
            }}
            onBackgroundClick={() => {
              setSelected(null);
              setSelectedEdge(null);
            }}
            ariaLabel="Example relationship map"
            toolbarExtras={
              <button
                type="button"
                aria-pressed={focus}
                onClick={() => setFocus((f) => !f)}
                className={[
                  'rounded-md px-2 py-1 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
                  focus ? 'bg-surface-selected text-brand' : 'text-text-secondary hover:bg-surface-hover',
                ].join(' ')}
              >
                Focus
              </button>
            }
          />
        </div>
        <p className="mt-3 text-body-sm text-text-secondary">
          Two shapes are deliberate. A relationship pointing back up the model (“Finance Applications applies to
          Finance”) leaves the left face and sweeps beneath the columns, so direction reads from the shape alone. A
          relationship that is not currently in force is dashed — same colour, because it is the same kind of
          relationship, just provisional.
        </p>
      </Section>

      <Section
        title="Legibility over completeness"
        description="A wide model shrunk to fit shows everything and communicates nothing. When the whole graph will not fit above a readable scale, the canvas holds that scale and frames the node you arrived on instead — fit-to-view stays one click away in the toolbar, and fullscreen is where the whole model is meant to be read."
      >
        <PropsTable
          rows={[
            { name: 'nodes', type: 'CanvasNode[]', description: 'Shape: id, column, optional height. Columns are compacted — gaps in the numbering close up.' },
            { name: 'edges', type: 'CanvasEdge[]', description: 'Shape: id, source, target, label, optional inactive. The label is what makes the line mean something — never omit it.' },
            { name: 'columnLabels', type: 'string[]', description: 'Heading per column index. Only columns that contain nodes are drawn.' },
            { name: 'renderNode', type: '(node, { selected, dimmed, hovered }) => ReactNode', description: 'The node card, rendered at the size the canvas reserved.' },
            { name: 'selectedNodeId / selectedEdgeId', type: 'string | null', description: 'Controlled selection — the host owns it.' },
            { name: 'dimmedNodeIds', type: 'ReadonlySet<string>', description: 'Nodes to push back visually: focus mode, a risk lens, an active filter.' },
            { name: 'frameNodeId', type: 'string | null', description: 'What the opening view is built around when the graph is too wide to fit legibly.' },
            { name: 'onNodeClick / onEdgeClick / onBackgroundClick', type: '(id) => void', description: 'Selection, relationship inspection, and clearing.' },
            { name: 'toolbarExtras', type: 'ReactNode', description: 'Product controls placed before the built-in view controls.' },
            { name: 'nodeWidth / nodeHeight', type: 'number', description: 'Shared card size so columns align. Defaults 216 × 74.' },
            { name: 'emptyTitle / emptyMessage', type: 'string', description: 'The designed empty state when there is nothing to map.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Label every edge with the reason the relationship exists — "governed by", not a bare line.',
            'Assign columns from the model’s own layers, so position always means the same thing.',
            'Reveal progressively: draw a rooted neighbourhood and let the user expand it.',
            'Keep risk and status on the node card; use dimming for lenses.',
            'Give the canvas a definite height — it fills its parent and never grows the page.',
          ]}
          donts={[
            'Don’t render the whole model at once — a graph nobody can read is not a graph.',
            'Don’t recolour the canvas for a risk mode; de-emphasise what is not at risk instead.',
            'Don’t let users drag nodes — position is derived, and hand-placed nodes cannot be re-derived.',
            'Don’t store selection inside the canvas; the host owns it so both views can share it.',
            'Don’t use this for a sequence (a policy or workflow executing) — that is Flow Canvas.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { RelationshipCanvas } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
