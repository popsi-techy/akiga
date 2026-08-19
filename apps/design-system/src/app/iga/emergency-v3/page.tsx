'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Button, Drawer, Input, useToast } from '@ds/components';
import { EmergencyAccessListView } from '@/components/product/emergency/EmergencyAccessListView';
import { createEmergencyAccess, isRequiredSetupStep, EA_SETUP_STEPS } from '@/data/emergency-access';

/**
 * Emergency Access V3 — create in a drawer, finish on the real tabs.
 *
 * Same create as V1. The difference is the draft: no Setup tab. A floating bar
 * walks Assignments → Eligibility → Owners → Limits with Next and Back, and
 * Activate appears the moment the required work is done. The bar is gone once
 * the access is live.
 */
export default function EmergencyAccessV3ListPage() {
  const router = useRouter();
  const toast = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const openCreate = () => {
    setName('');
    setDescription('');
    setCreateOpen(true);
  };

  const create = () => {
    if (name.trim() === '') return;
    const id = createEmergencyAccess({ name, description });
    setCreateOpen(false);
    toast.success(`“${name.trim()}” created as a draft.`);
    router.push(`/iga/emergency-v3/${id}`);
  };

  return (
    <>
      <EmergencyAccessListView basePath="/iga/emergency-v3" onCreate={openCreate} />

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Emergency access basic details"
        subtitle="Provide name and description."
        icon={<VpnKeyOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={name.trim() === ''}>
              Continue
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            required
            hint="Shown wherever this access is requested or reviewed. Name it after the system it unlocks."
            placeholder="e.g. Bitbucket production"
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="What this access is for, and when it should be used"
            size="sm"
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="rounded-lg border border-border bg-subtle px-4 py-3.5">
            <h3 className="text-body-strong text-text-primary">Upcoming setup steps</h3>
            <p className="mt-1 text-caption text-text-secondary">
              A bar under the page will walk you through these:
            </p>
            <ul className="mt-3 space-y-2">
              {EA_SETUP_STEPS.filter((step) => step.id !== 'basic').map((step) => {
                const required = isRequiredSetupStep(step.id);
                return (
                  <li key={step.id} className="flex items-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-icon-subtle" aria-hidden />
                    <span className="min-w-0 text-body-sm text-text-primary">
                      {step.label}
                      {required && (
                        <>
                          <span aria-hidden className="text-danger">
                            {' *'}
                          </span>
                          <span className="sr-only">Required</span>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Drawer>
    </>
  );
}
