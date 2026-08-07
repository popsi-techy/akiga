'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Drawer, Input, Button, RadioCardGroup } from '@ds/components';

/**
 * SingleSelectDrawer — a searchable radio-list drawer for choosing exactly one
 * entity (approver User or Governance Group). Multi-select entity catalogs use a
 * different (table) drawer; single approver selection is deliberately simple.
 */
export interface SingleSelectItem {
  id: string;
  primary: string;
  secondary?: string;
}

export interface SingleSelectDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  items: SingleSelectItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
  confirmLabel?: string;
}

export function SingleSelectDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  items,
  selectedId,
  onSelect,
  searchPlaceholder = 'Search',
  confirmLabel = 'Select',
}: SingleSelectDrawerProps) {
  const [query, setQuery] = React.useState('');
  const [temp, setTemp] = React.useState<string | undefined>(selectedId);

  // reset local selection each time the drawer opens
  React.useEffect(() => {
    if (open) {
      setTemp(selectedId);
      setQuery('');
    }
  }, [open, selectedId]);

  const filtered = items.filter(
    (i) =>
      i.primary.toLowerCase().includes(query.trim().toLowerCase()) ||
      (i.secondary ?? '').toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      width={460}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!temp}
            onClick={() => {
              if (temp) onSelect(temp);
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="mb-3 shrink-0">
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        <div className="ds-scroll -mx-1 flex-1 overflow-y-auto px-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-body-sm text-text-secondary">No matches.</div>
          ) : (
            <RadioCardGroup
              ariaLabel={title}
              appearance="outlined"
              options={filtered.map((i) => ({ value: i.id, label: i.primary, description: i.secondary }))}
              value={temp}
              onChange={(v) => setTemp(v)}
            />
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default SingleSelectDrawer;
