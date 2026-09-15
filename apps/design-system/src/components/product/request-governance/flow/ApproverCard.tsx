'use client';

import * as React from 'react';
import { Avatar, FileAttachmentField } from '@ds/components';
import { formatDateTime } from '@/lib/datetime';
import type { ApprovalDecision } from '@/data/request-governance';
import { ToneChip, approverState } from './flowVocabulary';

/**
 * One person's answer, in its own card.
 *
 * A level decided by a group is a set of separate answers, and a flat list of rows made
 * them run together — three names, one of them with a paragraph attached, reading as one
 * block of text. Each answer gets a container so the eye can count them, and so a
 * justification belongs visibly to the person who wrote it.
 *
 * Shared by the canvas and the docked panel. The panel used to draw its own divided rows,
 * which is how the same decision came to look like two different objects a click apart —
 * and how "No longer required" on the canvas became "Waiting on this decision" in the
 * panel. One card, one vocabulary, two surfaces.
 */
export function ApproverCard({
  decision,
  label,
  showEmail = false,
}: {
  decision: ApprovalDecision;
  /** The level's name, used when the person carries no title of their own. */
  label: string;
  /**
   * The address as well as the name.
   *
   * The panel is the close read — the surface you open when you are about to chase
   * somebody — so it earns the line. The canvas is scanned down a column of levels, where
   * an email is a third grey line under every name that nobody reads on the way past.
   */
  showEmail?: boolean;
}) {
  const state = approverState(decision);
  const files = decision.attachments ?? [];

  return (
    <div className="rounded-lg border border-border-subtle p-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <Avatar name={decision.approver.name} size="s" kind="person" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-body-sm-strong text-text-primary">
                {decision.approver.name}
              </p>
              <p className="truncate text-caption text-text-secondary">
                {decision.approver.title ?? label}
              </p>
              {showEmail && (
                <p className="truncate text-caption text-text-tertiary">
                  {decision.approver.email}
                </p>
              )}
            </div>
            <span className="shrink-0">
              <ToneChip tone={state.tone} label={state.label} />
            </span>
          </div>

          {decision.decidedAt && (
            <p className="mt-1.5 text-caption text-text-secondary">
              {formatDateTime(decision.decidedAt)}
            </p>
          )}

          {/* The justification in the approver's own words. Quoted, so it reads as
              testimony rather than as the product describing the decision. */}
          {decision.note && (
            <p className="mt-1.5 text-body-sm text-text-secondary">&ldquo;{decision.note}&rdquo;</p>
          )}

          {/* Raised back out of the level card's click overlay: the file row's own menu is
              a control, and the overlay is not allowed to swallow it. */}
          {files.length > 0 && (
            <div className="pointer-events-auto mt-2.5">
              <FileAttachmentField
                readOnly
                itemVariant="outlined"
                files={files}
                label={`${files.length === 1 ? '1 file' : `${files.length} files`} attached to this decision`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
