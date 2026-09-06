'use client';

import { Suspense } from 'react';
import { EmailTemplatesWorkspace } from '@/components/product/email-templates';

function EmailTemplatesPageContent() {
  return <EmailTemplatesWorkspace />;
}

export default function EmailTemplatesPage() {
  return (
    <Suspense fallback={null}>
      <EmailTemplatesPageContent />
    </Suspense>
  );
}
