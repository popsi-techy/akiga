'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, useToast, type TabItem } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  canInterveneApproval,
  convertToTicket,
  forceApprove,
  getGovernanceRequest,
  slaStatusOf,
  isProvisioningFailed,
  markManuallyCompleted,
  nudgeApprover,
  reassignApprover,
  retryProvisioning,
  setAutoEscalate,
  type GovernanceRequest,
} from '@/data/request-governance';
import { DetailShell } from '@/components/product/directory';
import {
  ForceApproveDialog,
  NudgeDialog,
  ProvisioningFailureModal,
  ReassignDialog,
  RequestSummary,
  RequestTimeline,
  ResourceTypeAvatar,
  SlaStatusChip,
  requestSubtitle,
} from '@/components/product/request-governance';

type DialogKind = 'nudge' | 'reassign' | 'override' | 'failure' | null;

export default function RequestGovernanceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [row, setRow] = React.useState<GovernanceRequest | null | undefined>(undefined);
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  const [tab, setTab] = React.useState('overview');

  const refresh = React.useCallback(() => {
    setRow(getGovernanceRequest(params.id) ?? null);
  }, [params.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useSetBreadcrumbs(
    row
      ? [{ label: 'Request Governance', href: '/iga/request-governance' }, { label: row.reference }]
      : [{ label: 'Request Governance', href: '/iga/request-governance' }],
  );

  if (row === undefined) {
    return (
      <div className="mx-auto max-w-4xl py-16">
        <p className="text-body text-text-secondary">Loading request…</p>
      </div>
    );
  }

  if (row === null) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <h1 className="text-h3 text-text-primary">Request not found</h1>
        <p className="mt-2 text-body text-text-secondary">
          It may have been removed from this prototype store.
        </p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => router.push('/iga/request-governance')}>
            Back to Request Governance
          </Button>
        </div>
      </div>
    );
  }

  const failed = isProvisioningFailed(row);
  const intervene = canInterveneApproval(row);

  /*
    The same identity band every other detail screen uses, rather than a bare h1 in a
    centred column: mark, reference, what it is for, its state, and the actions — then
    tabs for the three things there are to read about a request.

    Two tabs, not three. Overview answers "what is this and how risky"; Timeline answers
    "what has happened to it". Lifecycle and Audit Trail were both the second question at
    two grains, and splitting them hid the one thing they were jointly for — the order
    events happened in. See `RequestTimeline` for how the two streams merge.
  */
  const tabs: TabItem[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'timeline', label: 'Timeline' },
  ];

  return (
    <>
      <DetailShell
        avatar={
          <ResourceTypeAvatar
            type={row.resourceType}
            name={row.resourceName}
            appType={row.appType ?? row.appName}
            size="md"
          />
        }
        title={row.reference}
        description={requestSubtitle(row)}
        chips={<SlaStatusChip status={slaStatusOf(row)} />}
        actions={
          <>
            {intervene && (
              <>
                <Button variant="tertiary" onClick={() => setDialog('nudge')}>
                  Nudge approver
                </Button>
                <Button variant="tertiary" onClick={() => setDialog('reassign')}>
                  Reassign
                </Button>
                <Button variant="secondary" onClick={() => setDialog('override')}>
                  Force approve
                </Button>
              </>
            )}
            {failed && <Button onClick={() => setDialog('failure')}>Handle failure</Button>}
            {!row.closedAt && !failed && !intervene && (
              <Button variant="secondary" onClick={() => setDialog('override')}>
                Force approve
              </Button>
            )}
          </>
        }
        tabs={tabs}
        tab={tab}
        onTab={setTab}
      >
        <div className="ds-scroll h-full overflow-y-auto pr-0.5">
          <div className="max-w-4xl pb-8">
            {/* The identity band above already carries the SLA chip, on every tab. */}
            {tab === 'overview' && <RequestSummary row={row} hideSlaStatus />}
            {tab === 'timeline' && <RequestTimeline row={row} />}
          </div>
        </div>
      </DetailShell>

      <NudgeDialog
        row={row}
        open={dialog === 'nudge'}
        onClose={() => setDialog(null)}
        onConfirm={(channel) => {
          nudgeApprover(row.id, channel);
          refresh();
          setDialog(null);
          toast.success(`Nudge sent over ${channel === 'email' ? 'email' : channel === 'teams' ? 'Teams' : 'Slack'}.`);
        }}
      />
      <ReassignDialog
        row={row}
        open={dialog === 'reassign'}
        onClose={() => setDialog(null)}
        onConfirm={(reviewerId, reason) => {
          reassignApprover(row.id, reviewerId, reason);
          refresh();
          setDialog(null);
          toast.success('Approver reassigned.');
        }}
      />
      <ForceApproveDialog
        row={row}
        open={dialog === 'override'}
        onClose={() => setDialog(null)}
        onConfirm={(reason) => {
          forceApprove(row.id, reason);
          refresh();
          setDialog(null);
          toast.success(`${row.reference} sent to provisioning.`);
        }}
      />
      <ProvisioningFailureModal
        row={row}
        open={dialog === 'failure'}
        onClose={() => setDialog(null)}
        onAutoEscalate={(enabled) => {
          setAutoEscalate(row.id, enabled);
          refresh();
          toast.success(enabled ? 'Auto-alert is on.' : 'Auto-alert is off.');
        }}
        onRetry={() => {
          retryProvisioning(row.id);
          refresh();
          setDialog(null);
          toast.success('Provisioning retried.');
        }}
        onConvertTicket={(system) => {
          const next = convertToTicket(row.id, system);
          refresh();
          setDialog(null);
          toast.success(next?.ticketRef ? `Opened ${next.ticketRef}.` : 'Ticket created.');
        }}
        onMarkComplete={(proof) => {
          markManuallyCompleted(row.id, proof);
          refresh();
          setDialog(null);
          toast.success(`${row.reference} marked complete.`);
        }}
      />
    </>
  );
}
