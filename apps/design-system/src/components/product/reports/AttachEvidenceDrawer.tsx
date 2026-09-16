'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, Drawer, Input, SelectableList, useToast } from '@ds/components';
import { OPERATIONAL_REPORTS, REPORT_CATEGORY_LABEL, type ComplianceClause } from '@/data/reports';
import { REPORT_TEMPLATES_V2 } from '@/data/governance-analytics-v2';

/**
 * Bind evidence to one clause, without leaving the matrix.
 *
 * Two sources, in the order a compliance officer tries them: an operational register
 * first, because the whole point of the catalogue is that the answer is usually already
 * built; a custom analytics report second, for the clause nobody anticipated.
 *
 * Multi-select on purpose. A clause like "periodically user access rights should be
 * reviewed" is answered by the certification register *and* the role governance register
 * together, and forcing one would either under-evidence the clause or duplicate the row —
 * which is exactly what the screenshots show, the same clause listed twice under E05 and
 * E06 because each register needed its own line.
 *
 * Registers not yet built are excluded rather than shown disabled: this is a picker, and
 * an option that can never be picked is a dead row in a list you are scanning under time
 * pressure. The gap drawer is where "that register does not exist yet" belongs.
 */
export function AttachEvidenceDrawer({
  open,
  clause,
  onClose,
}: {
  open: boolean;
  clause: ComplianceClause | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(new Set(clause?.evidencedById ? [clause.evidencedById] : []));
  }, [open, clause]);

  const q = query.trim().toLowerCase();
  const match = (name: string, description: string) =>
    !q || name.toLowerCase().includes(q) || description.toLowerCase().includes(q);

  const registers = OPERATIONAL_REPORTS.filter((r) => r.href && match(r.name, r.description));
  const customs = REPORT_TEMPLATES_V2.filter((t) => t.status === 'available' && match(t.name, t.description));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = () => {
    if (selected.size === 0) {
      toast.error('Pick at least one register, or close without binding.');
      return;
    }
    toast.success(
      `${selected.size} ${selected.size === 1 ? 'register' : 'registers'} bound to clause ${clause?.clause}.`,
    );
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Attach evidence"
      subtitle={clause ? `Clause ${clause.clause}${clause.subClause !== 'N/A' ? ` · ${clause.subClause}` : ''}` : undefined}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Bind evidence</Button>
        </>
      }
    >
      <div className="space-y-5">
        {clause && (
          /* The requirement, verbatim, above the picker. Choosing evidence without the
             text in front of you is how a register gets bound to a clause it nearly
             answers. */
          <blockquote className="rounded-lg border-l-2 border-border-strong bg-subtle px-4 py-3">
            <p className="text-body-sm text-text-primary">{clause.requirement}</p>
            <p className="mt-1 text-caption text-text-tertiary">Ref {clause.ref}</p>
          </blockquote>
        )}

        <Input
          size="sm"
          placeholder="Search registers and reports"
          aria-label="Search registers and reports"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
        />

        <section>
          <h3 className="mb-2 text-body-sm-strong text-text-primary">Operational registers</h3>
          <SelectableList
            ariaLabel="Operational registers"
            items={registers.map((r) => ({
              id: r.id,
              label: r.name,
              description: r.description,
              trailing: <span className="text-caption text-text-tertiary">{REPORT_CATEGORY_LABEL[r.category]}</span>,
            }))}
            selected={selected}
            onToggle={toggle}
            emptyMessage="No register matches that search."
          />
        </section>

        <section>
          <h3 className="mb-2 text-body-sm-strong text-text-primary">Custom analytics</h3>
          <SelectableList
            ariaLabel="Custom analytics reports"
            items={customs.map((t) => ({
              id: `custom-${t.id}`,
              label: t.name,
              description: t.description,
              trailing: <span className="text-caption text-text-tertiary">{t.category}</span>,
            }))}
            selected={selected}
            onToggle={toggle}
            emptyMessage="No custom report matches that search."
          />
        </section>
      </div>
    </Drawer>
  );
}
