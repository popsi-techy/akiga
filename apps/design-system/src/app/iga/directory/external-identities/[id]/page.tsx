'use client';

import { useParams } from 'next/navigation';
import { ExternalIdentityDetail } from '@/components/product/directory';

/** Admin view of one external identity — stays under External Identities in the nav. */
export default function ExternalIdentityDetailPage() {
  const id = String(useParams().id);
  return (
    <ExternalIdentityDetail
      id={id}
      role="admin"
      backHref="/iga/directory/external-identities"
      backLabel="Back to External Identities"
    />
  );
}
