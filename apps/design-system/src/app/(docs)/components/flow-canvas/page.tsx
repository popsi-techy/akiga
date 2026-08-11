'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import { PageHeader, Section, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { FlowCanvas, type FlowNodeLike, type FlowInsertLoc } from '@ds/components';

type DemoNode = FlowNodeLike & { kind: 'approval' | 'notify' | 'branch' };

const ICON = { approval: PersonOutline, notify: MailOutline, branch: AccountTreeOutlined } as const;
const LABEL = { approval: 'Approval Level', notify: 'Notification', branch: 'Conditional Branch' } as const;

const SAMPLE: DemoNode[] = [
  { id: 'a', kind: 'approval' },
  {
    id: 'b',
    kind: 'branch',
    branches: [
      // Asymmetric nest: IF has a card, ELSE is empty — the lane spacer must
      // still stroke a continuous stem down to the merge (empty-lane stem fix).
      { id: 'if', label: 'IF high risk', seq: [{ id: 'b1', kind: 'approval' } as DemoNode] },
      { id: 'else', label: 'ELSE', seq: [] },
    ],
  },
];

export default function FlowCanvasDocs() {
  const [root, setRoot] = React.useState<DemoNode[]>(SAMPLE);
  const [view, setView] = React.useState<'outline' | 'detailed'>('detailed');
  const [selected, setSelected] = React.useState<string | null>(null);

  // Doc-only insert: appends to the root sequence (the host app supplies real
  // path-based insertion; here we just demonstrate the onInsert contract firing).
  const onInsert = (_loc: FlowInsertLoc, kind: string) =>
    setRoot((r) => [...r, { id: `n${r.length + Math.random()}`, kind: kind as DemoNode['kind'] }]);

  const renderCard = (n: FlowNodeLike) => {
    const node = n as DemoNode;
    const Icon = ICON[node.kind];
    const selectedCard = selected === node.id;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSelected(node.id);
        }}
        className={[
          'flex w-[220px] items-center gap-3 rounded-lg border bg-surface px-4 py-3 text-left',
          selectedCard ? 'border-brand ring-2 ring-brand-subtle' : 'border-border',
        ].join(' ')}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-subtle text-icon-brand">
          <Icon sx={{ fontSize: 18 }} />
        </span>
        <span className="text-body-strong text-text-primary">{LABEL[node.kind]}</span>
      </button>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Flow Canvas"
        description="The Automation builders' derived-layout graph (ADR-0007: custom, zero-dependency). Cards and lanes lay out in the DOM; connectors are a measured SVG overlay (ResizeObserver → orthogonal paths between anchors). Fan-out/merge, connector drop-targets + quick-insert, and a floating toolbar (density, zoom/fit, undo/redo). It owns layout, zoom, edges, and insertion affordances; the consumer owns node data, cards, and selection."
      />

      <Section
        title="Derived layout"
        description="Nodes are never placed or dragged by pixel — layout is a pure function of the data. Branching nodes fan out into lanes that hug their content and merge back; nesting widens parent lanes without overlap. Drag a component from a palette onto a connector, or use a connector’s “+”."
      >
        <div className="h-[440px] w-full overflow-hidden rounded-lg border border-border">
          <FlowCanvas
            root={root}
            renderCard={renderCard}
            palette={[
              { kind: 'approval', label: 'Approval Level', icon: <PersonOutline sx={{ fontSize: 17 }} />, section: 'Tasks', tile: { bg: '#E8F1FE', fg: '#2E7CF6' } },
              { kind: 'notify', label: 'Notification', icon: <MailOutline sx={{ fontSize: 17 }} />, section: 'Tasks', tile: { bg: '#E8F1FE', fg: '#2E7CF6' } },
              { kind: 'branch', label: 'Conditional Branch', icon: <AccountTreeOutlined sx={{ fontSize: 17 }} />, section: 'Branching', tile: { bg: '#FFF1E3', fg: '#F59E0B' } },
            ]}
            onInsert={onInsert}
            onClearSelection={() => setSelected(null)}
            view={view}
            onViewChange={setView}
          />
        </div>
      </Section>

      <Section
        title="SVG edge overlay"
        description="Connectors are not CSS borders. The stage marks layout anchors (`data-flow-vseg`, lane heads/feet, tier exits); a ResizeObserver pass measures them into stage-local coordinates and draws orthogonal SVG paths (fan-out, merge, sequence). Strokes use `border-strong` at 2px with token radius elbows, snapped to half-pixels so zoom stays crisp."
      >
        <ul className="list-disc space-y-1.5 pl-5 text-body-sm text-text-secondary">
          <li>
            <strong className="text-text-primary">Sequence</strong> — vertical segments through connector slots and{' '}
            <Code>FlowStem</Code> spacers (Start → cards → End).
          </li>
          <li>
            <strong className="text-text-primary">Fan-out</strong> — trunk from the tier entry into a horizontal bus, then
            down into each lane head.
          </li>
          <li>
            <strong className="text-text-primary">Merge</strong> — lane feet into a bus, then down through the tier exit
            (omitted when every lane terminates).
          </li>
          <li>
            <strong className="text-text-primary">Between tiers</strong> — use{' '}
            <Code>renderBetweenTiers</Code> for chrome between a first branch tier and{' '}
            <Code>outcomeBranches</Code> (e.g. Fallback Approver). The canvas owns the stems.
          </li>
        </ul>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'root', type: 'FlowNodeLike[]', description: 'The sequence to render (each node may carry `branches` / `outcomeBranches`).' },
            { name: 'renderCard', type: '(node, { dense }) => ReactNode', description: 'Render a node’s card — the consumer wires selection/delete.' },
            { name: 'headerCard', type: '({ dense }) => ReactNode', description: 'Optional fixed card between Start and the root (e.g. the Policy card).' },
            { name: 'palette', type: 'PaletteEntry[]', description: 'Kinds offered in the quick-insert menu. Give each entry a `section` and `tile` to group them under overline headings with the same icon tiles as the sidebar palette; omit both for a flat list.' },
            { name: 'onInsert', type: '(loc, kind) => void', description: 'Fired on drop or quick-insert. `loc` = { path, index }.' },
            { name: 'renderSealedBody', type: '(branch, node) => ReactNode', description: 'Fixed content under a lane label (e.g. Auto Approve pill). Prefer FlowStem inside product bodies — never paint border stems.' },
            { name: 'renderBetweenTiers', type: '(node) => ReactNode', description: 'Chrome between the first branch tier and outcomeBranches. Canvas draws stems above/below.' },
            { name: 'view / onViewChange', type: "'outline' | 'detailed'", description: 'Density toggle (passed to renderCard as `dense`).' },
            { name: 'onUndo / onRedo / canUndo / canRedo', type: '() => void / boolean', description: 'Wire the host’s history stack to the toolbar.' },
            { name: 'onClearSelection', type: '() => void', description: 'Called when the empty canvas is clicked.' },
            { name: 'readOnly', type: 'boolean', default: 'false', description: 'Drop every authoring affordance — no quick-insert, no drop targets — so the same canvas can render a flow as a preview.' },
            { name: 'simulation', type: 'FlowSimulation', description: 'Test-run visuals: dim base edges, ring node states (pending/active/passed/failed/skipped), and an animated orthogonal trace through `traceNodeIds` (`__start__` / node ids / `__end__`). Respects prefers-reduced-motion.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Derive edges and layout from data — never let users draw or drag nodes.',
            'Keep node cards in renderCard so each builder styles its own domain.',
            'Use headerCard for the fixed first card (Policy card / Event card).',
            'Use FlowStem (or let the canvas insert stems) for any vertical join — one stroke owner.',
            'Put Parallel between-tier chrome (Fallback chip) in renderBetweenTiers; Approval Level chips may sit under the card with FlowStem when outcomes live in `branches`.',
            'Drive Test Run from the host (plan + ticker); pass `simulation` + `readOnly` so the canvas owns measure/zoom for the trace.',
            'Wire onUndo/onRedo to the host document history.',
            'Use readOnly to preview a saved flow — same geometry as the builder, so nothing moves when you switch to editing.',
          ]}
          donts={[
            'Don’t draw decorative border-l / CSS stems in product code — they abut and break under zoom.',
            'Don’t animate edges outside FlowCanvas — zoom/transform will drift.',
            'Don’t embed the full canvas inside a drawer — it’s a dedicated builder surface.',
            'Don’t store selection inside the canvas; the host owns it.',
            'Don’t hand-position nodes or add manual edge handles.',
            'Don’t put large catalogs in the canvas — use drawers (placement rules).',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { FlowCanvas, FlowStem } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
