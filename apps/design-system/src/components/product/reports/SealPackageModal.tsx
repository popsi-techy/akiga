'use client';

import * as React from 'react';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { Button, InfoRow, InfoRowGroup, Modal, Tooltip, useToast } from '@ds/components';
import { infoIcon } from '@/components/product/directory/infoIcons';
import type { ComplianceFramework, ComplianceClause } from '@/data/reports';
import { clauseCoverage, sealOutcome } from '@/data/reports';
import { formatDate, formatDateTime } from '@/lib/datetime';
import { ReportStateChip } from './ReportStateChip';

/** A deterministic stand-in for the digest the server would compute. */
function fakeDigest(seed: string) {
  let h = 0x811c9dc5;
  const out: string[] = [];
  for (let i = 0; i < 64; i += 1) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 0x01000193) >>> 0;
    out.push('0123456789abcdef'[h % 16]);
  }
  return out.join('');
}

/**
 * Sealing, and what sealing commits you to.
 *
 * A modal rather than a button that just does it, because this is the one irreversible
 * action in the module: the package is snapshotted, hashed, and quoted back by an assessor
 * by its digest. The reader has to see three things before committing — the window, what
 * the seal will *say* about coverage, and that gaps do not block it — and a confirm dialog
 * is the only place all three fit without leaving the page.
 *
 * It seals as PARTIAL rather than refusing. A package that cannot be produced until every
 * clause is green is a package nobody can produce, and an honest partial with the gaps
 * named inside it is worth more to an assessor than a missing artefact.
 */
export function SealPackageModal({
  open,
  framework,
  clauses,
  periodFrom,
  periodTo,
  onClose,
}: {
  open: boolean;
  framework: ComplianceFramework;
  clauses: ComplianceClause[];
  periodFrom: string;
  periodTo: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [sealing, setSealing] = React.useState(false);
  const [sealed, setSealed] = React.useState<{ id: string; sha256: string; at: string } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSealing(false);
      setSealed(null);
    }
  }, [open]);

  const coverage = clauseCoverage(clauses);
  const outcome = sealOutcome(clauses);
  const gaps = coverage.partial + coverage.notEvidenced;

  const seal = () => {
    setSealing(true);
    const at = new Date().toISOString();
    const id = `PKG-${fakeDigest(framework.id + at).slice(0, 8).toUpperCase()}`;
    window.setTimeout(() => {
      setSealing(false);
      setSealed({ id, sha256: fakeDigest(id + periodFrom + periodTo), at });
      toast.success('Package sealed. It is now in Package history.');
    }, 700);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy to the clipboard.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sealed ? 'Package sealed' : 'Seal this package?'}
      subtitle={sealed ? undefined : 'A sealed package is a snapshot. It cannot be edited or re-sealed for this window.'}
      width={560}
      footer={
        sealed ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={sealing}>
              Cancel
            </Button>
            <Button onClick={seal} loading={sealing}>
              Seal package
            </Button>
          </>
        )
      }
    >
      {sealed ? (
        <div className="space-y-4">
          <InfoRowGroup>
            <InfoRow icon={infoIcon.item} label="Package ID" value={sealed.id} />
            <InfoRow icon={infoIcon.completed} label="Sealed" value={formatDateTime(sealed.at)} />
            <InfoRow
              icon={infoIcon.status}
              label="Seal"
              valueWrap
              value={<ReportStateChip state={outcome} />}
            />
          </InfoRowGroup>

          {/*
            Shown in full, wrapped, never truncated. The digest is the reference an
            assessor quotes back at you months later; an ellipsis in the middle of it makes
            the one durable identifier on this screen unusable for the one job it has.
          */}
          <div className="rounded-lg border border-border bg-subtle px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-caption-strong uppercase tracking-wider text-text-tertiary">SHA-256</p>
                <p className="mt-1 break-all font-mono text-caption leading-6 text-text-primary">{sealed.sha256}</p>
              </div>
              <Tooltip title="Copy digest">
                <button
                  type="button"
                  aria-label="Copy SHA-256 digest"
                  onClick={() => copy(sealed.sha256, 'Digest')}
                  className="shrink-0 rounded-md p-1.5 text-icon hover:bg-surface-hover hover:text-text-primary"
                >
                  <ContentCopyOutlined sx={{ fontSize: 18 }} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <InfoRowGroup>
            <InfoRow icon={infoIcon.application} label="Framework" value={`${framework.name} · ${framework.version}`} />
            <InfoRow
              icon={infoIcon.started}
              label="Period covered"
              value={`${formatDate(periodFrom)} – ${formatDate(periodTo)}`}
            />
            <InfoRow
              icon={infoIcon.status}
              label="Would seal as"
              valueWrap
              value={<ReportStateChip state={outcome} />}
            />
            <InfoRow
              icon={infoIcon.entitlement}
              label="Clauses evidenced"
              value={`${coverage.evidenced} of ${coverage.total}`}
            />
          </InfoRowGroup>

          {gaps > 0 && (
            <p className="rounded-lg border border-border bg-subtle px-4 py-3 text-body-sm text-text-secondary">
              <span className="font-emphasis text-text-primary">
                {gaps} {gaps === 1 ? 'clause is' : 'clauses are'} not fully evidenced.
              </span>{' '}
              They are named inside the package rather than left out of it — an assessor sees the gap and the reason,
              which is worth more than a missing artefact. Close them first if you would rather seal clean.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
