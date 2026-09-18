'use client';

import * as React from 'react';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import { Avatar, Button, DatePicker, Dialog, Drawer, Menu, Tooltip, useToast } from '@ds/components';
import { getUser, listSponsorCandidates, type UserIdentityRow } from '@/data/directory';
import {
  assignSponsor,
  endContract,
  extendContract,
  recordSponsorDecision,
  resumeAccess,
  suspendAccess,
} from '@/data/external-lifecycle';
import { SponsorDecisionDrawer } from './SponsorDecisionDrawer';
import { TableSelectDrawer } from '@/components/product/automation/TableSelectDrawer';

type DialogKind = 'extend' | 'end' | 'sponsor' | null;

/** Same square as Access Certification's Belongs to me / Does not belong to me. */
function decideIconClass(tone: 'success' | 'danger') {
  const idle =
    'grid h-8 w-8 place-items-center rounded-md border border-border bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle';
  return tone === 'success'
    ? `${idle} text-[var(--ds-color-status-success-fg)] hover:bg-[var(--ds-color-status-success-subtle)]`
    : `${idle} text-[var(--ds-color-status-danger-fg)] hover:bg-[var(--ds-color-status-danger-subtle)]`;
}

/**
 * Everything you can do to an external identity, in one place.
 *
 * The set of actions is a function of state, not layout, so the list cells, the
 * detail header and both personas share this component and can never offer an
 * action the row cannot take. `variant` only changes how they are shown — icon
 * buttons and a kebab in a table row, full buttons on the detail header — and
 * `role` gates the admin-only sponsor assign / change, which lives in the
 * Sponsor column — not in the row kebab.
 */
export function ExternalIdentityActions({
  row,
  role,
  variant = 'row',
  onChanged,
}: {
  row: UserIdentityRow;
  role: 'admin' | 'reviewer';
  variant?: 'row' | 'header' | 'assign-link';
  onChanged: () => void;
}) {
  const toast = useToast();
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  const [decideOpen, setDecideOpen] = React.useState<'approved' | 'rejected' | null>(null);
  const [extendDate, setExtendDate] = React.useState('');

  const candidates = React.useMemo(() => listSponsorCandidates(), []);
  const isAdmin = role === 'admin';

  const done = (message: string) => {
    setDialog(null);
    onChanged();
    toast.success(message);
  };

  const decide = (decision: 'approved' | 'rejected', payload: { startsOn?: string; endsOn?: string; justification: string }) => {
    recordSponsorDecision(row.id, decision, payload);
    setDecideOpen(null);
    onChanged();
    toast.success(
      decision === 'approved'
        ? `${row.name} is onboarded. Their access will provision.`
        : `${row.name} was rejected. Their access stays disabled.`,
    );
  };

  const doSuspend = () => {
    suspendAccess(row.id);
    onChanged();
    toast.success(`${row.name}'s access is suspended. Resume it when they return.`);
  };
  const doResume = () => {
    resumeAccess(row.id);
    onChanged();
    toast.success(`${row.name}'s access is live again.`);
  };

  const confirmExtend = () => {
    if (!extendDate) return;
    extendContract(row.id, extendDate);
    done(`Contract extended to ${extendDate}.`);
  };
  const confirmEnd = () => {
    endContract(row.id);
    done(`${row.name}'s contract has ended. Their access is revoked.`);
  };
  const confirmSponsor = (ids: string[]) => {
    const id = ids[0];
    if (!id) return;
    const wasUnsponsored = !row.sponsorId;
    const name = candidates.find((c) => c.id === id)?.name ?? 'the new sponsor';
    assignSponsor(row.id, id, wasUnsponsored, name);
    done(
      wasUnsponsored
        ? `${name} now sponsors ${row.name}. It is waiting on their approval.`
        : `${name} now sponsors ${row.name}.`,
    );
  };

  const openExtend = () => {
    setExtendDate(row.accessEndsOn ?? '');
    setDialog('extend');
  };
  const openSponsor = () => {
    setDialog('sponsor');
  };

  const pendingApproval = row.status === 'pending-approval';
  const noSponsor = row.status === 'pending-sponsor';
  const live = row.status === 'active' || row.status === 'suspended';
  const closed = row.status === 'inactive' || row.status === 'terminated';

  // The lifecycle menu shared by active/suspended rows.
  const lifecycleItems = [
    { label: 'Extend contract', icon: <EventRepeatOutlined sx={{ fontSize: 18 }} />, onClick: openExtend },
    row.status === 'suspended'
      ? { label: 'Resume access', icon: <PlayCircleOutlined sx={{ fontSize: 18 }} />, onClick: doResume }
      : { label: 'Suspend access', icon: <PauseCircleOutlined sx={{ fontSize: 18 }} />, onClick: doSuspend },
    {
      label: 'End contract',
      icon: <BlockOutlined sx={{ fontSize: 18 }} />,
      danger: true,
      onClick: () => setDialog('end'),
    },
  ];

  const dialogs = (
    <>
      <Drawer
        open={dialog === 'extend'}
        onClose={() => setDialog(null)}
        title={`Extend ${row.name}'s contract`}
        subtitle="Pick the new date their access should end. Everything else stays as it is."
        icon={<EventRepeatOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmExtend} disabled={!extendDate}>
              Extend
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-body-sm-strong text-text-primary">New end date</span>
          <DatePicker
            ariaLabel="New end date"
            value={extendDate}
            onChange={setExtendDate}
            min={row.accessEndsOn ?? undefined}
          />
        </div>
      </Drawer>

      <Dialog
        open={dialog === 'end'}
        onClose={() => setDialog(null)}
        title={`End ${row.name}'s contract?`}
        confirmLabel="End contract"
        tone="danger"
        onConfirm={confirmEnd}
      >
        Their access is revoked immediately and the identity is marked terminated. This does not
        delete their account — reconciliation records what they held.
      </Dialog>

      <TableSelectDrawer
        open={dialog === 'sponsor'}
        onClose={() => setDialog(null)}
        title={row.sponsorId ? `Change ${row.name}'s sponsor` : `Assign a sponsor to ${row.name}`}
        subtitle="The sponsor answers for this external identity and approves their onboarding."
        icon={<PersonAddAltOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Name"
        descriptionHeader="Email"
        entity="sponsor"
        selectionMode="single"
        confirmLabel={row.sponsorId ? 'Change sponsor' : 'Assign sponsor'}
        showRisk={false}
        selectedIds={row.sponsorId ? [row.sponsorId] : []}
        rows={candidates.map((c) => ({ id: c.id, name: c.name, description: c.email }))}
        onApply={confirmSponsor}
      />
    </>
  );

  const decisionDrawer = (
    <SponsorDecisionDrawer
      open={decideOpen !== null}
      decision={decideOpen}
      names={[row.name]}
      onClose={() => setDecideOpen(null)}
      onConfirm={(payload) => decideOpen && decide(decideOpen, payload)}
    />
  );

  // ---- Sponsor column: name + edit, or "+ Add sponsor" -------------------
  if (variant === 'assign-link') {
    if (!isAdmin) {
      const name = row.sponsorId ? getUser(row.sponsorId)?.name : null;
      return name ? (
        <span className="inline-flex min-w-0 items-center gap-2">
          <Avatar name={name} size="xs" kind="person" />
          <span className="truncate text-body-sm text-text-primary" title={name}>
            {name}
          </span>
        </span>
      ) : (
        <span className="text-text-tertiary">—</span>
      );
    }
    const name = row.sponsorId ? getUser(row.sponsorId)?.name : null;
    return (
      <div className="flex min-w-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {name ? (
          <>
            <span className="inline-flex min-w-0 flex-1 items-center gap-2">
              <Avatar name={name} size="xs" kind="person" />
              <span className="truncate text-body-sm text-text-primary" title={name}>
                {name}
              </span>
            </span>
            <Tooltip title="Change sponsor">
              <button
                type="button"
                onClick={openSponsor}
                aria-label={`Change sponsor for ${row.name}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-icon hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                <EditOutlined sx={{ fontSize: 16 }} />
              </button>
            </Tooltip>
          </>
        ) : (
          <button
            type="button"
            onClick={openSponsor}
            aria-label={`Add a sponsor for ${row.name}`}
            className="rounded-sm text-body-sm text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            + Add sponsor
          </button>
        )}
        {dialogs}
      </div>
    );
  }

  // ---- Detail header: full buttons ------------------------------------
  if (variant === 'header') {
    return (
      <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {pendingApproval && !isAdmin && (
          <>
            <Button variant="secondary" startIcon={<CancelOutlined sx={{ fontSize: 18 }} />} onClick={() => setDecideOpen('rejected')}>
              Reject
            </Button>
            <Button startIcon={<CheckCircleOutline sx={{ fontSize: 18 }} />} onClick={() => setDecideOpen('approved')}>
              Approve onboarding
            </Button>
          </>
        )}
        {noSponsor && isAdmin && <Button onClick={openSponsor}>Assign sponsor</Button>}
        {live && (
          <>
            {row.status === 'suspended' ? (
              <Button variant="secondary" startIcon={<PlayCircleOutlined sx={{ fontSize: 18 }} />} onClick={doResume}>
                Resume access
              </Button>
            ) : (
              <Button variant="secondary" startIcon={<PauseCircleOutlined sx={{ fontSize: 18 }} />} onClick={doSuspend}>
                Suspend access
              </Button>
            )}
            <Button variant="secondary" startIcon={<EventRepeatOutlined sx={{ fontSize: 18 }} />} onClick={openExtend}>
              Extend contract
            </Button>
            <Menu
              ariaLabel={`More actions for ${row.name}`}
              items={[
                { label: 'End contract', icon: <BlockOutlined sx={{ fontSize: 18 }} />, danger: true, onClick: () => setDialog('end') },
              ]}
            />
          </>
        )}
        {dialogs}
        {decisionDrawer}
      </div>
    );
  }

  // ---- List row: icons + kebab ----------------------------------------
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {pendingApproval && !isAdmin && (
        <>
          <Tooltip title="Approve">
            <button
              type="button"
              aria-label={`Approve ${row.name}`}
              onClick={() => setDecideOpen('approved')}
              className={decideIconClass('success')}
            >
              <HowToRegOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
          <Tooltip title="Reject">
            <button
              type="button"
              aria-label={`Reject ${row.name}`}
              onClick={() => setDecideOpen('rejected')}
              className={decideIconClass('danger')}
            >
              <PersonOffOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
        </>
      )}

      {pendingApproval && isAdmin && <span className="text-body-sm text-text-tertiary">—</span>}

      {noSponsor && <span className="text-body-sm text-text-tertiary">—</span>}

      {live && (
        <Menu ariaLabel={`Actions for ${row.name}`} items={lifecycleItems} />
      )}

      {/* Closed rows have no move left — Identity status already says so. A chip here
          restated the row's state in the action column and looked like a control. */}
      {closed && <span className="text-body-sm text-text-tertiary">—</span>}

      {dialogs}
      {decisionDrawer}
    </div>
  );
}

export default ExternalIdentityActions;
