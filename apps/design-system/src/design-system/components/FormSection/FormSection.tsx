'use client';

import * as React from 'react';

/**
 * FormSection — a named group of fields inside a Drawer or Modal.
 *
 * SettingsSection is the wrong tool here: it is a tenant-admin page heading
 * with its own Save. A drawer saves once in the footer. The groups are still
 * a sequence of peers, so they divide with a hairline — they are not cards
 * (visual language §3.2: structure carries hierarchy, not boxes).
 *
 * Why MUI was insufficient: MUI has no form-group primitive that matches this
 * type and spacing contract. A one-off `space-y-5` stack with ad-hoc headings
 * would drift the first time a second drawer copied it.
 *
 * The title is `h5` (16px) with an outlined 18px icon. The drawer title stays
 * `h4` (18px) — two steps, so the group does not compete. No description
 * under the heading: the title names the job; field hints carry the why.
 */
export interface FormSectionProps {
  title: string;
  /**
   * Outlined MUI icon at 18px (`sx={{ fontSize: 18 }}`), uncoloured — it
   * inherits `icon.default`. Decorative; the heading text is the name.
   */
  icon?: React.ReactNode;
  /** Stable id for the heading. Generated when omitted. */
  id?: string;
  /** Hairline above this section. Pass on every section after the first. */
  divided?: boolean;
  children: React.ReactNode;
}

export function FormSection({
  title,
  icon,
  id,
  divided = false,
  children,
}: FormSectionProps) {
  const generatedId = React.useId();
  const headingId = id ?? generatedId;

  return (
    <section
      aria-labelledby={headingId}
      className={divided ? 'mt-6 border-t border-border pt-6' : undefined}
    >
      <div className="flex items-center gap-2">
        {icon != null ? (
          <span
            aria-hidden
            className="inline-flex h-[18px] w-[18px] shrink-0 text-icon [&_svg]:block"
          >
            {icon}
          </span>
        ) : null}
        <h3 id={headingId} className="text-h5 text-text-primary">
          {title}
        </h3>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
