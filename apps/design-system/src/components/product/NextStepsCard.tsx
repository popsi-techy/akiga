'use client';

import * as React from 'react';
import Bolt from '@mui/icons-material/Bolt';
import ChevronRightOutlined from '@mui/icons-material/ChevronRight';
import { Card, StatusChip } from '@ds/components';

export interface NextStep {
  id: string;
  label: string;
  /** Why it exists, in the reader's terms — not a restatement of the label. */
  hint: string;
  icon: React.ReactNode;
  /** Required steps block the object going live; the rest can be done later. */
  required: boolean;
  done: boolean;
}

/**
 * What a draft object still needs before it can be switched on.
 *
 * Shared by Emergency Access and SoD Policies — both have the same shape of
 * problem: a handful of independent pieces of setup, only some of which gate
 * going live, and a reader who needs to see at a glance which is which.
 *
 * Optional steps are listed but never counted against the gate. In both modules
 * the optional work (owners) makes the object *better governed* rather than
 * *functional*, and blocking a security control on a missing owner is the wrong
 * trade — so the card shows them without letting them stop anything.
 *
 * The footer is the caller's: it owns the going-live action and the sentence
 * that explains why the action is or is not available.
 */
export function NextStepsCard({
  title = 'Recommended next steps',
  steps,
  onStep,
  footer,
}: {
  title?: string;
  steps: NextStep[];
  onStep: (id: string) => void;
  footer?: React.ReactNode;
}) {
  return (
    <Card title={title} icon={<Bolt />} padding="none">
      <ul>
        {steps.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStep(step.id)}
              // No horizontal padding: `Card padding="none"` already supplies the
              // gutter, and adding one here insets the rows twice.
              className="flex w-full items-center gap-3 border-b border-border py-3.5 text-left transition-colors hover:bg-surface-hover"
            >
              <span
                className={[
                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                  step.done ? 'bg-subtle text-icon-subtle' : 'bg-brand-subtle text-icon-brand',
                ].join(' ')}
              >
                {step.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-body-sm-strong text-text-primary">{step.label}</span>
                  {step.required && (
                    <span className="shrink-0 text-caption text-text-tertiary">Required</span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-caption text-text-secondary">{step.hint}</span>
              </span>
              {step.done ? (
                <StatusChip intent="success" label="Done" />
              ) : (
                <StatusChip intent="warning" label="To do" />
              )}
              <ChevronRightOutlined sx={{ fontSize: 18 }} className="shrink-0 text-icon-subtle" />
            </button>
          </li>
        ))}
      </ul>

      {footer && <div className="flex flex-wrap items-center justify-between gap-3 py-4">{footer}</div>}
    </Card>
  );
}
