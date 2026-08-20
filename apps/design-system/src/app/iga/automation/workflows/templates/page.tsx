'use client';

import { WorkflowTemplateGallery } from '@/components/product/automation/WorkflowTemplateGallery';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Choose a starting point for a workflow.
 *
 * Same catalog frame as application types: a lifecycle rail, a featured empty
 * canvas, then a grid of template cards. Clicking a card opens a modal with the
 * real flow — the same renderer the builder uses — before the workflow is named.
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
