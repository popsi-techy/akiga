'use client';

import type { ReactNode } from 'react';

import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import { Button, StatusChip, type StatusIntent } from '@ds/components';

export function DetailField({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-x-6">
      <dt className="flex min-w-0 items-center gap-2 text-caption text-text-secondary">
        {icon ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center text-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </dt>
      <dd
        className={['min-w-0 text-body-sm-strong text-text-primary', valueClassName].filter(Boolean).join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}

function EmailCardShell({
  title,
  icon,
  status,
  ariaLabel,
  children,
  footer,
}: {
  title: string;
  icon: ReactNode;
  status?: { intent: StatusIntent; label: string };
  ariaLabel: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-xl bg-surface ring-1 ring-border-subtle"
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-subtle px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid shrink-0 place-items-center text-icon" aria-hidden>
            {icon}
          </span>
          <p className="text-body-sm-strong text-text-primary">{title}</p>
        </div>
        {status ? <StatusChip intent={status.intent} label={status.label} dot /> : null}
      </div>
      {children}
      {footer}
    </section>
  );
}

export function EmailDetailCard({
  title,
  icon,
  status,
  ariaLabel,
  children,
  footer,
}: {
  title: string;
  icon: ReactNode;
  status?: { intent: StatusIntent; label: string };
  ariaLabel: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <EmailCardShell title={title} icon={icon} status={status} ariaLabel={ariaLabel} footer={footer}>
      {children ? (
        <dl className="divide-y divide-border-subtle bg-surface px-4 sm:px-5">{children}</dl>
      ) : null}
    </EmailCardShell>
  );
}

export function PrimaryCtaButton({ label }: { label: string }) {
  return (
    <div className="w-full sm:w-fit">
      <Button
        variant="primary"
        size="md"
        className="!w-full sm:!w-auto"
        tabIndex={-1}
        onClick={(e) => e.preventDefault()}
      >
        {label}
      </Button>
    </div>
  );
}

export function FallbackLinkBlock({ url }: { url: string }) {
  return (
    <div className="rounded-xl bg-subtle px-4 py-4 ring-1 ring-border-subtle sm:px-5 sm:py-4">
      <p className="text-body-sm text-text-secondary">
        If the button doesn&apos;t work, copy and paste this link into your browser:
      </p>
      <p className="mt-2.5 break-all text-body-sm">
        <a
          href={url}
          className="text-brand underline underline-offset-2"
          tabIndex={-1}
          onClick={(e) => e.preventDefault()}
        >
          {url}
        </a>
      </p>
    </div>
  );
}

export function CtaWithFallback({ buttonLabel, url }: { buttonLabel: string; url: string }) {
  return (
    <>
      <PrimaryCtaButton label={buttonLabel} />
      <FallbackLinkBlock url={url} />
    </>
  );
}

export function ErrorMessageAlert({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg px-3 py-3 ring-1 ring-[var(--ds-color-status-danger-border)] sm:px-4"
      style={{ backgroundColor: 'var(--ds-color-status-danger-subtle)' }}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <ErrorOutlineOutlined
          sx={{ fontSize: 16, color: 'var(--ds-color-status-danger-fg)', flexShrink: 0 }}
          aria-hidden
        />
        <p className="text-caption-medium text-[var(--ds-color-status-danger-fg)]">Error message</p>
      </div>
      <p className="mt-1 break-words pl-6 text-body-sm text-text-primary">{message}</p>
    </div>
  );
}

export function InfoCallout({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-lg px-3 py-3 ring-1 ring-[var(--ds-color-status-info-border)] sm:px-4"
      style={{ backgroundColor: 'var(--ds-color-status-info-subtle)' }}
    >
      <p className="text-body-sm-strong text-text-primary">{title}</p>
      <p className="mt-1.5 text-body-sm text-text-secondary">{body}</p>
    </div>
  );
}

export function ResourceListCard({
  title,
  icon,
  items,
  ariaLabel,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  ariaLabel: string;
}) {
  return (
    <EmailCardShell title={title} icon={icon} ariaLabel={ariaLabel}>
      <ul className="divide-y divide-border-subtle bg-surface px-4 py-1 sm:px-5">
        {items.map((item) => (
          <li key={item} className="py-3 text-body-sm-strong text-text-primary">
            {item}
          </li>
        ))}
      </ul>
    </EmailCardShell>
  );
}

export function TempPasswordCard({
  password,
  applicationName,
  title = 'Login credentials',
}: {
  password: string;
  applicationName: string;
  title?: string;
}) {
  return (
    <EmailDetailCard
      title={title}
      icon={<VpnKeyOutlined sx={{ fontSize: 18 }} />}
      ariaLabel="Login credentials"
    >
      <DetailField
        icon={<AppsOutlined sx={{ fontSize: 16 }} />}
        label="Application"
        value={applicationName}
      />
      <DetailField
        icon={<VpnKeyOutlined sx={{ fontSize: 16 }} />}
        label="Password"
        value={password}
        valueClassName="font-mono break-all"
      />
    </EmailDetailCard>
  );
}

export function ExpiryNote({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-body-sm text-warning">
      <AccessTimeOutlined sx={{ fontSize: 16 }} aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function EmailBodyStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:gap-5">{children}</div>;
}
