'use client';

import { useParams } from 'next/navigation';
import { EmailTypeEditor } from '@/components/product/settings/email';

/** Compose one version of an email. */
export default function EmailTypeVersionEditorPage() {
  const params = useParams();
  return <EmailTypeEditor templateId={String(params.id)} variantId={String(params.variantId)} />;
}
