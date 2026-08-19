'use client';

import * as React from 'react';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import AddIcon from '@mui/icons-material/Add';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import { Button } from '@ds/components';
import { EmergencyAccessGuideModal } from './EmergencyAccessGuideModal';

/**
 * First-run empty for the Emergency Access list — no table, because a header row
 * with nothing under it reads as a failed load rather than as "nothing exists yet".
 */
export function EmergencyAccessEmptyState({ onCreate }: { onCreate: () => void }) {
  const [guideOpen, setGuideOpen] = React.useState(false);

  return (
    <div className="grid min-h-0 flex-1 place-items-center">
      <div className="flex max-w-md flex-col items-center px-6 py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-subtle text-icon-brand">
          <VpnKeyOutlined sx={{ fontSize: 28 }} aria-hidden />
        </span>
        <h2 className="mt-4 text-h5 text-text-primary">Add emergency access</h2>
        <p className="mt-1.5 text-body-sm text-text-secondary">
          Create a time-bound, break-glass profile so people can request critical access
          during an incident — and have it taken back when the session ends.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" startIcon={<MenuBookOutlined />} onClick={() => setGuideOpen(true)}>
            View guide
          </Button>
          <Button startIcon={<AddIcon />} onClick={onCreate}>
            Create emergency access
          </Button>
        </div>
      </div>

      <EmergencyAccessGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onCreate={onCreate}
      />
    </div>
  );
}

export default EmergencyAccessEmptyState;
