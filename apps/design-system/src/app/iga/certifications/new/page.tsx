'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import LinkOffOutlined from '@mui/icons-material/LinkOffOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { NavCard } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import {
  CERTIFICATION_TEMPLATES,
  type CertificationTypeId,
} from '@/data/certifications';

const ICONS: Record<CertificationTypeId, React.ReactNode> = {
  custom: <TuneOutlined sx={{ fontSize: 20 }} />,
  'user-manager': <PersonOutline sx={{ fontSize: 20 }} />,
  'entitlement-owner': <VpnKeyOutlined sx={{ fontSize: 20 }} />,
  'application-owner': <AppsOutlined sx={{ fontSize: 20 }} />,
  'role-owner': <AccountTreeOutlined sx={{ fontSize: 20 }} />,
  'orphan-account': <LinkOffOutlined sx={{ fontSize: 20 }} />,
};

/**
 * Choosing what kind of review to run.
 *
 * A landing/choice page: the cards are the protagonist and the prose above them
 * is one sentence. Templates that are not built keep their place in the grid
 * rather than being hidden — the set of review types is itself information about
 * what this product governs, and a reader who cannot see Role Owner Review will
 * go looking for it.
 */
export default function NewCertificationPage() {
  const router = useRouter();
  // The path-derived trail would read "Access Certification Details" here, which
  // this page is not — it is the step before there is anything to detail.
  useSetBreadcrumbs([
    { label: 'Access Certification', href: '/iga/certifications' },
    { label: 'Choose a review type' },
  ]);
  const available = CERTIFICATION_TEMPLATES.filter((t) => t.available);
  const comingSoon = CERTIFICATION_TEMPLATES.filter((t) => !t.available);

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="mb-5">
        <h1 className="text-h2 text-text-primary">Create an access certification</h1>
        <p className="mt-1 text-body text-text-secondary">
          Pick who should do the reviewing. Every template asks the same question of a different
          person.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((t) => (
          <NavCard
            key={t.id}
            title={t.name}
            description={t.description}
            tags={t.tags}
            icon={ICONS[t.id]}
            onClick={() => router.push(`/iga/certifications/new/${t.id}`)}
          />
        ))}
      </div>

      <div className="mb-4 mt-8 flex items-baseline gap-3">
        <h2 className="text-h5 text-text-primary">Coming soon</h2>
        <p className="min-w-0 flex-1 truncate text-body-sm text-text-secondary">
          Presets that pick the users and reviewers for you. Until then, a custom review can do any
          of them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comingSoon.map((t) => (
          <NavCard
            key={t.id}
            title={t.name}
            description={t.description}
            tags={t.tags}
            icon={ICONS[t.id]}
            disabled
          />
        ))}
      </div>
    </div>
  );
}
