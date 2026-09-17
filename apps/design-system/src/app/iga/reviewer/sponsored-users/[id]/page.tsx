'use client';

import { useParams } from 'next/navigation';
import { ExternalIdentityDetail } from '@/components/product/directory';

/** Reviewer view of one sponsored external — stays under Sponsored Users in the nav. */
export default function SponsoredUserDetailPage() {
  const id = String(useParams().id);
  return (
    <ExternalIdentityDetail
      id={id}
      role="reviewer"
      backHref="/iga/reviewer/sponsored-users"
      backLabel="Back to Sponsored Users"
    />
  );
}
