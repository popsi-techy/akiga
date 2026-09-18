'use client';

import * as React from 'react';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import { Button, DatePicker, Drawer, Input, useToast } from '@ds/components';

const MIN_JUSTIFICATION = 10;

/**
 * The form behind a sponsor's yes or no.
 *
 * Approve is when the access period exists — start, end, and a sentence saying
 * why. Reject only needs the sentence: there is no period to date. One drawer,
 * two shapes, so the two decisions cannot grow a second panel that disagrees
 * about what a justification is.
 */
export function SponsorDecisionDrawer({
  open,
  decision,
  names,
  onClose,
  onConfirm,
}: {
  open: boolean;
  decision: 'approved' | 'rejected' | null;
  names: string[];
  onClose: () => void;
  onConfirm: (payload: { startsOn?: string; endsOn?: string; justification: string }) => void;
}) {
  const toast = useToast();
  const [startsOn, setStartsOn] = React.useState('');
  const [endsOn, setEndsOn] = React.useState('');
  const [justification, setJustification] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStartsOn('');
    setEndsOn('');
    setJustification('');
    setTouched(false);
  }, [open, decision]);

  if (!decision) return null;

  const approving = decision === 'approved';
  const many = names.length > 1;
  const who =
    names.length === 0
      ? 'these users'
      : names.length === 1
        ? names[0]
        : `${names.length} users`;

  const justOk = justification.trim().length >= MIN_JUSTIFICATION;
  const startMissing = touched && approving && startsOn.trim() === '';
  const endMissing = touched && approving && endsOn.trim() === '';
  const rangeBroken = approving && startsOn && endsOn && endsOn < startsOn;
  const justMissing = touched && !justOk;

  const save = () => {
    setTouched(true);
    if (approving && (startsOn.trim() === '' || endsOn.trim() === '')) {
      toast.error('Pick a start date and an end date.');
      return;
    }
    if (rangeBroken) {
      toast.error('End date must be on or after the start date.');
      return;
    }
    if (!justOk) {
      toast.error(`Add a justification of at least ${MIN_JUSTIFICATION} characters.`);
      return;
    }
    onConfirm({
      startsOn: approving ? startsOn : undefined,
      endsOn: approving ? endsOn : undefined,
      justification: justification.trim(),
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={approving ? `Approve ${who}` : `Reject ${who}`}
      subtitle={
        approving
          ? many
            ? 'Same access period and justification for everyone selected.'
            : 'Set when access starts and ends, and why you are approving.'
          : many
            ? 'Same justification for everyone selected. Access stays disabled.'
            : 'Say why. Their access stays disabled.'
      }
      icon={
        approving ? (
          <HowToRegOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />
        ) : (
          <PersonOffOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />
        )
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={approving ? 'primary' : 'danger'} onClick={save}>
            {approving ? 'Approve' : 'Reject'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {approving && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm-strong text-text-primary">
                Start date <span className="text-danger">*</span>
              </span>
              <DatePicker ariaLabel="Start date" value={startsOn} onChange={setStartsOn} />
              {startMissing ? (
                <p className="text-caption text-danger">Required.</p>
              ) : (
                <p className="text-caption text-text-secondary">When access begins.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm-strong text-text-primary">
                End date <span className="text-danger">*</span>
              </span>
              <DatePicker ariaLabel="End date" value={endsOn} onChange={setEndsOn} min={startsOn || undefined} />
              {endMissing || rangeBroken ? (
                <p className="text-caption text-danger">
                  {endMissing ? 'Required.' : 'Must be on or after the start date.'}
                </p>
              ) : (
                <p className="text-caption text-text-secondary">When this access should stop.</p>
              )}
            </div>
          </div>
        )}

        <Input
          label="Justification"
          required
          multiline
          minRows={4}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          error={justMissing ? `At least ${MIN_JUSTIFICATION} characters.` : undefined}
          placeholder={
            approving ? 'Why this person should have access…' : 'Why this onboarding is being rejected…'
          }
        />
      </div>
    </Drawer>
  );
}
