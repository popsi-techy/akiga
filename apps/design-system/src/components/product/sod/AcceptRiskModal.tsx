'use client';

import * as React from 'react';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { Input, Select, Button, SegmentedControl, Modal } from '@ds/components';
import { riskApprovers } from '@/data/sod';
import type { AcceptedRisk } from '@/data/sod-types';

const DURATIONS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
  { value: 'permanent', label: 'Permanent' },
];

export function AcceptRiskModal({
  open,
  rule,
  onClose,
  onAccept,
}: {
  open: boolean;
  rule: { code: string; label: string } | null;
  onClose: () => void;
  onAccept: (acceptance: AcceptedRisk) => void;
}) {
  const [justification, setJustification] = React.useState('');
  const [duration, setDuration] = React.useState('90');
  const [approverId, setApproverId] = React.useState(riskApprovers[0].id);

  React.useEffect(() => {
    if (open) {
      setJustification('');
      setDuration('90');
      setApproverId(riskApprovers[0].id);
    }
  }, [open]);

  const valid = justification.trim().length >= 10 && Boolean(approverId);
  const durLabel = DURATIONS.find((d) => d.value === duration)?.label ?? '';

  const submit = () => {
    if (!valid) return;
    const approver = riskApprovers.find((a) => a.id === approverId)!;
    onAccept({
      justification: justification.trim(),
      duration: duration === 'permanent' ? 'permanent' : (Number(duration) as 30 | 90 | 180),
      approverId,
      approverName: approver.name,
      at: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal
      open={open && !!rule}
      onClose={onClose}
      title="Accept risk"
      subtitle={rule ? rule.code : undefined}
      icon={<ShieldOutlined sx={{ fontSize: 20 }} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={submit}>
            Accept risk for {durLabel.toLowerCase()}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 text-body-sm font-medium text-text-secondary">Business justification</div>
          <Input
            aria-label="Business justification"
            size="sm"
            multiline
            minRows={3}
            placeholder="Why is this access combination acceptable for this user? (min. 10 characters)"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-1.5 text-body-sm font-medium text-text-secondary">Duration</div>
          <SegmentedControl options={DURATIONS} value={duration} onChange={setDuration} fullWidth />
          <p className="mt-2 text-caption text-text-tertiary">
            {duration === 'permanent' ? 'The acceptance does not expire.' : 'The violation re-opens automatically when the acceptance expires.'}
          </p>
        </div>
        <div>
          <div className="mb-1.5 text-body-sm font-medium text-text-secondary">Risk approver</div>
          <Select
            options={riskApprovers.map((a) => ({ value: a.id, label: `${a.name} — ${a.title}` }))}
            value={approverId}
            onChange={setApproverId}
          />
        </div>
      </div>
    </Modal>
  );
}

export default AcceptRiskModal;
