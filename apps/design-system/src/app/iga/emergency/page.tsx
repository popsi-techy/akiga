'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Button, Drawer, Input, useToast } from '@ds/components';
import { EmergencyAccessListView } from '@/components/product/emergency/EmergencyAccessListView';
import { createEmergencyAccess, isRequiredSetupStep, EA_SETUP_STEPS } from '@/data/emergency-access';

/**
 * Emergency Access V1 — create in a drawer, finish on the draft.
 *
 * The list and the detail screen are shared with V2; the drawer below is the
 * whole of the difference. It asks for the two things a profile cannot exist
 * without and leaves the rest to the draft's checklist.
 */
export default function EmergencyAccessListPage() {
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

  /**
   * Straight to the draft, not back to the list. Name and description are the
   * two things a profile cannot be created without — everything that makes it
   * *work* is on the detail page, and its checklist is the next instruction.
   */
  const create = () => {
    if (name.trim() === '') return;
    const id = createEmergencyAccess({ name, description });
    setCreateOpen(false);
    toast.success(`“${name.trim()}” created as a draft.`);
    router.push(`/iga/emergency/${id}`);
  };

  return (
    <>
      <EmergencyAccessListView basePath="/iga/emergency" onCreate={openCreate} />

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
          {/* What Continue leads to.

              The button promises more without saying what, so the reader cannot tell
              whether they are two fields from a working profile or twenty. This is the
              same checklist they will meet on the next screen, in the same order and
              the same words, so arriving there confirms what they were shown rather
              than introducing it.

              Static and unclickable on purpose: none of it exists yet, and a row that
              looks pressable before the profile is created would be a promise the
              drawer cannot keep. `Basic details` is dropped — it is the form they are
              filling in, and listing it as "next" would be odd. */}
          <div className="rounded-lg border border-border bg-subtle px-4 py-3.5">
            <h3 className="text-body-strong text-text-primary">Upcoming setup steps</h3>
            <p className="mt-1 text-caption text-text-secondary">
              You will configure these in the next steps:
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
