'use client';

import { useParams } from 'next/navigation';
import { EmailTypeEditor } from '@/components/product/settings/email';

/** Compose one email type. */
export default function EmailTypeEditorPage() {
  return <EmailTypeEditor id={String(useParams().id)} />;
}
