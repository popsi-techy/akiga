import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import WorkOutline from '@mui/icons-material/WorkOutline';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Card, InfoRow, InfoRowGroup, Avatar } from '@ds/components';
import Person from '@mui/icons-material/Person';

export default function InfoRowDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="InfoRow"
        description="Label/value rows for framed Card flush lists. Laid out like a two-column table: values share one left edge so short and long labels don’t shift the value column. Pair with InfoRowGroup and Card padding=&quot;none&quot;."
      />

      <Section title="Basic" description="Wrap rows in InfoRowGroup so the value column lines up.">
        <Example label="table columns — values left-aligned">
          <div className="w-full max-w-sm">
            <Card title="Information" padding="none">
              <InfoRowGroup>
                <InfoRow label="Department" value="IT" />
                <InfoRow label="Job title" value="Cloud Architect" />
                <InfoRow label="Manager" value="Nadia Rahman" />
              </InfoRowGroup>
            </Card>
          </div>
        </Example>
      </Section>

      <Section title="With icon">
        <Example label="profile card">
          <div className="w-full max-w-sm">
            <Card
              title="Violated by"
              icon={<Person />}
              padding="none"
            >
              <div className="flex items-center gap-3 border-b border-border py-3">
                <Avatar name="Henry Adams" size="md" shape="circle" />
                <div className="min-w-0">
                  <div className="text-body-strong text-text-primary">Henry Adams</div>
                  <div className="truncate text-caption text-text-secondary">
                    henry.adams@acme.com
                  </div>
                </div>
              </div>
              <InfoRowGroup>
                <InfoRow
                  icon={<ApartmentOutlined sx={{ fontSize: 18 }} />}
                  label="Department"
                  value="IT"
                />
                <InfoRow
                  icon={<WorkOutline sx={{ fontSize: 18 }} />}
                  label="Job title"
                  value="Cloud Architect"
                />
              </InfoRowGroup>
            </Card>
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'label', type: 'string', description: 'Label cell (secondary). Column width follows the widest label in the group.' },
            { name: 'value', type: 'ReactNode', description: 'Value cell — left-aligned; all values share the same start edge.' },
            { name: 'icon', type: 'ReactNode', description: 'Optional leading icon in the label cell (inherits text-icon).' },
            { name: 'className', type: 'string', description: 'Applied to both cells (e.g. px-4 outside a DS Card gutter).' },
            { name: 'InfoRowGroup', type: 'wrapper', description: 'table w-full — required so rows share one column layout.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Wrap sibling InfoRows in InfoRowGroup.',
            'Use inside Card with padding="none".',
            'Keep values left-aligned in the value column (table layout).',
          ]}
          donts={[
            'Don’t right-align or justify-between label/value.',
            'Don’t let values hug the label — they must share a column edge.',
            'Don’t add horizontal padding on the row when Card already supplies the gutter.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { InfoRow, InfoRowGroup, Card } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
