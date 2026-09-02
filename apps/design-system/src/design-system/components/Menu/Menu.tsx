'use client';

import * as React from 'react';
import { typography } from '../../tokens/tokens';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/**
 * Menu — a dropdown action menu, extended from MUI Menu. Defaults to a ⋮ icon
 * button trigger (the product's row-actions pattern); pass a custom `trigger`
 * otherwise. Danger items render in the danger color. Stops click propagation so
 * it works inside clickable table rows.
 */
export interface MenuActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Render a divider after this item. */
  divider?: boolean;
  /**
   * Mark this item as the one currently in force — for a menu of mutually
   * exclusive choices, such as the sections a tab strip could not fit. Setting
   * it on any item turns the whole list into a radio group, so a screen reader
   * announces the choice as well as showing it.
   */
  selected?: boolean;
}

export interface MenuProps {
  items: MenuActionItem[];
  /** Custom trigger element; defaults to a ⋮ icon button. */
  trigger?: React.ReactElement;
  ariaLabel?: string;
}

export function Menu({ items, trigger, ariaLabel = 'Actions' }: MenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const close = () => setAnchorEl(null);

  // `aria-haspopup`/`aria-expanded` go on the trigger, not the menu: without
  // them a screen reader announces a plain button and gives no warning that
  // activating it opens a list, or any way to tell that the list is already
  // open. Cloned onto a custom trigger too, so a caller cannot forget them.
  const popupProps = { 'aria-haspopup': 'menu', 'aria-expanded': open } as const;

  /** A list where one item is in force, rather than a list of actions. */
  const choosing = items.some((i) => i.selected !== undefined);

  const triggerEl = trigger ? (
    React.cloneElement(trigger, { onClick: openMenu, ...popupProps } as Partial<unknown>)
  ) : (
    <IconButton size="small" aria-label={ariaLabel} onClick={openMenu} {...popupProps}>
      <MoreVertIcon sx={{ fontSize: 18, color: 'var(--ds-color-icon-default)' }} />
    </IconButton>
  );

  return (
    <>
      {triggerEl}
      <MuiMenu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            minWidth: 190,
            borderRadius: 'var(--ds-radius-md)',
            border: '1px solid var(--ds-color-border-default)',
            boxShadow: 'var(--ds-elevation-lg)',
            '& .MuiList-root': { paddingY: '4px' },
          },
        }}
      >
        {items.flatMap((item, i) => {
          const el = (
            <MuiMenuItem
              key={`i-${i}`}
              disabled={item.disabled}
              selected={item.selected}
              // A radio only when the caller has said which one is chosen;
              // otherwise these are plain actions and claiming otherwise would
              // have a screen reader announce "not checked" on every one.
              role={choosing ? 'menuitemradio' : 'menuitem'}
              aria-checked={choosing ? Boolean(item.selected) : undefined}
              onClick={() => {
                item.onClick?.();
                close();
              }}
              sx={{
                fontSize: typography.bodySm.fontSize,
                paddingY: '7px',
                color: item.danger ? 'var(--ds-color-status-danger-fg)' : 'var(--ds-color-text-primary)',
                '&:hover': {
                  backgroundColor: item.danger
                    ? 'var(--ds-color-status-danger-subtle)'
                    : 'var(--ds-color-surface-hover)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'var(--ds-color-surface-selected)',
                  color: 'var(--ds-color-brand-primary)',
                  '&:hover': { backgroundColor: 'var(--ds-color-surface-selectedHover)' },
                },
              }}
            >
              {item.icon && (
                <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>{item.icon}</ListItemIcon>
              )}
              {item.label}
            </MuiMenuItem>
          );
          return item.divider ? [el, <Divider key={`d-${i}`} sx={{ my: '4px' }} />] : [el];
        })}
      </MuiMenu>
    </>
  );
}

export default Menu;
