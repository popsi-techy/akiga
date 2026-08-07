/**
 * Navigation model for the Design System application.
 * The DS is a polished product with its own IA — Foundations first, then
 * Components, Patterns, and IGA-specific sections (added as they're built).
 */
export type NavItem = { label: string; href: string; status?: 'ready' | 'wip' | 'planned' };
export type NavSection = { title: string; items: NavItem[] };

export const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Introduction', href: '/', status: 'ready' },
      { label: 'Visual Language', href: '/overview/visual-language', status: 'ready' },
    ],
  },
  {
    title: 'Foundations',
    items: [
      { label: 'Overview', href: '/foundations', status: 'ready' },
      { label: 'Colors', href: '/foundations/colors', status: 'ready' },
      { label: 'Typography', href: '/foundations/typography', status: 'ready' },
      { label: 'Spacing', href: '/foundations/spacing', status: 'ready' },
      { label: 'Radius', href: '/foundations/radius', status: 'ready' },
      { label: 'Elevation', href: '/foundations/elevation', status: 'ready' },
      { label: 'Iconography', href: '/foundations/iconography', status: 'ready' },
      { label: 'Grid & Layout', href: '/foundations/grid', status: 'ready' },
      { label: 'Motion', href: '/foundations/motion', status: 'ready' },
      { label: 'Accessibility', href: '/foundations/accessibility', status: 'ready' },
    ],
  },
  {
    title: 'Components',
    items: [
      { label: 'Overview', href: '/components', status: 'ready' },
      { label: 'Button', href: '/components/button', status: 'ready' },
      { label: 'Card', href: '/components/card', status: 'ready' },
      { label: 'Avatar', href: '/components/avatar', status: 'ready' },
      { label: 'Info Row', href: '/components/info-row', status: 'ready' },
      { label: 'Input', href: '/components/input', status: 'ready' },
      { label: 'Select', href: '/components/select', status: 'ready' },
      { label: 'Switch', href: '/components/switch', status: 'ready' },
      { label: 'Tabs', href: '/components/tabs', status: 'ready' },
      { label: 'Status Chip', href: '/components/status-chip', status: 'ready' },
      { label: 'Data Table', href: '/components/data-table', status: 'ready' },
      { label: 'Selection Panel', href: '/components/selection-panel', status: 'ready' },
      { label: 'Flow Canvas', href: '/components/flow-canvas', status: 'ready' },
      { label: 'Radio Card Group', href: '/components/radio-card-group', status: 'ready' },
      { label: 'Drawer', href: '/components/drawer', status: 'ready' },
      { label: 'Dialog', href: '/components/dialog', status: 'ready' },
      { label: 'Toast', href: '/components/toast', status: 'ready' },
      { label: 'Menu', href: '/components/menu', status: 'ready' },
      { label: 'Stat Tile', href: '/components/stat-tile', status: 'ready' },
      { label: 'Donut Chart', href: '/components/donut-chart', status: 'ready' },
    ],
  },
  {
    title: 'Patterns',
    items: [{ label: 'Coming next', href: '/patterns', status: 'planned' }],
  },
];
