'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { NavCard } from '@ds/components';
import { listUserIdentities, listAppAccounts } from '@/data/directory';

/** Groups has no data source yet, so its count is placeholder demo data. */
const GROUPS_COUNT_PLACEHOLDER = 48;

export default function IdentitiesLandingPage() {
  const router = useRouter();
  const appAccounts = listAppAccounts();

  const cards = [
    { title: 'User Identities', description: 'The primary representation of every person in the organization.', href: '/iga/directory/user-identities', count: listUserIdentities().length },
    { title: 'App Accounts', description: 'Accounts held by users inside connected applications.', href: '/iga/directory/app-accounts', count: appAccounts.length },
    { title: 'Orphan Accounts', description: 'Accounts no longer associated with an active user identity.', href: '/iga/orphan-accounts', count: appAccounts.filter((a) => a.orphan).length },
    { title: 'IAM Groups', description: 'Directory and application groups that grant access.', href: '/iga/groups', count: GROUPS_COUNT_PLACEHOLDER },
  ];

  return (
    <div>
      {/* No page heading — the breadcrumb already names this view. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <NavCard key={c.title} title={c.title} description={c.description} count={c.count} onClick={() => router.push(c.href)} />
        ))}
      </div>
    </div>
  );
}
