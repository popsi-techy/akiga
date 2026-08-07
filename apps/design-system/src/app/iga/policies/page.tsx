'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { NavCard } from '@ds/components';
import { sodPolicies } from '@/data/sod-seed';

/** Birthright has no data source yet — placeholder demo count. */
const BIRTHRIGHT_COUNT_PLACEHOLDER = 12;
const APPROVAL_POLICIES_COUNT_PLACEHOLDER = 8;

export default function PoliciesLandingPage() {
  const router = useRouter();

  const cards = [
    { title: 'SoD Policies', description: 'Define separation-of-duties rules that flag conflicting access.', href: '/iga/sod-policies', count: sodPolicies.length },
    { title: 'Approval Policies', description: 'Route access requests through the right approvers and SLAs.', href: '/iga/automation/approval-policies', count: APPROVAL_POLICIES_COUNT_PLACEHOLDER },
    { title: 'Birthright Policies', description: 'Grant baseline access automatically based on who a user is.', href: '/iga/birthright', count: BIRTHRIGHT_COUNT_PLACEHOLDER },
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
