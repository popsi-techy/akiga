'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import { Button, StatusChip, useToast } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  convertToTicket,
  getGovernanceRequest,
  cartStatusMeta,
  isProvisioningFailed,
  markManuallyCompleted,
  requestItems,
  retryProvisioning,
  setAutoEscalate,
  type GovernanceRequest,
} from '@/data/request-governance';
import { DetailShell } from '@/components/product/directory';
import {
  ProvisioningFailureModal,
  RequestFlowBoard,
  RequestHeaderFacts,
  ResourceTypeAvatar,
} from '@/components/product/request-governance';

/**
 * Only the provisioning failure is handled from the page header now.
 *
 * Nudge, Reassign and Force approve were request-level buttons on a page whose body is
 * per-line: a cart can hold four lines sitting at four different stages, so "nudge the
 * approver" had no single answer to *which* approver. They belong on the stage that is
 * actually waiting, and the stage panel is where that will be.
 */
type DialogKind = 'failure' | null;

export default function RequestGovernanceDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [row, setRow] = React.useState<GovernanceRequest | null | undefined>(undefined);
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  // Which cart line the board is showing. `?item=` is a deep link into the rail, not a
  // second surface — landing on one selects it rather than opening anything over it.
  const [itemId, setItemId] = React.useState<string | null>(search.get('item'));

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
  const items = requestItems(row);
  const first = items[0];
  const cartStatus = cartStatusMeta(row);

  return (
    <>
      <DetailShell
        avatar={
          items.length > 1 ? (
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-subtle text-icon-brand">
              <FactCheckOutlined sx={{ fontSize: 22 }} />
            </span>
          ) : (
            <ResourceTypeAvatar
              type={first.resourceType}
              name={first.resourceName}
              appType={first.appType ?? first.appName}
              size="md"
            />
          )
        }
        title={row.reference}
        description={<RequestHeaderFacts row={row} />}
        chips={<StatusChip intent={cartStatus.intent} dot={false} label={cartStatus.label} />}
        actions={failed ? <Button onClick={() => setDialog('failure')}>Handle failure</Button> : undefined}
      >
        <RequestFlowBoard
          row={row}
          selectedItemId={itemId}
          onSelectItem={(item) => {
            setItemId(item.id);
            router.replace(`/iga/request-governance/${row.id}?item=${item.id}`, { scroll: false });
          }}
        />
      </DetailShell>

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
