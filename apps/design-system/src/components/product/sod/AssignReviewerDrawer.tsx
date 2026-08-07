'use client';

import * as React from 'react';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import { Drawer, Select, Button, useToast } from '@ds/components';
import { sodReviewers, assignReviewer } from '@/data/sod';
import type { SodReview } from '@/data/sod-types';

export function AssignReviewerDrawer({
  open,
  review,
  onClose,
  onAssigned,
}: {
  open: boolean;
  review: { id: string; userName: string; assignedReviewerId?: string; dueDate?: string } | null;
  onClose: () => void;
  onAssigned: (r: SodReview) => void;
}) {
  const toast = useToast();
  const [reviewerId, setReviewerId] = React.useState('');

  React.useEffect(() => {
    if (open && review) {
      setReviewerId(review.assignedReviewerId ?? '');
    }
  }, [open, review]);

  const reassigning = Boolean(review?.assignedReviewerId);

  const handleAssign = () => {
    if (!review) return;
    const reviewer = sodReviewers.find((r) => r.id === reviewerId);
    if (!reviewer) return;
    const updated = assignReviewer(review.id, reviewer);
    if (updated) {
      toast.success(`Assigned to ${reviewer.name}`);
      onAssigned(updated);
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={reassigning ? 'Reassign reviewer' : 'Assign reviewer'}
      subtitle={review ? `Violations for ${review.userName}` : undefined}
      icon={<PersonAddAltOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!reviewerId} onClick={handleAssign}>
            {reassigning ? 'Reassign' : 'Assign'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Reviewer"
          placeholder="Select a reviewer"
          options={sodReviewers.map((r) => ({ value: r.id, label: `${r.name}${r.title ? ` — ${r.title}` : ''}` }))}
          value={reviewerId}
          onChange={setReviewerId}
        />
        <p className="text-caption leading-5 text-text-tertiary">
          The reviewer receives this in their SoD Resolution queue.
        </p>
      </div>
    </Drawer>
  );
}

export default AssignReviewerDrawer;
