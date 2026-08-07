'use client';

import * as React from 'react';
import MuiDialog from '@mui/material/Dialog';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MailOutline from '@mui/icons-material/MailOutline';
import ChatOutlined from '@mui/icons-material/ChatBubbleOutline';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DataObjectOutlined from '@mui/icons-material/DataObjectOutlined';
import { Button, Input, Select, Switch } from '@ds/components';
import type { NotificationConfig as NConfig, NotifTemplate } from '@/data/automation-types';
import {
  BUILTIN_TEMPLATES,
  listCustomTemplates,
  saveCustomTemplate,
  TEMPLATE_VARIABLES,
} from '@/data/notification-templates';

type ChannelKey = 'email' | 'slack';

export function NotificationConfig({ config, onChange }: { config: NConfig; onChange: (next: NConfig) => void }) {
  const [editing, setEditing] = React.useState<ChannelKey | null>(null);

  const setChannel = (key: ChannelKey, patch: Partial<NConfig[ChannelKey]>) =>
    onChange({ ...config, [key]: { ...config[key], ...patch } });

  return (
    <div className="space-y-3">
      <div className="text-caption font-semibold uppercase tracking-[0.07em] text-text-tertiary">Channels</div>
      {(['email', 'slack'] as const).map((key) => {
        const ch = config[key];
        const Icon = key === 'email' ? MailOutline : ChatOutlined;
        return (
          <div key={key} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-subtle text-icon-brand">
              <Icon sx={{ fontSize: 18 }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-body-sm font-medium capitalize text-text-primary">{key}</div>
              <div className="truncate text-caption text-text-secondary">
                {ch.enabled ? ch.template.name || 'No template selected' : 'Off'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(key)}
              aria-label={`Configure ${key}`}
              className="grid h-7 w-7 place-items-center rounded-md text-icon hover:bg-surface-hover"
            >
              <SettingsOutlined sx={{ fontSize: 18 }} />
            </button>
            <Switch
              size="sm"
              checked={ch.enabled}
              onChange={(e) => setChannel(key, { enabled: e.target.checked })}
              inputProps={{ 'aria-label': `Enable ${key}` }}
            />
          </div>
        );
      })}

      {editing && (
        <ChannelEditor
          channel={editing}
          value={config[editing].template}
          onClose={() => setEditing(null)}
          onSave={(template) => {
            setChannel(editing, { template, enabled: true });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ChannelEditor({
  channel,
  value,
  onClose,
  onSave,
}: {
  channel: ChannelKey;
  value: NotifTemplate;
  onClose: () => void;
  onSave: (t: NotifTemplate) => void;
}) {
  const [tpl, setTpl] = React.useState<NotifTemplate>(value);
  const [varAnchor, setVarAnchor] = React.useState<HTMLElement | null>(null);
  const [custom, setCustom] = React.useState<NotifTemplate[]>([]);
  const isEmail = channel === 'email';

  React.useEffect(() => {
    setCustom(listCustomTemplates());
  }, []);

  const catalog = [...BUILTIN_TEMPLATES, ...custom];

  const applyTemplate = (id: string) => {
    const t = catalog.find((x) => x.id === id);
    if (t) setTpl({ ...t });
  };

  const insertVar = (token: string) => {
    setTpl((t) => ({ ...t, body: `${t.body}${token}` }));
    setVarAnchor(null);
  };

  return (
    <MuiDialog open onClose={onClose} PaperProps={{ sx: { width: 640, maxWidth: '94vw', borderRadius: 'var(--ds-radius-xl)' } }}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="text-h5 font-semibold capitalize text-text-primary">Configure {channel}</div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-icon hover:bg-surface-hover">
          <CloseIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      <div className="ds-scroll max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
        <Select
          label="Template"
          options={[
            ...BUILTIN_TEMPLATES.map((t) => ({ value: t.id!, label: t.name })),
            ...custom.map((t) => ({ value: t.id!, label: `${t.name} (custom)` })),
          ]}
          value={catalog.find((t) => t.name === tpl.name)?.id ?? ''}
          placeholder="Choose a starting template"
          onChange={applyTemplate}
        />

        <Input label="Template name" size="sm" value={tpl.name} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} />

        {isEmail && (
          <Input label="Subject" size="sm" value={tpl.subject ?? ''} onChange={(e) => setTpl({ ...tpl, subject: e.target.value })} />
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-body-sm font-medium text-text-primary">Body</span>
            <Button variant="secondary" size="sm" startIcon={<DataObjectOutlined />} onClick={(e) => setVarAnchor(e.currentTarget)}>
              Insert variable
            </Button>
          </div>
          <Input aria-label="Body" size="sm" multiline minRows={6} value={tpl.body} onChange={(e) => setTpl({ ...tpl, body: e.target.value })} />
          <Menu anchorEl={varAnchor} open={Boolean(varAnchor)} onClose={() => setVarAnchor(null)}>
            {TEMPLATE_VARIABLES.map((v) => (
              <MenuItem key={v.token} onClick={() => insertVar(v.token)} sx={{ fontSize: '13px' }}>
                {v.label} <span className="ml-2 text-text-tertiary">{v.token}</span>
              </MenuItem>
            ))}
          </Menu>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
        <Button
          variant="secondary"
          onClick={() => {
            const saved = saveCustomTemplate(tpl);
            setCustom(listCustomTemplates());
            setTpl(saved);
          }}
        >
          Save as custom template
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(tpl)}>Save</Button>
        </div>
      </div>
    </MuiDialog>
  );
}

export default NotificationConfig;
