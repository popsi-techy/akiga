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
  /**
   * What the chip says when this step is done. @default 'Completed'
   *
   * For the step that is satisfied without anyone doing anything — limits that
   * arrived with working defaults, say. "Completed" would take credit for a
   * decision nobody made, and the reader would stop looking at a value they may
   * well want to change.
   */
  doneLabel?: string;
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
              {/* Always the quiet fill. The tile identifies which step this is;
                  the chip on the right says whether it is done. Tinting the
                  pending ones brand-orange made the card's accent colour mean
                  "not finished", and left three oranges competing with the one
                  that matters — Activate. */}
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-subtle text-icon-subtle">
                {step.icon}
              </span>
              <span className="min-w-0 flex-1">
                {/* `gap-1`, roughly the width of a space at this size. `Input`
                    renders its asterisk inside the label with a literal `{' '}`,
                    which is the spacing to match — a required marker modifies the
                    word it follows, so anything wider reads as a separate item.
                    It cannot go inside the label here because that span
                    truncates, and a long step name would ellipsize away the one
                    mark saying the step is required. */}
                <span className="flex items-center gap-1">
                  <span className="truncate text-body-sm-strong text-text-primary">{step.label}</span>
                  {/* The same marker a required field carries — a danger-tinted
                      asterisk — so "required" means one thing across forms and
                      checklists. Unlike a field, nothing here carries a
                      `required` attribute for assistive tech, so the word is
                      kept for screen readers rather than dropped with the text. */}
                  {step.required && (
                    <>
                      <span aria-hidden className="shrink-0 text-body-sm-strong text-danger">
                        *
                      </span>
                      <span className="sr-only">Required</span>
                    </>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-caption text-text-secondary">{step.hint}</span>
              </span>
              {/* "Pending" over "To do": the row is already an instruction, so the
                  chip's job is to report state, and a state reads as a noun. */}
              {step.done ? (
                <StatusChip intent="success" label={step.doneLabel ?? 'Completed'} />
              ) : (
                <StatusChip intent="warning" label="Pending" />
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
