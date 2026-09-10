'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { NavCard, useToast } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { createAccessRequestDraft } from '@/data/access-requests';
import type { AccessRequestType } from '@/data/access-request-types';

const LIST = '/iga/enduser/access-requests';

const TYPES: {
  type: AccessRequestType;
  title: string;
  description: string;
  tag: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'entitlement',
    title: 'Entitlement',
    description: 'Request specific permissions for applications you already have access to.',
    tag: 'Entitlement',
    icon: <ShieldOutlined sx={{ fontSize: 20 }} />,
  },
  {
    type: 'application',
    title: 'Application',
    description: 'Request access to an application you do not have yet.',
    tag: 'Application',
    icon: <AppsOutlined sx={{ fontSize: 20 }} />,
  },
  {
    type: 'role',
    title: 'Technical Role',
    description: 'Request a technical role that bundles the permissions you need.',
    tag: 'Technical Role',
    icon: <BadgeOutlined sx={{ fontSize: 20 }} />,
  },
];

export default function ChooseRequestTypePage() {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = React.useState<AccessRequestType | null>(null);

  useSetBreadcrumbs([
    { label: 'Access Requests', href: LIST },
    { label: 'New Request' },
  ]);

  const start = (type: AccessRequestType) => {
    if (creating) return;
    setCreating(type);
    window.setTimeout(() => {
      try {
        const draft = createAccessRequestDraft(type);
        router.push(`${LIST}/${draft.id}?step=for-whom`);
      } catch {
        setCreating(null);
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TYPES.map((t) => (
          <NavCard
            key={t.type}
            title={t.title}
            description={t.description}
            tags={[t.tag]}
            icon={t.icon}
            onClick={() => start(t.type)}
          />
        ))}
      </div>
    </div>
  );
}
