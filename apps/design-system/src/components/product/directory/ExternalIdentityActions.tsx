'use client';

import * as React from 'react';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import {
  Button,
  DatePicker,
  Dialog,
  Menu,
  Select,
  StatusChip,
  useToast,
} from '@ds/components';
import { listSponsorCandidates, type UserIdentityRow } from '@/data/directory';
import {
  assignSponsor,
  endContract,
  extendContract,
  recordSponsorDecision,
  resumeAccess,
  suspendAccess,
} from '@/data/external-lifecycle';

type DialogKind = 'extend' | 'end' | 'sponsor' | null;

/**
 * Everything you can do to an external identity, in one place.
 *
 * The set of actions is a function of state, not layout, so the list cells, the
 * detail header and both personas share this component and can never offer an
 * action the row cannot take. `variant` only changes how they are shown — icon
 * buttons and a kebab in a table row, full buttons on the detail header — and
 * `role` gates the two admin-only moves (assign / change sponsor).
 */
export function ExternalIdentityActions({
  row,
  role,
  variant = 'row',
  onChanged,
}: {
  row: UserIdentityRow;
  role: 'admin' | 'reviewer';
  variant?: 'row' | 'header';
  onChanged: () => void;
}) {
  const toast = useToast();
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  const [extendDate, setExtendDate] = React.useState('');
  const [sponsorPick, setSponsorPick] = React.useState('');

  const candidates = React.useMemo(() => listSponsorCandidates(), []);
  const isAdmin = role === 'admin';

  const done = (message: string) => {
    setDialog(null);
    onChanged();
    toast.success(message);
  };

  const decide = (decision: 'approved' | 'rejected') => {
    recordSponsorDecision(row.id, decision);
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
  const confirmSponsor = () => {
    if (!sponsorPick) return;
    const wasUnsponsored = !row.sponsorId;
    const name = candidates.find((c) => c.id === sponsorPick)?.name ?? 'the new sponsor';
    assignSponsor(row.id, sponsorPick, wasUnsponsored, name);
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
    setSponsorPick(row.sponsorId ?? '');
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
    ...(isAdmin
      ? [{ label: 'Change sponsor', icon: <PersonSearchOutlined sx={{ fontSize: 18 }} />, onClick: openSponsor }]
      : []),
    {
      label: 'End contract',
      icon: <BlockOutlined sx={{ fontSize: 18 }} />,
      danger: true,
      onClick: () => setDialog('end'),
    },
  ];

  const dialogs = (
    <>
      <Dialog
        open={dialog === 'extend'}
        onClose={() => setDialog(null)}
        title={`Extend ${row.name}'s contract`}
        confirmLabel="Extend"
        onConfirm={confirmExtend}
      >
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-text-secondary">
            Pick the new date their access should end. Everything else stays as it is.
          </p>
          <div className="flex flex-col gap-1.5">
            <span className="text-body-sm-strong text-text-primary">New end date</span>
            <DatePicker
              ariaLabel="New end date"
              value={extendDate}
              onChange={setExtendDate}
              min={row.accessEndsOn ?? undefined}
            />
          </div>
        </div>
      </Dialog>

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

      <Dialog
        open={dialog === 'sponsor'}
        onClose={() => setDialog(null)}
        title={row.sponsorId ? `Change ${row.name}'s sponsor` : `Assign a sponsor to ${row.name}`}
        confirmLabel={row.sponsorId ? 'Change sponsor' : 'Assign sponsor'}
        onConfirm={confirmSponsor}
      >
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-text-secondary">
            The sponsor answers for this external identity and approves their onboarding.
          </p>
          <Select
            label="Sponsor"
            placeholder="Choose a person…"
            value={sponsorPick}
            onChange={setSponsorPick}
            options={candidates.map((c) => ({ value: c.id, label: `${c.name} — ${c.jobTitle}` }))}
          />
        </div>
      </Dialog>
    </>
  );

  // ---- Detail header: full buttons ------------------------------------
  if (variant === 'header') {
    return (
      <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {pendingApproval && (
          <>
            <Button variant="secondary" startIcon={<CancelOutlined sx={{ fontSize: 18 }} />} onClick={() => decide('rejected')}>
              Reject
            </Button>
            <Button startIcon={<CheckCircleOutline sx={{ fontSize: 18 }} />} onClick={() => decide('approved')}>
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
                ...(isAdmin
                  ? [{ label: 'Change sponsor', icon: <PersonSearchOutlined sx={{ fontSize: 18 }} />, onClick: openSponsor }]
                  : []),
                { label: 'End contract', icon: <BlockOutlined sx={{ fontSize: 18 }} />, danger: true, onClick: () => setDialog('end') },
              ]}
            />
          </>
        )}
        {dialogs}
      </div>
    );
  }

  // ---- List row: icons + kebab ----------------------------------------
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {pendingApproval && (
        <>
          <button
            type="button"
            aria-label={`Approve ${row.name}`}
            onClick={() => decide('approved')}
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--ds-color-status-success-fg)] transition-colors hover:bg-[var(--ds-color-status-success-subtle)]"
          >
            <CheckCircleOutline sx={{ fontSize: 20 }} />
          </button>
          <button
            type="button"
            aria-label={`Reject ${row.name}`}
            onClick={() => decide('rejected')}
            className="grid h-8 w-8 place-items-center rounded-md text-danger transition-colors hover:bg-[var(--ds-color-status-danger-subtle)]"
          >
            <CancelOutlined sx={{ fontSize: 20 }} />
          </button>
        </>
      )}

      {noSponsor &&
        (isAdmin ? (
          <button
            type="button"
            onClick={openSponsor}
            className="rounded-sm px-1 text-body-sm-strong text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            Assign sponsor
          </button>
        ) : (
          <span className="text-body-sm text-text-tertiary">—</span>
        ))}

      {live && (
        <Menu ariaLabel={`Actions for ${row.name}`} items={lifecycleItems} />
      )}

      {closed && (
        <StatusChip intent="neutral" label={row.status === 'terminated' ? 'Terminated' : 'Disabled'} />
      )}

      {dialogs}
    </div>
  );
}

export default ExternalIdentityActions;
