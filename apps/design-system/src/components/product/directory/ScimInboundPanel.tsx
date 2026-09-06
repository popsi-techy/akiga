'use client';

import * as React from 'react';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import { Button, Dialog, Input, SettingsInfoBanner, Tooltip, useToast } from '@ds/components';
import { getScimInbound, regenerateScimInboundToken, type ScimInbound } from '@/data/scim-inbound';

/**
 * Inbound SCIM — the URL and token a SCIM client uses to push into IGA.
 * Persistent beside Authorization on types that push into IGA.
 */
export function ScimInboundPanel({ applicationId }: { applicationId: string }) {
  const toast = useToast();
  const [inbound, setInbound] = React.useState<ScimInbound | null>(null);
  const [confirm, setConfirm] = React.useState(false);

  React.useEffect(() => {
    setInbound(getScimInbound(applicationId));
  }, [applicationId]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.info(`Could not copy ${label}`);
    }
  };

  const regenerate = () => {
    setInbound(regenerateScimInboundToken(applicationId));
    setConfirm(false);
    toast.success('Inbound token regenerated. The previous token no longer works.');
  };

  if (!inbound) return null;

  return (
    <>
      <aside className="flex h-full min-h-0 w-96 shrink-0 flex-col rounded-xl border border-border bg-surface">
        <header className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4">
          <h2 className="text-h5 text-text-primary">Inbound (IGA as SCIM server)</h2>
          <div>
            <Button
              variant="secondary"
              size="sm"
              startIcon={<RefreshOutlined />}
              onClick={() => setConfirm(true)}
            >
              Regenerate Token
            </Button>
          </div>
        </header>
        <div className="ds-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <SettingsInfoBanner>
            Point your SCIM client at this URL and have it push using the inbound token below.
          </SettingsInfoBanner>
          <CopyField
            label="SCIM Base URL"
            value={inbound.baseUrl}
            onCopy={() => void copy(inbound.baseUrl, 'SCIM Base URL')}
          />
          <CopyField
            label="Inbound Bearer Token"
            value={inbound.token}
            helperText="Store this securely. Regenerate to rotate it; the old inbound token stops working immediately."
            onCopy={() => void copy(inbound.token, 'Inbound Bearer Token')}
          />
        </div>
      </aside>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Regenerate inbound token?"
        confirmLabel="Regenerate"
        tone="danger"
        onConfirm={regenerate}
      >
        Any SCIM client using the current token will fail until it is updated with the new one. The
        current token stops working immediately.
      </Dialog>
    </>
  );
}

function CopyField({
  label,
  value,
  helperText,
  onCopy,
}: {
  label: string;
  value: string;
  helperText?: string;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="group relative w-full">
        <Input label={label} value={value} InputProps={{ readOnly: true }} />
        <div className="pointer-events-none absolute bottom-0 right-1.5 flex h-9 items-center opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <Tooltip title="Copy">
            <button
              type="button"
              aria-label={`Copy ${label}`}
              disabled={!value}
              onClick={onCopy}
              className="grid h-6 w-6 place-items-center rounded-md bg-surface text-icon hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle disabled:opacity-40"
            >
              <ContentCopyOutlined sx={{ fontSize: 14 }} />
            </button>
          </Tooltip>
        </div>
      </div>
      {helperText ? <p className="mt-1.5 text-caption text-text-secondary">{helperText}</p> : null}
    </div>
  );
}
