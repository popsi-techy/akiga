'use client';

import * as React from 'react';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import { Button, Menu } from '@ds/components';

export function EntitlementAddActions({
  onAdd,
  onImportCsv,
}: {
  onAdd: () => void;
  onImportCsv: () => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md">
      <Button onClick={onAdd} sx={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
        Add New Entitlement
      </Button>
      <Menu
        ariaLabel="Other ways to add entitlements"
        offset={4}
        items={[
          { label: 'Other Methods', disabled: true },
          {
            label: 'Import Using CSV',
            icon: <DescriptionOutlined sx={{ fontSize: 18 }} />,
            onClick: onImportCsv,
          },
        ]}
        trigger={
          <Button
            iconOnly
            aria-label="Other ways to add entitlements"
            sx={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: '1px solid var(--ds-color-border-strong)',
              minWidth: 36,
              width: 36,
            }}
          >
            <ExpandMoreOutlined sx={{ fontSize: 18 }} />
          </Button>
        }
      />
    </div>
  );
}
