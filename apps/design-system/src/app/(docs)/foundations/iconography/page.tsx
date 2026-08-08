import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';
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
        description="We use MUI Icons (Material Symbols) in the outlined style for a consistent, professional line. Icons clarify — they never decorate. Default color is icon.default; brand tint only for emphasis."
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
          Outlined style only. Color with <Code>color.icon.default</Code> (or{' '}
          <Code>icon.brand</Code> for emphasis, status colors for status). Give interactive icons a
          label or <Code>aria-label</Code>. The tinted rounded-square container (brand.subtle) is the
          standard treatment for feature/module icons — matching the product.
        </Card>
      </Section>
    </>
  );
}
