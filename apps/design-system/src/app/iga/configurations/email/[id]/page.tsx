'use client';

import { useParams } from 'next/navigation';
import { EmailTypeVariantsPage } from '@/components/product/settings/email';

/** One email: its default and the tenant's versions of it. */
export default function EmailTypeVersionsPage() {
  return <EmailTypeVariantsPage id={String(useParams().id)} />;
}
