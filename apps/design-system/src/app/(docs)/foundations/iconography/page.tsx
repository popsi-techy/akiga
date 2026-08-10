import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';
import Person from '@mui/icons-material/Person';
import PersonOutline from '@mui/icons-material/PersonOutline';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';

const icons = [
  ['Dashboard', DashboardOutlined],
  ['Identities', PeopleOutlined],
  ['Emergency', VpnKeyOutlined],
  ['Certification', VerifiedOutlined],
  ['Policies', PolicyOutlined],
  ['Risk', WarningAmberOutlined],
  ['Applications', AppsOutlined],
  ['Audit', HistoryOutlined],
  ['Search', SearchOutlined],
  ['Notifications', NotificationsOutlined],
  ['Settings', SettingsOutlined],
  ['Workflow', AccountTreeOutlined],
] as const;

const sizes = [16, 20, 24];

export default function IconographyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Iconography"
        description="We use MUI Icons (Material Symbols) in the outlined style for a consistent, professional line — with one enforced exception, Card headers, which are filled. Icons clarify — they never decorate. Default color is icon.default; brand tint only for emphasis."
      />

      <Section title="Sizes" description="Three sizes cover the product. Match icon size to adjacent text.">
        <div className="flex flex-wrap items-end gap-6">
          {sizes.map((s) => (
            <Card key={s} className="flex flex-col items-center gap-2 px-6 py-4">
              <VpnKeyOutlined sx={{ fontSize: s, color: 'var(--ds-color-icon-default)' }} />
              <div className="font-mono text-caption text-text-tertiary">{s}px</div>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>16px</Code> inline with body text · <Code>20px</Code> default UI / nav ·{' '}
          <Code>24px</Code> headers & feature tiles.
        </p>
      </Section>

      <Section title="Core set" description="Representative icons used across the IGA modules (outlined style).">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {icons.map(([label, Icon]) => (
            <Card key={label} className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-subtle">
                <Icon sx={{ fontSize: 20, color: 'var(--ds-color-brand-primary)' }} />
              </span>
              <span className="text-body-sm-strong text-text-primary">{label}</span>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Rules">
        <Card className="p-5 text-body-sm leading-6 text-text-secondary">
          Outlined style by default. Color with <Code>color.icon.default</Code> (or{' '}
          <Code>icon.brand</Code> for emphasis, status colors for status). Give interactive icons a
          label or <Code>aria-label</Code>. The tinted rounded-square container (brand.subtle) is the
          standard treatment for feature/module icons — matching the product.
        </Card>
      </Section>

      <Section
        title="The one exception: Card headers are filled"
        description="Outlined works from 16px up, where a 1px stroke still reads. A Card header forces its icon to 15px — below that threshold — so an outlined glyph turns into a grey smudge beside the title while its filled twin still reads as a mark."
      >
        {/* The two headers are hand-built rather than real <Card icon={…}> instances:
            check:icons would (correctly) fail the build on a live counter-example. */}
        <div className="flex flex-wrap gap-4">
          {(
            [
              ['Filled — correct', Person, 'icon={<Person />}', true],
              ['Outlined — wrong', PersonOutline, 'icon={<PersonOutline />}', false],
            ] as const
          ).map(([label, Icon, code, ok]) => (
            <Card key={label} className="min-w-[280px] flex-1 p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center text-icon">
                  <Icon sx={{ fontSize: 15 }} />
                </span>
                <span className="text-card-title text-text-primary">Approval path</span>
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <div className="text-body-sm-strong" style={{ color: ok ? 'var(--ds-color-status-success-fg)' : 'var(--ds-color-status-danger-fg)' }}>
                  {label}
                </div>
                <p className="mt-1 text-body-sm text-text-secondary">
                  <Code>{code}</Code>
                </p>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-body-sm text-text-tertiary">
          The two are near-identical in an icon picker at 24px, so this is invisible until it ships.{' '}
          <Code>npm run check:icons</Code> fails the build on any Outlined icon passed to a{' '}
          <Code>Card</Code>, and names the filled replacement. Everywhere else — buttons, list rows,
          canvas nodes, timelines — outlined stays correct.
        </p>
      </Section>
    </>
  );
}
