'use client';

import * as React from 'react';
import Link from 'next/link';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import { Button, Drawer } from '@ds/components';
import {
  canInterveneApproval,
  isProvisioningFailed,
  type GovernanceRequest,
} from '@/data/request-governance';
import { RequestDetailBody, requestSubtitle } from './RequestDetailBody';

export function RequestGovernanceDrawer({
  row,
  open,
  onClose,
  onNudge,
  onReassign,
  onForceApprove,
  onHandleFailure,
}: {
  row: GovernanceRequest | null;
  open: boolean;
  onClose: () => void;
  onNudge: () => void;
  onReassign: () => void;
  onForceApprove: () => void;
  onHandleFailure: () => void;
}) {
  const failed = row ? isProvisioningFailed(row) : false;
  const intervene = row ? canInterveneApproval(row) : false;
  const closed = Boolean(row?.closedAt);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={800}
      title={row?.reference ?? 'Request'}
      subtitle={row ? requestSubtitle(row) : undefined}
      icon={<FactCheckOutlined sx={{ fontSize: 22 }} />}
      footer={
        row && (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {intervene && (
              <>
                <Button variant="tertiary" onClick={onNudge}>
                  Nudge approver
                </Button>
                <Button variant="tertiary" onClick={onReassign}>
                  Reassign
                </Button>
                <Button variant="secondary" onClick={onForceApprove}>
                  Force approve
                </Button>
              </>
            )}
            {failed && (
              <Button onClick={onHandleFailure}>Handle failure</Button>
            )}
            {!closed && !failed && !intervene && row.currentStage !== 'provisioning' && (
              <Button variant="secondary" onClick={onForceApprove}>
                Force approve
              </Button>
            )}
          </>
        )
      }
    >
      {row && (
        <div>
          <div className="mb-5">
            <Link
              href={`/iga/request-governance/${row.id}`}
              className="text-body-sm-strong text-text-link hover:underline"
            >
              Open full page
            </Link>
          </div>
          <RequestDetailBody row={row} />
        </div>
      )}
    </Drawer>
  );
}
