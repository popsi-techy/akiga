'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import { Button } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';

/**
 * Tenant settings chrome, promoted from MFA Configuration so every admin
 * screen is the same object: a 900px column, a section that saves itself,
 * and grey wells that stack as one block. The page name lives in the
 * breadcrumb — SettingsPage does not repeat it as a visible h1.
 *
 * Why not Card: a bordered white panel around a grey well is two answers to
 * "where does this setting live". The well is the setting; the page is the
 * frame. Card remains for in-panel switchers (a NavList rail) — those are
 * chrome around the wells, not a second frame for one setting.
 *
 * SettingsNested is the white panel inside a grey well. One SettingsNestedRow
 * is a dependent field when a switch is on. Several rows are a field group
 * when the well itself has no control. It is not a second well and not a Card.
 */

export interface SettingsPageProps {
  /** Accessible page name. Rendered visually hidden — the breadcrumb already shows it. */
  title?: string;
  /** Kept for callers; the page no longer shows a lead under a title. */
  description?: string;
  children: React.ReactNode;
}

export function SettingsPage({ title, children }: SettingsPageProps) {
  return (
    <div className="w-full min-w-0 max-w-[900px]">
      {title ? <h1 className="sr-only">{title}</h1> : null}
      {children}
    </div>
  );
}

export interface SettingsSectionProps {
  title: string;
  /** Stable id for the heading. Generated when omitted. */
  id?: string;
  /** Hairline above this section, for every section after the first. */
  divided?: boolean;
  onSave?: () => void;
  saveDisabled?: boolean;
  onReset?: () => void;
  resetDisabled?: boolean;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  id,
  divided = false,
  onSave,
  saveDisabled,
  onReset,
  resetDisabled,
  children,
}: SettingsSectionProps) {
  const generatedId = React.useId();
  const headingId = id ?? generatedId;
  const hasActions = Boolean(onSave || onReset);

  return (
    <section
      aria-labelledby={headingId}
      className={divided ? 'mt-8 border-t border-border pt-8' : undefined}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-h5 text-text-primary">
          {title}
        </h2>
        {hasActions ? (
          <div className="flex items-center gap-2">
            {onReset ? (
              <Tooltip title="Reset">
                <button
                  type="button"
                  aria-label="Reset"
                  disabled={resetDisabled}
                  onClick={onReset}
                  className="grid h-8 w-8 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle disabled:pointer-events-none disabled:opacity-40"
                >
                  <RestartAltOutlined sx={{ fontSize: 18 }} />
                </button>
              </Tooltip>
            ) : null}
            {onSave ? (
              <Button size="xs" disabled={saveDisabled} onClick={onSave}>
                Save
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SettingsCopy({
  title,
  description,
  hint,
  strong,
}: {
  title: string;
  description?: string;
  hint?: string;
  strong: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <p className={strong ? 'text-body-medium text-text-primary' : 'text-body-sm-strong text-text-primary'}>
          {title}
        </p>
        {hint ? (
          <Tooltip title={hint} placement="top">
            <span
              tabIndex={0}
              aria-label={`${title} information`}
              className="inline-flex shrink-0 text-icon-subtle hover:text-icon"
            >
              <InfoOutlined sx={{ fontSize: 16 }} />
            </span>
          </Tooltip>
        ) : null}
      </div>
      {description ? <p className="mt-0.5 text-caption text-text-secondary">{description}</p> : null}
    </div>
  );
}

export interface SettingsRowProps {
  title: string;
  description?: string;
  hint?: string;
  /** Omit when the grey well is a heading only and the fields live in `nested`. */
  children?: React.ReactNode;
  /**
   * `subtle` is the grey well — one setting on the page.
   * `plain` is a row inside an existing Card (divided list).
   */
  surface?: 'plain' | 'subtle';
  /**
   * `center` lines a compact control up with the title (switch, select).
   * `start` pins the title to the top of a tall control (textarea).
   */
  align?: 'center' | 'start';
  /**
   * White follow-up inside this grey well — a `SettingsNested`. Omit or pass
   * null when a parent control is off. Always pass it when the well itself
   * has no control and the fields live in the nested panel.
   */
  nested?: React.ReactNode;
}

export function SettingsRow({
  title,
  description,
  hint,
  children,
  surface = 'plain',
  align = 'center',
  nested,
}: SettingsRowProps) {
  const subtle = surface === 'subtle';
  const start = align === 'start';
  const control = children ? (
    <div className={start ? 'flex shrink-0 items-start gap-2' : 'flex shrink-0 items-center gap-2 pt-0.5'}>
      {children}
    </div>
  ) : null;
  const row = (
    <>
      <SettingsCopy title={title} description={description} hint={hint} strong={subtle} />
      {control}
    </>
  );

  if (!subtle) {
    return (
      <div className="flex items-start justify-between gap-6 py-3.5 first:pt-0 last:pb-0">{row}</div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md bg-subtle px-4 py-3">
      <div className={`flex ${start ? 'items-start' : 'items-center'} justify-between gap-4`}>{row}</div>
      {nested ?? null}
    </div>
  );
}

/**
 * White panel inside a grey well. Put one SettingsNestedRow when a parent
 * control is on, or several when the well is a heading and the fields live
 * here. Not a Card and not a second well in the stack.
 */
export interface SettingsNestedProps {
  children: React.ReactNode;
}

export function SettingsNested({ children }: SettingsNestedProps) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-md bg-surface px-4">{children}</div>
  );
}

export interface SettingsNestedRowProps {
  title: string;
  description?: string;
  hint?: string;
  children: React.ReactNode;
  /** `start` pins the title to the top of a tall description. Compact rows stay center. */
  align?: 'center' | 'start';
}

export function SettingsNestedRow({
  title,
  description,
  hint,
  children,
  align = 'center',
}: SettingsNestedRowProps) {
  const start = align === 'start';
  return (
    <div className={`flex justify-between gap-4 py-3 ${start ? 'items-start' : 'items-center'}`}>
      <SettingsCopy title={title} description={description} hint={hint} strong />
      <div className={start ? 'flex shrink-0 items-start gap-2 pt-0.5' : 'flex shrink-0 items-center gap-2'}>
        {children}
      </div>
    </div>
  );
}

/**
 * Stacks subtle wells as one configuration: 4px between rows, radius only on
 * the outer corners. A row in the middle is square so the group still reads as
 * a single block when another setting is inserted later.
 */
export function SettingsStack({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 [&>*]:!rounded-none [&>*:first-child]:!rounded-t-md [&>*:last-child]:!rounded-b-md">
      {children}
    </div>
  );
}

export function SettingsInfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] px-3 py-2.5">
      <InfoOutlined
        sx={{ fontSize: 18, color: 'var(--ds-color-status-info-fg)', marginTop: '1px' }}
        aria-hidden
      />
      <p className="text-caption leading-5 text-[var(--ds-color-status-info-fg)]">{children}</p>
    </div>
  );
}
