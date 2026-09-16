'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForward from '@mui/icons-material/ArrowForward';
import { Meter, StatusChip } from '@ds/components';
import {
  COMPLIANCE_FRAMEWORKS,
  SAMA_CLAUSES,
  clauseCoverage,
  clausesForFramework,
  evidenceGaps,
  sealOutcome,
  type ComplianceFramework,
} from '@/data/reports';
import { ReportStateChip } from './ReportStateChip';

/**
 * The frameworks this tenant can produce a sealed package for.
 *
 * The live card leads with readiness, not with a description. This is where the hub's
 * "compliance readiness" number went when the KPI strip came off the landing page — and it
 * is better here than it was there, because on the landing page it was a figure with
 * nowhere to go, while on the card it is the reason you click the card.
 *
 * Built from a bordered panel rather than `NavCard`: a NavCard carries a title, a
 * description and tags, and readiness needs a bar and two states beside it. The frameworks
 * still to come stay on the quieter treatment — they have nothing to report yet, and a
 * greyed-out coverage bar reading zero would say "nothing is evidenced" when the truth is
 * "we have not built this".
 */
export function CompliancePackagesTab() {
  const router = useRouter();

  return (
    /* No lead-in sentence. "Choose a framework to see what a sealed evidence package would
       contain" described the cards directly beneath it, which are three cards, each named,
       each with an arrow — the instruction was the only thing on the tab that did not tell
       the reader something they could not already see. */
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {COMPLIANCE_FRAMEWORKS.map((f) =>
        f.href ? (
          <LiveFramework key={f.id} framework={f} onOpen={() => router.push(f.href as string)} />
        ) : (
          <ComingSoonFramework key={f.id} framework={f} />
        ),
      )}
    </div>
  );
}

function LiveFramework({ framework, onOpen }: { framework: ComplianceFramework; onOpen: () => void }) {
  const clauses = clausesForFramework(framework.id);
  const coverage = clauseCoverage(clauses.length > 0 ? clauses : SAMA_CLAUSES);
  const gaps = evidenceGaps(clauses).length;
  const outcome = sealOutcome(clauses);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-body-strong text-text-primary">{framework.name}</h3>
          <p className="mt-0.5 text-caption text-text-tertiary">{framework.version}</p>
        </div>
        <span className="shrink-0 text-icon-subtle transition-colors group-hover:text-text-primary">
          <ArrowForward sx={{ fontSize: 18 }} />
        </span>
      </div>

      <p className="mt-3 text-body-sm text-text-secondary">{framework.description}</p>

      {/* Readiness, at the bottom where the eye lands last — the description says what the
          framework is, and this says where you stand in it. */}
      <div className="mt-4 space-y-2 border-t border-border-subtle pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-body-sm-medium text-text-primary">
            <span className="tabular-nums">{coverage.evidenced}</span> of{' '}
            <span className="tabular-nums">{coverage.total}</span> clauses evidenced
          </span>
          <ReportStateChip state={outcome} />
        </div>
        <Meter
          value={coverage.evidenced}
          max={coverage.total}
          tone={gaps === 0 ? 'success' : 'warning'}
          size="sm"
        />
        <p className="text-caption text-text-secondary">
          {gaps === 0
            ? 'Every clause in scope has evidence behind it.'
            : `${gaps} ${gaps === 1 ? 'clause needs' : 'clauses need'} attention before this seals clean.`}
        </p>
      </div>
    </button>
  );
}

function ComingSoonFramework({ framework }: { framework: ComplianceFramework }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-5">
      <div className="min-w-0">
        <h3 className="text-body-strong text-text-tertiary">{framework.name}</h3>
        <p className="mt-0.5 text-caption text-text-tertiary">{framework.version}</p>
      </div>
      <p className="mt-3 flex-1 text-body-sm text-text-tertiary">{framework.description}</p>
      <div className="mt-4 flex">
        <StatusChip intent="neutral" label="Coming soon" />
      </div>
    </div>
  );
}
