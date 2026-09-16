'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Drawer } from '@ds/components';
import { OPERATIONAL_REPORTS, type ComplianceClause } from '@/data/reports';
import { ReportStateChip } from './ReportStateChip';

/**
 * Pre-audit gap resolver — every clause that would embarrass this package, and the one
 * action that closes each.
 *
 * It is a drawer rather than a page because resolving a gap is done *against* the clause
 * matrix: you fix one, watch the banner count drop, and carry on. Sending the reader to a
 * separate screen would make them lose the list they were working through.
 *
 * Grouped by what is wrong, not by clause number. "Nothing is attached" and "what is
 * attached only holds current state" need different actions — one wants a register bound,
 * the other wants a register that covers a period — and a list sorted by clause number
 * interleaves them so the reader re-reads the distinction on every row.
 */
export function EvidenceGapDrawer({
  open,
  gaps,
  onClose,
  onAttach,
}: {
  open: boolean;
  gaps: ComplianceClause[];
  onClose: () => void;
  onAttach: (clause: ComplianceClause) => void;
}) {
  const router = useRouter();
  const unevidenced = gaps.filter((g) => g.state === 'notEvidenced');
  const partial = gaps.filter((g) => g.state === 'partial');

  const Row = ({ clause }: { clause: ComplianceClause }) => (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm-medium text-text-primary">{clause.clause}</span>
          {clause.subClause !== 'N/A' && (
            <span className="text-caption text-text-secondary">{clause.subClause}</span>
          )}
          <ReportStateChip state={clause.state} />
        </div>
        <p className="mt-1 text-body-sm text-text-secondary">{clause.requirement}</p>
        {clause.evidencedBy && (
          <p className="mt-1 text-caption text-text-tertiary">Currently: {clause.evidencedBy}</p>
        )}
      </div>
      <Button size="xs" variant="secondary" onClick={() => onAttach(clause)}>
        {clause.evidencedBy ? 'Change' : 'Attach'}
      </Button>
    </li>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${gaps.length} evidence ${gaps.length === 1 ? 'gap' : 'gaps'}`}
      subtitle="What an assessor would open this package and fail to find."
      width={560}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {unevidenced.length > 0 && (
          <section>
            <h3 className="text-body-sm-strong text-text-primary">Nothing attached</h3>
            <p className="mt-0.5 text-caption text-text-secondary">
              {unevidenced.length} {unevidenced.length === 1 ? 'clause has' : 'clauses have'} no register behind them.
              They seal as Not evidenced.
            </p>
            <ul className="mt-2 divide-y divide-border-subtle">
              {unevidenced.map((c) => (
                <Row key={c.id} clause={c} />
              ))}
            </ul>
          </section>
        )}

        {partial.length > 0 && (
          <section>
            <h3 className="text-body-sm-strong text-text-primary">Attached, but incomplete</h3>
            <p className="mt-0.5 text-caption text-text-secondary">
              The bound register answers part of the requirement — usually current state where the clause asks about a
              period. These read as answered until someone checks.
            </p>
            <ul className="mt-2 divide-y divide-border-subtle">
              {partial.map((c) => (
                <Row key={c.id} clause={c} />
              ))}
            </ul>
          </section>
        )}

        <div className="rounded-lg border border-border bg-subtle px-4 py-3">
          <p className="text-body-sm text-text-secondary">
            Some gaps are not evidence problems — a clause with no register in the catalogue needs the register built,
            not bound. {OPERATIONAL_REPORTS.filter((r) => !r.href).length} in this catalogue are still to come.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/iga/reports');
            }}
            className="mt-2 rounded-sm text-body-sm-medium text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            See the register catalogue
          </button>
        </div>
      </div>
    </Drawer>
  );
}
