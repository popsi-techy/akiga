'use client';

import { WorkflowTemplateGallery } from '@/components/product/automation/WorkflowTemplateGallery';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Choose a starting point for a workflow.
 *
 * A full page rather than a modal: the preview renders a real flow, which can be
 * wider and taller than a dialog, and choosing how to automate someone's first day
 * is not a decision to make through a letterbox.
 *
 * The page title lives in the picker rail. The right pane is the chosen template —
 * stacking a second "Start a workflow" header above the preview was the hierarchy
 * problem this layout is here to kill.
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
