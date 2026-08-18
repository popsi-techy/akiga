'use client';

import { WorkflowTemplateGallery } from '@/components/product/automation/WorkflowTemplateGallery';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Choose a starting point for a workflow.
 *
 * A full page rather than a modal: the preview renders a real flow, which can be
 * wider and taller than a dialog, and choosing how to automate someone's first day
 * is not a decision to make through a letterbox.
 */
export default function WorkflowTemplatesPage() {
  useSetBreadcrumbs([
    { label: 'Automation', href: '/iga/automation/workflows' },
    { label: 'Workflows', href: '/iga/automation/workflows' },
    { label: 'New workflow' },
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Start a workflow</h1>
        <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
          Pick a lifecycle process to start from. Selecting one shows exactly what it builds — nothing is
          created until you use it.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <WorkflowTemplateGallery />
      </div>
    </div>
  );
}
