'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import SyncAltOutlined from '@mui/icons-material/SyncAltOutlined';
import WavingHandOutlined from '@mui/icons-material/WavingHandOutlined';
import SwapVertOutlined from '@mui/icons-material/SwapVertOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import { Input } from '@ds/components';
import {
  listEmailTemplates,
  groupEmailTemplatesByCategory,
  EMAIL_TEMPLATE_CATEGORY_LABELS,
  type EmailTemplate,
  type EmailTemplateCategory,
} from '@/data/email-templates';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { SettingsDenied, useAdminSettings, useSettingsCrumbs } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

/** A quiet leading glyph per category, so the eye can group the grid without reading it. */
const CATEGORY_ICON: Partial<Record<EmailTemplateCategory, React.ReactNode>> = {
  'account-security': <LockOutlined sx={{ fontSize: 20 }} />,
  'access-requests': <AssignmentOutlined sx={{ fontSize: 20 }} />,
  'reviews-certification': <FactCheckOutlined sx={{ fontSize: 20 }} />,
  'provisioning-lifecycle': <SyncAltOutlined sx={{ fontSize: 20 }} />,
  onboarding: <WavingHandOutlined sx={{ fontSize: 20 }} />,
  'imports-exports': <SwapVertOutlined sx={{ fontSize: 20 }} />,
};

/**
 * One card per email the product sends. Opening a card is where versions live — the shipped
 * Default plus any the tenant has written — so the card itself stays a two-line summary, not
 * a control or a status readout.
 */
/** First nine words, with an ellipsis when there is more — a card is a glance, not the copy. */
function briefly(text: string, words = 9): string {
  const parts = text.trim().split(/\s+/);
  return parts.length <= words ? text : `${parts.slice(0, words).join(' ')}…`;
}

function EmailCard({ template, onOpen }: { template: EmailTemplate; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-subtle text-icon">
        {CATEGORY_ICON[template.category] ?? <EmailOutlined sx={{ fontSize: 20 }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm-strong text-text-primary">{template.name}</span>
        <span className="mt-0.5 block truncate text-caption text-text-secondary">{briefly(template.description)}</span>
      </span>
    </button>
  );
}

/**
 * Email — every notification the product sends, as a catalogue of cards.
 *
 * The reader does not build a list here; the list is the product's own set of emails,
 * grouped by area. Each card says which wording that email currently uses — its shipped
 * Default, or one the tenant wrote. Choosing and composing happen a level in, on the card's
 * own page, so the landing stays a scan of "what gets sent, and in whose words".
 */
export function EmailTypesListPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const router = useRouter();

  const [query, setQuery] = React.useState('');

  if (!allowed) return <SettingsDenied />;

  const q = query.trim().toLowerCase();
  // Every catalogue email except the base envelope, which wraps the others rather than
  // being a message anyone sends.
  const emails = listEmailTemplates().filter((t) => t.category !== 'foundation');
  const filtered = q
    ? emails.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          EMAIL_TEMPLATE_CATEGORY_LABELS[t.category].toLowerCase().includes(q),
      )
    : emails;
  const grouped = groupEmailTemplatesByCategory(filtered);

  return (
    <div className="flex h-full flex-col">
      <div className="w-full max-w-sm shrink-0">
        <Input
          size="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emails"
          aria-label="Search emails"
          startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
        />
      </div>

      <div className="ds-scroll mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
        {grouped.length === 0 ? (
          <p className="py-10 text-center text-body-sm text-text-secondary">
            No emails match “{query.trim()}”.
          </p>
        ) : (
          grouped.map((group, index) => (
            <section
              key={group.category}
              aria-labelledby={`email-group-${group.category}`}
              className={index > 0 ? 'mt-6' : undefined}
            >
              <h2
                id={`email-group-${group.category}`}
                className="mb-2 text-overline uppercase text-text-tertiary"
              >
                {group.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.templates.map((template) => (
                  <EmailCard
                    key={template.id}
                    template={template}
                    onOpen={() => router.push(`/iga/configurations/email/${template.id}`)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
