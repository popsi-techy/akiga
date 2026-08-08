import * as React from 'react';

/** Page header: title + description, used at the top of every docs page. */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8 max-w-3xl">
      {eyebrow && (
        <div className="mb-2 text-caption-strong uppercase tracking-wider text-text-brand">
          {eyebrow}
        </div>
      )}
      <h1 className="text-h1 leading-9 tracking-tight text-text-primary">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-h5 leading-6 text-text-secondary">{description}</p>
      )}
    </header>
  );
}

/** A titled content section. */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-h4 text-text-primary">{title}</h2>
      {description && <p className="mb-4 text-body text-text-secondary">{description}</p>}
      <div className={description ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

/**
 * Generic card container. Border-first (flat) by default — separation comes from
 * the hairline border, matching the product. Pass `raised` for an opt-in faint
 * shadow on genuinely elevated content cards. Reserve stronger shadows for
 * overlays (menus, drawers, dialogs) and hover states.
 */
export function Card({
  children,
  className = '',
  raised = false,
}: {
  children: React.ReactNode;
  className?: string;
  raised?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface ${raised ? 'shadow-xs' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/** A single color swatch with metadata. */
export function Swatch({
  value,
  name,
  sub,
  ring = false,
}: {
  value: string;
  name: string;
  sub?: string;
  ring?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`h-16 w-full rounded-md ${ring ? 'ring-1 ring-inset ring-border' : ''}`}
        style={{ background: value }}
      />
      <div className="mt-2 text-body-sm-strong text-text-primary">{name}</div>
      {sub && <div className="text-caption text-text-tertiary">{sub}</div>}
      <div className="mt-0.5 font-mono text-caption uppercase text-text-secondary">{value}</div>
    </div>
  );
}

/** Renders a full primitive palette ramp (50..1000). */
export function Ramp({
  name,
  ramp,
}: {
  name: string;
  ramp: Record<string | number, string>;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-body-sm-strong text-text-primary">{name}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
        {Object.entries(ramp).map(([step, value]) => (
          <Swatch key={step} value={value} name={step} ring />
        ))}
      </div>
    </div>
  );
}

/** Inline code / token name. */
export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-xs bg-sunken px-1.5 py-0.5 font-mono text-caption text-text-primary">
      {children}
    </code>
  );
}

/** A framed canvas showing live component instances. */
export function Preview({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-lg border border-border bg-subtle ${
        padded ? 'p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** A labelled example: caption above a preview. */
export function Example({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-caption-strong text-text-tertiary">{label}</div>
      <Preview>{children}</Preview>
    </div>
  );
}

/** Props reference table. */
export function PropsTable({
  rows,
}: {
  rows: { name: string; type: string; default?: string; description: string }[];
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full border-collapse text-left text-body-sm">
        <thead>
          <tr className="border-b border-border bg-subtle">
            {['Prop', 'Type', 'Default', 'Description'].map((h) => (
              <th key={h} className="px-4 py-2.5 font-emphasis text-text-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 align-top">
                <span className="font-mono text-caption-strong text-text-primary">{r.name}</span>
              </td>
              <td className="px-4 py-2.5 align-top">
                <span className="font-mono text-caption text-text-brand">{r.type}</span>
              </td>
              <td className="px-4 py-2.5 align-top">
                <span className="font-mono text-caption text-text-tertiary">{r.default ?? '—'}</span>
              </td>
              <td className="px-4 py-2.5 align-top text-text-secondary">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** Do / Don't guidance pair. */
export function DoDont({ dos, donts }: { dos: string[]; donts: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-1.5 text-body-sm-strong text-success">
          ✓ Do
        </div>
        <ul className="space-y-1.5 text-body-sm text-text-secondary">
          {dos.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </Card>
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-1.5 text-body-sm-strong text-danger">
          ✕ Don’t
        </div>
        <ul className="space-y-1.5 text-body-sm text-text-secondary">
          {donts.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/** A token reference table row set. */
export function TokenTable({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full border-collapse text-left text-body-sm">
        <thead>
          <tr className="border-b border-border bg-subtle">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-emphasis text-text-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {cells.map((c, j) => (
                <td key={j} className="px-4 py-2.5 align-middle text-text-primary">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
