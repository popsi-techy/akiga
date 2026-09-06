'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { NavCard, useToast } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { createEntitlementDraft } from '@/data/access-requests';

const LIST = '/iga/enduser/access-requests';

export default function ChooseRequestTypePage() {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = React.useState(false);

  useSetBreadcrumbs([
    { label: 'Access Requests', href: LIST },
    { label: 'New Request' },
  ]);

  const startEntitlement = () => {
    if (creating) return;
    setCreating(true);
    window.setTimeout(() => {
      try {
        const draft = createEntitlementDraft();
        router.push(`${LIST}/${draft.id}?step=for-whom`);
      } catch {
        setCreating(false);
        toast.error('Could not start a request. Try again.');
      }
    }, 180);
  };

  return (
    <div className="ds-scroll h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-h2 text-text-primary">Choose request type</h1>
        <p className="mt-1 text-body text-text-secondary">Create your request from the types below.</p>
      </div>

      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
        <NavCard
          title="Entitlement"
          description="Request specific permissions for applications you already have access to."
          tags={['Entitlement']}
          icon={<ShieldOutlined sx={{ fontSize: 20 }} />}
          onClick={startEntitlement}
        />
      </div>
    </div>
  );
}
