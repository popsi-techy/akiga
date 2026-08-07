'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { Callout } from '@ds/components';
import { AccessPathCard } from '@/components/product/access-view';

/**
 * Access View — path chooser.
 *
 * Access can be traced two ways and they answer different questions ("what does
 * this account hold in that app" vs "what does this role grant"). Asking once, up
 * front, keeps the explorer itself free of mode-switching clutter — and the choice
 * stays reversible from the explorer's Access Path control.
 */
export default function AccessViewPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h2 font-bold text-text-primary">Select Access Path</h1>
      <p className="mt-1 text-body text-text-secondary">
        Choose a path to explore access across different access levels.
      </p>

      <div className="mt-5">
        <Callout>You can switch between the two paths at any time while exploring.</Callout>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <AccessPathCard
          title="Application Based Access"
          icon={<AppsOutlined sx={{ fontSize: 22 }} />}
          levels={['User Identity', 'Applications', 'Accounts', 'Entitlements']}
          description="Follow a person into the applications they hold accounts in, then into the entitlements each account grants. Use this to answer what someone can do in a specific system."
          tags={['Applications', 'Accounts']}
          onClick={() => router.push('/iga/access-view/explorer')}
        />
        <AccessPathCard
          title="Role Based Access"
          icon={<BadgeOutlined sx={{ fontSize: 22 }} />}
          levels={['User Identity', 'Business / Technical Roles', 'Entitlements']}
          description="Follow a person into the business and technical roles assigned to them, then into the entitlements those roles carry. Use this to answer why someone has access."
          tags={['Business Role', 'Technical Role']}
          comingSoon
        />
      </div>
    </div>
  );
}
