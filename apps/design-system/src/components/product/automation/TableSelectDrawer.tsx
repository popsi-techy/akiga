'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Drawer, Input, Button, DataTable, SelectionPanel, type Column } from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory';

export interface TableSelectRow {
  id: string;
  name: string;
  description: string;
  /** Required when `showRisk` is true (default). */
  risk?: number;
}

/**
 * Wide two-pane select drawer: a searchable, paginated table on the left, the
 * running selection on the right — the "Add Owners"-style pattern reused for
 * roles, entitlements, connections, and (in `single` mode) reviewers.
 *
 * `selectionMode="single"` turns the checkboxes into radios and the panel into a
 * single-slot preview. It stays one component rather than two because everything
 * around the control — search, pagination, the selection panel, the footer — is
 * identical; only the arity differs, and that is what `DataTable` already models.
 */
export function TableSelectDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  nameHeader,
  descriptionHeader = 'Description',
  entity,
  rows,
  selectedIds,
  onApply,
  showRisk = true,
  selectionMode = 'multiple',
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  nameHeader: string;
  /** Header for the second column — it is not always a description (e.g. "Email"). @default 'Description' */
  descriptionHeader?: string;
  entity: string; // singular, e.g. "technical role"
  rows: TableSelectRow[];
  selectedIds: string[];
  onApply: (ids: string[]) => void;
  /** Show the risk-score column. @default true */
  showRisk?: boolean;
  /** `'single'` — radios, no select-all, one row at a time. @default 'multiple' */
  selectionMode?: 'single' | 'multiple';
  /** Footer verb. Defaults to "Add" (multiple) or "Select" (single). */
  confirmLabel?: string;
}) {
  const single = selectionMode === 'single';
  const [sel, setSel] = React.useState<string[]>(selectedIds);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setSel(selectedIds);
      setQuery('');
    }
  }, [open, selectedIds]);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));

  const columns: Column<TableSelectRow>[] = [
    { id: 'name', header: nameHeader, sortable: true, value: (r) => r.name, render: (r) => <span className="text-body-sm-strong text-text-primary">{r.name}</span> },
    { id: 'description', header: descriptionHeader, sortable: single, value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
    ...(showRisk
      ? [
          {
            id: 'risk',
            header: 'Risk score',
            align: 'right' as const,
            sortable: true,
            value: (r: TableSelectRow) => r.risk ?? 0,
            render: (r: TableSelectRow) => <RiskScoreChip score={r.risk ?? 0} />,
          },
        ]
      : []),
  ];

  const selectedItems = rows
    .filter((r) => sel.includes(r.id))
    .map((r) => ({ id: r.id, label: r.name, sublabel: single ? r.description : undefined }));
  const plural = (n: number) => `${n} ${entity}${n === 1 ? '' : 's'} selected`;
  const verb = confirmLabel ?? (single ? 'Select' : 'Add');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      width={820}
      disablePadding
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={sel.length === 0} onClick={() => { onApply(sel); onClose(); }}>
            {verb}{!single && sel.length ? ` (${sel.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
          <div className="mb-4 w-full max-w-sm shrink-0">
            <Input placeholder={`Search ${entity}s`} value={query} onChange={(e) => setQuery(e.target.value)} startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />} />
          </div>
          <div className="min-h-0 flex-1">
            <DataTable<TableSelectRow>
              columns={columns}
              rows={filtered}
              selectable
              selectionMode={selectionMode}
              selectedIds={sel}
              onSelectionChange={setSel}
              fillHeight
              defaultRowsPerPage={single ? 10 : 25}
              emptyTitle="No matches"
              emptyMessage="Try a different search."
            />
          </div>
        </div>
        <div className="w-[280px] shrink-0 border-l border-border px-6 py-5">
          <SelectionPanel
            title="Selected"
            items={selectedItems}
            onRemove={(id) => setSel((prev) => prev.filter((x) => x !== id))}
            onClearAll={() => setSel([])}
            countLabel={single ? () => '1 selected' : plural}
            emptyTitle="Nothing selected"
            emptyMessage={
              single
                ? `Choose a ${entity} from the list and it’ll appear here.`
                : 'Select rows from the list and they’ll appear here.'
            }
          />
        </div>
      </div>
    </Drawer>
  );
}

export default TableSelectDrawer;
