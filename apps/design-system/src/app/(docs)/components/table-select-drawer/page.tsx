'use client';

import * as React from 'react';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Button, StatusChip, TableSelectDrawer } from '@ds/components';

const ROLES = [
  { id: 'admin', name: 'Administrator', description: 'Full environment access', risk: 94 },
  { id: 'deploy', name: 'Deployer', description: 'Push to staging and production', risk: 68 },
  { id: 'read', name: 'Read only', description: 'View configuration', risk: 12 },
];

export default function TableSelectDrawerDocs() {
  const [open, setOpen] = React.useState(false);
  const [ids, setIds] = React.useState<string[]>(['read']);

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Table Select Drawer"
        description="Wide two-pane select: a searchable table on the left, the running selection on the right. One component for many or one — DataTable already models the arity."
      />

      <Section
        title="Add from a catalog"
        description="Risk is a number here. Product callers pass `renderRisk` so the cell can be a RiskScoreChip without the Design System importing product code."
      >
        <Example label="open the drawer">
          <Button
            variant="secondary"
            startIcon={<ShieldOutlined />}
            onClick={() => setOpen(true)}
          >
            Add technical roles{ids.length ? ` (${ids.length})` : ''}
          </Button>
          <TableSelectDrawer
            open={open}
            onClose={() => setOpen(false)}
            title="Add Technical Roles"
            subtitle="Select the roles this access hands over."
            icon={<ShieldOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
            nameHeader="Technical role"
            entity="technical role"
            rows={ROLES}
            selectedIds={ids}
            onApply={setIds}
            renderRisk={(score) => (
              <StatusChip intent={score >= 80 ? 'danger' : score >= 50 ? 'caution' : 'info'} label={String(score)} dot={false} />
            )}
          />
        </Example>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'Picking named records from a catalog (roles, people, connections).',
            '`selectionMode="single"` for one reviewer — radios and a one-slot panel.',
            'Pass `entityPlural` when “+s” is wrong (“policies”).',
          ]}
          donts={[
            'A FilterDrawer. That stages filters; this applies a selection of records.',
            'Embedding this table on a wizard step. That is PickerSlot plus this drawer.',
            'Importing a product risk chip into the Design System. Pass `renderRisk`.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { TableSelectDrawer } from '@ds/components';`}</Code>
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'open / onClose', type: 'boolean / () => void', description: 'Standard overlay control.' },
            { name: 'title / subtitle / icon', type: 'string / ReactNode', description: 'Drawer header.' },
            { name: 'nameHeader', type: 'string', description: 'First column header.' },
            { name: 'descriptionHeader', type: 'string', default: "'Description'", description: 'Second column — sometimes Email.' },
            { name: 'entity / entityPlural', type: 'string', description: 'Singular for counts; plural when “+s” is wrong.' },
            { name: 'rows / selectedIds / onApply', type: 'TableSelectRow[] / string[] / (ids) => void', description: 'Catalog and the committed selection.' },
            { name: 'showRisk', type: 'boolean', default: 'true', description: 'Show the risk column.' },
            { name: 'renderRisk', type: '(score) => ReactNode', description: 'How to paint a score. Defaults to a number.' },
            { name: 'selectionMode', type: "'single' | 'multiple'", default: "'multiple'", description: 'Radios vs checkboxes.' },
            { name: 'confirmLabel', type: 'string', description: 'Footer verb. Defaults to Add or Select.' },
          ]}
        />
      </Section>
    </>
  );
}
