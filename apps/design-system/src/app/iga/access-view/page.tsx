'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { Callout } from '@ds/components';
import { AccessPathCard } from '@/components/product/access-view';

const EXPLORER = '/iga/access-view/explorer';

/** 14px so the glyph matches the cap height of the 12px label beside it. */
const lvl = (Icon: React.ElementType, label: string) => ({
  label,
  icon: <Icon sx={{ fontSize: 14 }} />,
});

/**
 * Access View — path chooser.
 *
 * Access can be traced two ways and they answer different questions ("what can this
 * person do in that app" vs "why do they have it"). Asking once, up front, keeps the
 * explorer itself free of mode-switching clutter — and the choice stays reversible
 * from the explorer's Access Path control, which is what the note says.
 *
 * Layout follows the chooser archetype (visual-language §8.5): the cards are the
 * protagonist, so the page above them is two lines and a strip. The grid is capped
 * and left-aligned rather than stretched — two cards spread across a 1400px monitor
 * read as a toolbar, not as a choice.
 */
export default function AccessViewPage() {
  const router = useRouter();
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h2 text-text-primary">Select Access Path</h1>
          <p className="mt-1 text-body text-text-secondary">
            Choose a path to explore access across different access levels.
          </p>
        </div>
        {/* Escape hatch for a reader who already knows where they are going. It picks
            the application path — the built one — rather than pretending to defer. */}
        <button
          type="button"
          onClick={() => router.push(EXPLORER)}
          className="group -mr-1.5 mt-1 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-body-sm-strong text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          Skip for now
          <ChevronRight aria-hidden sx={{ fontSize: 16 }} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mt-5">
        <Callout>
          You can always switch between these two paths while navigating between access levels.
        </Callout>
      </div>

      {/* Capped, not stretched: two cards spread across a wide monitor read as a
          toolbar. The cap is set so the level chain clears one line at desktop widths
          — it wraps below ~1200px, which is the graceful degradation, not the target. */}
      <div className="mt-5 grid max-w-5xl gap-5 lg:grid-cols-2">
        <AccessPathCard
          title="Application Based Access"
          levels={[
            lvl(PersonOutlined, 'User Identity'),
            lvl(AppsOutlined, 'Applications'),
            lvl(PeopleOutlined, 'Accounts'),
            lvl(ShieldOutlined, 'Entitlements'),
          ]}
          description="See exactly what a user can do within each app. Follow the path from their identity to specific accounts and entitlements."
          tags={['Applications', 'Accounts']}
          onClick={() => router.push(EXPLORER)}
        />
        <AccessPathCard
          title="Role Based Access"
          levels={[
            lvl(PersonOutlined, 'User Identity'),
            lvl(BadgeOutlined, 'Business / Technical Roles'),
            lvl(ShieldOutlined, 'Entitlements'),
          ]}
          description="See how a user's job role grants permissions. Follow the path from their business role to their technical roles and entitlements."
          tags={['Business Role', 'Technical Role']}
          comingSoon
        />
      </div>
    </div>
  );
}
