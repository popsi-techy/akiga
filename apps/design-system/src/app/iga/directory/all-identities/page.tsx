'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import Shield from '@mui/icons-material/Shield';
import Groups from '@mui/icons-material/Groups';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import LinkOff from '@mui/icons-material/LinkOff';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import NoAccountsOutlined from '@mui/icons-material/NoAccountsOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import { Avatar, AvatarGroup, Card, DonutChart } from '@ds/components';
import {
  byKind,
  exceptions,
  orphanAccountCount,
  orphanAccounts,
  population,
  riskiestIdentities,
  unitLabel,
  type Exception,
} from '@/data/identity-insights';
import { EntityAvatar, RiskScoreChip } from '@/components/product/directory';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * All Identities — the overview of who exists and what is wrong with it.
 *
 * ## The rule the whole page is built on
 *
 * **No number is a dead end.** Every tile, every queue row, every legend entry
 * carries the route that lists exactly those rows. The failure mode of most IGA
 * dashboards is a wall of figures with no verb: the reader learns there are four
 * orphan accounts and then has to go and rebuild that filter by hand on another
 * screen. A count that cannot be opened is decoration.
 *
 * ## Reading order: population, then exceptions
 *
 * The population comes first because it is the denominator — "4 orphans" means
 * nothing until you know whether the estate is 20 accounts or 20,000. Exceptions
 * come second because they are the only part anyone can act on today, and they are
 * given the most space and the last word for that reason. There is deliberately no
 * chart section under them: a distribution is for exploring, not for reacting, and
 * anything sitting below the queue competes with the one section that has a verb
 * in it.
 *
 * ## Exceptions are a queue, not a scoreboard
 *
 * Only non-zero findings are listed, ordered worst-first. A queue padded with
 * green zeroes teaches the reader to skim past it, and the day something appears
 * they will skim past that too.
 */
/**
 * One icon per finding, keyed by id.
 *
 * It lives here and not in `identity-insights` because it is presentation: the
 * data layer should not import a glyph. Each one states the *shape* of the
 * problem — a date that passed, a person switched off, a broken link, a rule, an
 * account that leads nowhere — so the row is placed before it is read.
 *
 * Outlined, not filled: at 20px in a tinted tile a filled glyph becomes a solid
 * orange blob, and six of them down the card read as a colour block. The outline
 * keeps the shape legible, which is the only reason the icon is here. (Card header
 * icons are the opposite case — 15px, where an outline disappears — which is what
 * `check:icons` enforces there and not here.)
 */
const FINDING_ICON: Record<string, React.ReactNode> = {
  'expired-external': <EventBusyOutlined />,
  'inactive-with-access': <PersonOffOutlined />,
  'open-sod': <PolicyOutlined />,
  'high-risk': <ShieldOutlined />,
  'no-account': <NoAccountsOutlined />,
};

/**
 * Severity is spoken but no longer drawn: the queue is ordered worst-first, so the
 * position carries it for a sighted reader, and a screen reader has no position to
 * read. Kept on the accessible name for exactly that reason.
 */
const SEVERITY_WORD: Record<Exception['tone'], string> = {
  danger: 'act now',
  caution: 'review',
  warning: 'watch',
  neutral: 'check',
};

export default function AllIdentitiesPage() {
  useSetBreadcrumbs([{ label: 'Identities' }, { label: 'All Identities' }]);
  const router = useRouter();

  const p = population();
  const findings = exceptions();
  const kinds = byKind();
  const riskiest = riskiestIdentities();
  const orphans = orphanAccounts();
  const orphanTotal = orphanAccountCount();

  return (
    // No scroll container of its own: `<main>` in the IGA layout already scrolls
    // (`ds-scroll flex-1 overflow-y-auto`), and nesting a second one put two
    // thumbs side by side on the right edge.
    <div>
      {/* The dashboard's header shape: the page's name carries the weight and the
          rest of the line continues it in the secondary tone, so the whole thing
          reads as one sentence rather than a title with a paragraph under it. */}
      <div className="mb-6">
        <h1 className="text-h2 text-text-primary">
          All Identities,{' '}
          <span className="font-normal text-text-secondary">
            Who Holds Access and What Needs Attention
          </span>
        </h1>
      </div>

      {/* ---- population + high risk identities ----

          A donut rather than four tiles: the question the band answers is how the
          population *splits*, and four separate numbers made the reader do that
          division in their head. The riskiest people sit beside it because a
          composition on its own is a fact, and this is the page's first thing to
          act on. */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Identities" icon={<Groups />}>
          {/* Centred in whatever height the taller card next to it sets, so the
              chart is not left sitting high with the slack all beneath it. */}
          <div className="flex h-full items-center justify-center">
            <DonutChart
              segments={kinds}
              size={168}
              // A thinner ring than the product default: the wedges here are two,
              // not eight, so the arc needs no weight to be read, and the extra
              // inner radius is what lets the total sit in the middle as a number
              // rather than as something wedged into a hole.
              thickness={14}
              centerValue={p.total}
              centerLabel="identities"
              ariaLabel={`${p.total} identities: ${kinds.map((s) => `${s.label} ${s.value}`).join(', ')}`}
            />
          </div>
        </Card>

        <Card title="High Risk Identities" icon={<Shield />} padding="none">
          <ul className="py-1">
            {riskiest.map((i) => (
              // The rule lives on the <li>, not the <a>: the anchor is its list
              // item's only child, so `last:` would have matched on every row and
              // suppressed every divider.
              <li key={i.id} className="border-b border-border last:border-b-0">
                <Link
                  href={`/iga/directory/user-identities/${i.id}`}
                  className="flex items-center gap-3 py-4 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle"
                >
                  <EntityAvatar kind="user" name={i.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm-strong text-text-primary">{i.name}</span>
                    <span className="block truncate text-caption text-text-secondary">
                      {i.jobTitle} · {i.department}
                    </span>
                  </span>
                  {/* No kind chip here. At an equal third of the band the row is
                      279px, and two chips took 179px of it — the name was left 31px
                      for the 74 it needs, so every person on the card was truncated
                      to a first syllable. Workforce-or-external is one click away on
                      the identity and on both lists; the risk score is the only
                      reason this card exists, so it is the one that stays. */}
                  <RiskScoreChip score={i.riskScore} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Its own card rather than a row in the queue below: an orphan is the one
            finding that is not about a person, so it never resolved to someone you
            could go and ask. Beside the population it reads as what it is — access
            the directory cannot account for. */}
        <Card title="Orphan accounts" icon={<LinkOff />} padding="none">
          <ul>
            {orphans.map((a) => (
              <li key={a.id} className="border-b border-border last:border-b-0">
                <Link
                  // The App Accounts list, which marks these rows with an "Orphan"
                  // chip. The nav's own /iga/orphan-accounts entry has no page
                  // behind it, so linking there would dead-end the reader.
                  href="/iga/directory/app-accounts"
                  className="flex items-center gap-3 py-4 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle"
                >
                  {/* Round, though these are accounts and not people. A deliberate
                      call: the shape rule exists so a person and the accounts under
                      them are separable in one column, and nothing here mixes the
                      two — while a ringless square beside the ringed circles in the
                      card alongside read as an unfinished component. */}
                  <Avatar name={a.accountName} size="sm" kind="person" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm-strong text-text-primary">
                      {a.accountName}
                    </span>
                    <span className="block truncate text-caption text-text-secondary">
                      {a.applicationName}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {orphanTotal > orphans.length && (
            <p className="py-3 text-caption text-text-tertiary">
              +{orphanTotal - orphans.length} more
            </p>
          )}
        </Card>
      </div>

      {/* ---- exceptions ---- */}
      <section className="mt-8">
        <h2 className="mb-3 text-h4 text-text-primary">Needs attention</h2>

        {findings.length === 0 ? (
          <Card padding="lg">
            <div className="text-body-strong text-text-primary">Nothing outstanding</div>
            <p className="mt-1 text-body-sm text-text-secondary">
              No orphan accounts, no expired external access, no open reviews.
            </p>
          </Card>
        ) : (
          // `divide-y` rather than a border on each row: the rule then belongs to
          // the list, so it cannot be got wrong per child, and the last row has no
          // trailing line to suppress.
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {findings.map((f) => (
              <ExceptionRow key={f.id} finding={f} onOpen={() => router.push(f.href)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
/**
 * One outstanding finding.
 *
 * The count leads because it is what the reader is scanning for, and it is set in
 * the stat type so the column of numbers reads as a column. The sample names sit
 * under the label so the row is concrete before it is opened — "4 orphan accounts"
 * is a statistic, "4 orphan accounts, one of them on AWS" is a thing to do.
 */
/**
 * One outstanding finding.
 *
 * ## Three type levels, and what each is for
 *
 * The count leads at `stat` because it is what the reader scans for, and it sits
 * over its own noun — "4 accounts", not a bare 4 that gets read as identities.
 * The finding is `body-strong`, its consequence is `caption`. Nothing else gets a
 * level; the visual language allows three per region and a queue row that spends
 * a fourth on decoration has none left for the thing that matters.
 *
 * ## Severity is a dot, not a chip
 *
 * This row used to carry a coloured pill reading "Act now" / "Review" / "Watch".
 * Six of them stacked put six bordered colour blocks down the card, and the words
 * restated an order the list was already in. A 6px dot says the same thing in the
 * space of a bullet, keeps the colour budget to small marks on white, and leaves
 * the label as the loudest text on the row. The severity is still spoken — it is
 * on the button's accessible name, where the dot alone would say nothing.
 *
 * ## Faces, not a comma list
 *
 * The sample used to be a grey line of names that read as runoff. As avatars it
 * becomes the one part of the row you can recognise without reading, and the
 * shape says what kind of thing was found: people are round, accounts are square.
 */
function ExceptionRow({ finding, onOpen }: { finding: Exception; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${finding.count} ${unitLabel(finding)} — ${finding.label}. Severity ${SEVERITY_WORD[finding.tone]}.`}
      className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle"
    >
      <Avatar icon={FINDING_ICON[finding.id] ?? <ReportProblemOutlined />} size="md" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-medium text-text-primary">{finding.label}</span>
        <span className="mt-1 block line-clamp-2 text-caption text-text-secondary">{finding.detail}</span>
      </span>

      {finding.sample.length > 0 && (
        <AvatarGroup names={finding.sample} kind="person" size="sm" max={3} />
      )}

      <ArrowForwardOutlined
        sx={{ fontSize: 18 }}
        className="shrink-0 text-icon transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </button>
  );
}
