'use client';

import * as React from 'react';
import { Avatar, type AvatarKind } from '../Avatar/Avatar';

/**
 * IdentityCell — the table treatment for a person or an account.
 *
 * A 28px avatar (`s`), the name, and the email on the line under it. Email is
 * not a column: a dedicated Email column is a second scan target for the same
 * fact, and it is the first thing a drawer or Peek has to hide. Putting it under
 * the name is how External Identities already works; this is that composition,
 * so every picker and directory list does the same thing.
 *
 * Size is not a caller prop. Tables always use `s` — two lines of type sit
 * beside a 28px mark without the row going tall. `md` is a header or a profile
 * card (Avatar, not this). The person ring uses the 2px surface gap.
 *
 * Pass `email` (including an empty string) to reserve the second line, so rows
 * with and without an address stay the same height. Omit it for a name-only cell
 * (an entity that has no address). The column that holds this cell needs
 * `wrap: true` — two lines, and the default clip would shave the ring.
 */
export interface IdentityCellProps {
  name: string;
  email?: string;
  /** A person is round; an account is a rounded square. @default 'person' */
  kind?: AvatarKind;
  /** A chip that belongs to the identity — an Orphan mark on an account. */
  trailing?: React.ReactNode;
  className?: string;
}

export function IdentityCell({
  name,
  email,
  kind = 'person',
  trailing,
  className = '',
}: IdentityCellProps) {
  const showEmail = email !== undefined;
  return (
    <div className={['flex min-w-0 items-center gap-2.5', className].filter(Boolean).join(' ')}>
      <Avatar name={name} size="s" kind={kind} />
      <div className="min-w-0">
        <div className="truncate text-body-sm-strong text-text-primary">{name}</div>
        {showEmail && (
          <div className="truncate text-caption text-text-secondary" title={email || undefined}>
            {email || '—'}
          </div>
        )}
      </div>
      {trailing != null ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

export default IdentityCell;
