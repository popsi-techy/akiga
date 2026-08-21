'use client';

import { WorkflowTemplateGallery } from '@/components/product/automation/WorkflowTemplateGallery';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Choose a starting point for a workflow.
 *
 * Search and start-from-scratch sit in a banner. The catalog below — lifecycle
 * rail and template cards — scrolls only in the card list.
 */
export default function WorkflowTemplatesPage() {
  useSetBreadcrumbs([
    { label: 'Automation', href: '/iga/automation/workflows' },
    { label: 'Workflows', href: '/iga/automation/workflows' },
    { label: 'New workflow' },
  ]);

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+3rem)] flex-col">
      <WorkflowTemplateGallery />
    </div>
  );
}
