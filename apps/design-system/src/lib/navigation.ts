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
  // The component list is grouped by the job a component does. A flat list of
  // thirty-plus entries under one heading cannot be scanned, and alphabetical
  // order puts Checkbox beside Card — adjacency that means nothing.
  {
    title: 'Components',
    items: [
      { label: 'Overview', href: '/components', status: 'ready' },
      { label: 'Button', href: '/components/button', status: 'ready' },
      { label: 'Card', href: '/components/card', status: 'ready' },
      { label: 'Avatar', href: '/components/avatar', status: 'ready' },
      { label: 'App Icon', href: '/components/app-icon', status: 'ready' },
      { label: 'Info Row', href: '/components/info-row', status: 'ready' },
      { label: 'Overflow Chips', href: '/components/overflow-chips', status: 'ready' },
      { label: 'Status Chip', href: '/components/status-chip', status: 'ready' },
      { label: 'Meter', href: '/components/meter', status: 'ready' },
    ],
  },
  {
    title: 'Forms & Input',
    items: [
      { label: 'Input', href: '/components/input', status: 'ready' },
      { label: 'Select', href: '/components/select', status: 'ready' },
      { label: 'Checkbox', href: '/components/checkbox', status: 'ready' },
      { label: 'Radio', href: '/components/radio', status: 'ready' },
      { label: 'Switch', href: '/components/switch', status: 'ready' },
      { label: 'Date Picker', href: '/components/date-picker', status: 'ready' },
      { label: 'Time Picker', href: '/components/time-picker', status: 'ready' },
      { label: 'Rich Text Editor', href: '/components/rich-text-editor', status: 'ready' },
    ],
  },
  {
    title: 'Selection',
    items: [
      { label: 'Radio Card Group', href: '/components/radio-card-group', status: 'ready' },
      { label: 'Selectable List', href: '/components/selectable-list', status: 'ready' },
      { label: 'Selection Panel', href: '/components/selection-panel', status: 'ready' },
      { label: 'Picker Slot', href: '/components/picker-slot', status: 'ready' },
      { label: 'Segmented Control', href: '/components/segmented-control', status: 'ready' },
      { label: 'Quick Filter', href: '/components/quick-filter', status: 'ready' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { label: 'Tabs', href: '/components/tabs', status: 'ready' },
      { label: 'Nav List', href: '/components/nav-list', status: 'ready' },
      { label: 'Nav Card', href: '/components/nav-card', status: 'ready' },
      { label: 'Menu', href: '/components/menu', status: 'ready' },
      { label: 'Stepper', href: '/components/stepper', status: 'ready' },
      { label: 'Setup Bar', href: '/components/setup-bar', status: 'ready' },
      { label: 'Step Tracker', href: '/components/step-tracker', status: 'ready' },
    ],
  },
  {
    title: 'Data Display',
    items: [
      { label: 'Data Table', href: '/components/data-table', status: 'ready' },
      { label: 'Stat Tile', href: '/components/stat-tile', status: 'ready' },
      { label: 'Donut Chart', href: '/components/donut-chart', status: 'ready' },
      { label: 'Bar Chart', href: '/components/bar-chart', status: 'ready' },
    ],
  },
  {
    title: 'Canvas',
    items: [
      { label: 'Flow Canvas', href: '/components/flow-canvas', status: 'ready' },
      { label: 'Relationship Canvas', href: '/components/relationship-canvas', status: 'ready' },
    ],
  },
  {
    title: 'Overlays',
    items: [
      { label: 'Drawer', href: '/components/drawer', status: 'ready' },
      { label: 'Filter Drawer', href: '/components/filter-drawer', status: 'ready' },
      { label: 'Modal', href: '/components/modal', status: 'ready' },
      { label: 'Dialog', href: '/components/dialog', status: 'ready' },
      { label: 'Toast', href: '/components/toast', status: 'ready' },
      { label: 'Tooltip', href: '/components/tooltip', status: 'ready' },
    ],
  },
  {
    title: 'Patterns',
    items: [{ label: 'Coming next', href: '/patterns', status: 'planned' }],
  },
];
