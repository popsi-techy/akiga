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
      { id: 'if', label: 'IF high risk', seq: [{ id: 'b1', kind: 'approval' } as DemoNode] },
      { id: 'else', label: 'ELSE', seq: [{ id: 'b2', kind: 'notify' } as DemoNode] },
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
        <span className="text-body font-semibold text-text-primary">{LABEL[node.kind]}</span>
      </button>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Flow Canvas"
        description="The Automation builders' derived-layout graph (ADR-0007: custom, zero-dependency). Renders a recursive sequence/branch model as a top-down tree with fan-out/merge connectors, connector drop-targets + quick-insert, and a floating toolbar (density, zoom/fit, undo/redo). It owns layout, zoom, and insertion affordances; the consumer owns node data, cards, and selection."
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
              { kind: 'approval', label: 'Approval Level', icon: <PersonOutline sx={{ fontSize: 18 }} /> },
              { kind: 'notify', label: 'Notification', icon: <MailOutline sx={{ fontSize: 18 }} /> },
              { kind: 'branch', label: 'Conditional Branch', icon: <AccountTreeOutlined sx={{ fontSize: 18 }} /> },
            ]}
            onInsert={onInsert}
            onClearSelection={() => setSelected(null)}
            view={view}
            onViewChange={setView}
          />
        </div>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'root', type: 'FlowNodeLike[]', description: 'The sequence to render (each node may carry `branches`).' },
            { name: 'renderCard', type: '(node, { dense }) => ReactNode', description: 'Render a node’s card — the consumer wires selection/delete.' },
            { name: 'headerCard', type: '({ dense }) => ReactNode', description: 'Optional fixed card between Start and the root (e.g. the Policy card).' },
            { name: 'palette', type: 'PaletteEntry[]', description: 'Kinds offered in the connector quick-insert menu.' },
            { name: 'onInsert', type: '(loc, kind) => void', description: 'Fired on drop or quick-insert. `loc` = { path, index }.' },
            { name: 'view / onViewChange', type: "'outline' | 'detailed'", description: 'Density toggle (passed to renderCard as `dense`).' },
            { name: 'onUndo / onRedo / canUndo / canRedo', type: '() => void / boolean', description: 'Wire the host’s history stack to the toolbar.' },
            { name: 'onClearSelection', type: '() => void', description: 'Called when the empty canvas is clicked.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Derive edges and layout from data — never let users draw or drag nodes.',
            'Keep node cards in renderCard so each builder styles its own domain.',
            'Use headerCard for the fixed first card (Policy card / Event card).',
            'Wire onUndo/onRedo to the host document history.',
          ]}
          donts={[
            'Don’t embed the full canvas inside a drawer — it’s a dedicated builder surface.',
            'Don’t store selection inside the canvas; the host owns it.',
            'Don’t hand-position nodes or add manual edge handles.',
            'Don’t put large catalogs in the canvas — use drawers (placement rules).',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { FlowCanvas } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
