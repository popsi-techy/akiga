'use client';

import * as React from 'react';
import BalanceOutlined from '@mui/icons-material/BalanceOutlined';
import { Button, Drawer, Input } from '@ds/components';
import { countAccess, describeRuleset, emptyRuleset, rulesetProblems } from '@/lib/sod-ruleset';
import type { SodRuleGroup } from '@/data/sod-types';
import { SodRulesetBuilder } from './SodRulesetBuilder';

/**
 * Create or change a policy's ruleset.
 *
 * Holds a working copy: edits are thrown away on cancel, so opening the drawer
 * to look at a live rule can never half-change it. The live expression sits in
 * the footer beside the save button, because the thing most worth checking
 * before saving a control is whether it reads the way you meant it.
 */
export function SodRulesetDrawer({
  open,
  onClose,
  initial,
  /** Live policies version on save; a draft is edited in place. Drives the wording. */
  versioned,
  nextVersion,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: SodRuleGroup | null;
  versioned: boolean;
  nextVersion: number;
  onSave: (root: SodRuleGroup, note?: string) => void;
}) {
  const [root, setRoot] = React.useState<SodRuleGroup>(emptyRuleset);
  const [note, setNote] = React.useState('');

  // Reset from the source of truth every time it opens — never carry a previous
  // session's half-built tree into a new one.
  React.useEffect(() => {
    if (!open) return;
    setRoot(initial ? structuredClone(initial) : emptyRuleset());
    setNote('');
  }, [open, initial]);

  const problems = rulesetProblems(root);
  const valid = problems.length === 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initial ? 'Change ruleset' : 'Create ruleset'}
      subtitle={
        versioned
          ? `Saving supersedes the live rule and starts version ${nextVersion}.`
          : 'Which access held together counts as a conflict.'
      }
      icon={<BalanceOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={720}
      footer={
        <>
          {/* Names what is missing rather than leaving a dead button: a disabled
              control with no reason is the most common dead end in a builder. */}
          <span className="mr-auto min-w-0 truncate text-body-sm text-text-secondary">
            {valid ? describeRuleset(root) : problems[0]}
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={() => onSave(root, note.trim() || undefined)}>
            {versioned ? `Save as version ${nextVersion}` : 'Save ruleset'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-body-sm text-text-secondary">
          A user is in violation when they hold access matching this expression. Two items joined by
          AND is the ordinary toxic pair; add a group to say “any one of these, together with any one
          of those”.
        </p>

        <SodRulesetBuilder root={root} onChange={setRoot} />

        {versioned && (
          <Input
            label="What changed"
            hint="Kept with the version, so an old violation can still be read against the rule that raised it."
            placeholder="e.g. Added the new payment-run entitlement"
            size="sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}

        <p className="text-caption text-text-tertiary">
          {countAccess(root)} piece{countAccess(root) === 1 ? '' : 's'} of access in this rule.
        </p>
      </div>
    </Drawer>
  );
}
