'use client';

import * as React from 'react';
import { Button, Card, Tabs, useToast, type TabItem } from '@ds/components';
import {
  ensureConnectionEventForKind,
  getConnectionEventByKind,
  mappingComplete,
  saveConnectionEvent,
  type AttributeMapping,
  type ConnectionEvent,
} from '@/data/connection-events';
import { AttributeMappingEditor, blankMappingRow } from './AttributeMappingEditor';
import { IdentityClassificationCard } from './IdentityClassificationCard';

type FetchTab = 'accounts-fetch' | 'entitlements-fetch';

const FETCH_TABS: TabItem[] = [
  { value: 'accounts-fetch', label: 'Account fetch' },
  { value: 'entitlements-fetch', label: 'Entitlement fetch' },
];

function FetchMappingSection({
  applicationId,
  applicationName,
  kind,
}: {
  applicationId: string;
  applicationName: string;
  kind: FetchTab;
}) {
  const toast = useToast();
  const [event, setEvent] = React.useState<ConnectionEvent | null>(null);
  const [rows, setRows] = React.useState<AttributeMapping[]>([]);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    const e = ensureConnectionEventForKind(applicationId, kind);
    setEvent(e);
    setRows(e.attributes.length > 0 ? e.attributes.map((a) => ({ ...a })) : [blankMappingRow(0)]);
    setTouched(false);
  }, [applicationId, kind]);

  const started = rows.filter(
    (r) => r.applicationField.trim() !== '' || r.igaAttribute !== '' || r.expression.trim() !== '',
  );
  const incomplete = started.filter((r) => !mappingComplete(r));

  const save = () => {
    setTouched(true);
    if (incomplete.length > 0) return;
    if (!event) return;
    saveConnectionEvent({ ...event, attributes: started });
    toast.success(
      started.length === 0
        ? 'Mapping cleared for this fetch.'
        : `${started.length} ${started.length === 1 ? 'attribute' : 'attributes'} mapped.`,
    );
  };

  const configuredElsewhere = Boolean(getConnectionEventByKind(applicationId, kind)?.url.trim());

  return (
    <>
      {!configuredElsewhere && (
        <p className="mb-4 text-body-sm text-text-secondary">
          The API call for this fetch is set up under Connection configuration.
        </p>
      )}
      <AttributeMappingEditor
        rows={rows}
        onChange={setRows}
        applicationName={applicationName}
        touched={touched}
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={save}>Save mapping</Button>
      </div>
    </>
  );
}

/** Advanced attribute mapping — identity typing plus inbound fetch field maps. */
export function AdvancedAttributeMappingPanel({
  applicationId,
  applicationName,
  onChanged,
}: {
  applicationId: string;
  applicationName: string;
  onChanged?: () => void;
}) {
  const [fetchTab, setFetchTab] = React.useState<FetchTab>('accounts-fetch');

  return (
    <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pb-2">
      <section>
        <h2 className="text-h5 text-text-primary">Identity classification</h2>
        <Card padding="md" className="mt-4">
          <IdentityClassificationCard applicationId={applicationId} onSaved={onChanged} />
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-h5 text-text-primary">Fetch attribute mapping</h2>
        <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
          Map application fields to IGA attributes for each inbound fetch.
        </p>
        <div className="mt-4">
          <Tabs
            aria-label="Fetch type"
            items={FETCH_TABS}
            value={fetchTab}
            onChange={(v) => setFetchTab(v as FetchTab)}
          />
        </div>
        <div className="mt-5">
          <FetchMappingSection
            key={fetchTab}
            applicationId={applicationId}
            applicationName={applicationName}
            kind={fetchTab}
          />
        </div>
      </section>
    </div>
  );
}
