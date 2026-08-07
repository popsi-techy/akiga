import type { ComponentType } from 'react';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import AccountBoxOutlined from '@mui/icons-material/AccountBoxOutlined';
import EngineeringOutlined from '@mui/icons-material/EngineeringOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import GroupWorkOutlined from '@mui/icons-material/GroupWorkOutlined';
import LinkOffOutlined from '@mui/icons-material/LinkOffOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import PlaylistAddCheckOutlined from '@mui/icons-material/PlaylistAddCheckOutlined';
import CardMembershipOutlined from '@mui/icons-material/CardMembershipOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import navData from '@registries/navigation.json';
import { myWork } from '@/data/seed';
import type { Persona } from '@/lib/persona';

/**
 * IGA product navigation — DERIVED from the Product Knowledge Base registry
 * (registries/product/navigation.json). The registry owns structure, labels,
 * order, grouping, and routes; the app only supplies presentation (icon
 * components) and runtime badge counts (from the seed). No hand-duplicated data.
 *
 * The admin persona uses the full `primary` tree — a mix of leaf links and
 * collapsible groups (entries with `children`) — plus a pinned `footer`.
 * Reviewer / end-user keep their focused single-section personaViews.
 */
export type IgaNavLeaf = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ sx?: object }>;
  badge?: number;
};
export type IgaNavParent = {
  id: string;
  label: string;
  icon: ComponentType<{ sx?: object }>;
  children: IgaNavLeaf[];
};
export type IgaNavEntry = IgaNavLeaf | IgaNavParent;
export type IgaNavSection = { title?: string; items: IgaNavEntry[]; divider?: boolean };
export type IgaPersonaNav = { sections: IgaNavSection[]; footer: IgaNavLeaf[] };

/** A nav entry is a collapsible group when it carries `children`. */
export const isNavParent = (e: IgaNavEntry): e is IgaNavParent => 'children' in e;

/** Every clickable leaf across sections + footer — for active-href, breadcrumbs, placeholders. */
export function flattenLeaves(nav: IgaPersonaNav): IgaNavLeaf[] {
  const out: IgaNavLeaf[] = [];
  for (const section of nav.sections) {
    for (const entry of section.items) {
      if (isNavParent(entry)) out.push(...entry.children);
      else out.push(entry);
    }
  }
  out.push(...nav.footer);
  return out;
}

// Registry shape (typed here so we don't depend on inferred JSON types).
interface RegistryLeaf {
  id: string;
  label: string;
  route: string;
  icon: string;
  personas?: string[];
  requiresAction?: boolean;
}
interface RegistryGroup {
  id: string;
  label: string;
  icon: string;
  personas?: string[];
  children: RegistryLeaf[];
}
type RegistryEntry = RegistryLeaf | RegistryGroup;
const isRegistryGroup = (e: RegistryEntry): e is RegistryGroup => 'children' in e;
interface RegistrySection {
  group: string;
  label?: string;
  items: RegistryEntry[];
  /** Render a soft divider above this section (e.g. before Configurations). */
  divider?: boolean;
}

/** Maps registry icon names → MUI icon components. */
const ICONS: Record<string, ComponentType<{ sx?: object }>> = {
  dashboard: DashboardOutlined,
  task: TaskAltOutlined,
  fact_check: FactCheckOutlined,
  receipt_long: ReceiptLongOutlined,
  people: PeopleOutlined,
  apps: AppsOutlined,
  shopping_bag: ShoppingBagOutlined,
  badge: BadgeOutlined,
  verified: VerifiedOutlined,
  policy: PolicyOutlined,
  warning: WarningAmberOutlined,
  emergency: VpnKeyOutlined,
  account_tree: AccountTreeOutlined,
  rule: RuleOutlined,
  assessment: AssessmentOutlined,
  history: HistoryOutlined,
  settings: SettingsOutlined,
  balance: AccountBalanceOutlined,
  inventory: Inventory2Outlined,
  account_box: AccountBoxOutlined,
  key: VpnKeyOutlined,
  engineering: EngineeringOutlined,
  groups: GroupsOutlined,
  sync: SyncOutlined,
  group_work: GroupWorkOutlined,
  link_off: LinkOffOutlined,
  insights: InsightsOutlined,
  manage_accounts: ManageAccountsOutlined,
  hub: HubOutlined,
  playlist_add_check: PlaylistAddCheckOutlined,
  card_membership: CardMembershipOutlined,
  bolt: BoltOutlined,
  shield: ShieldOutlined,
  campaign: CampaignOutlined,
  visibility: VisibilityOutlined,
  business: BusinessOutlined,
  person: PersonOutline,
  laptop: LaptopOutlined,
};
const iconFor = (name: string) => ICONS[name] ?? DashboardOutlined;

/** Runtime badge counts for the "needs my action" items (from the seed). */
const BADGES: Record<string, number> = {
  'my-approvals': myWork.approvals,
  'my-reviews': myWork.reviews,
  'review-requests': myWork.reviewRequests,
};

const toLeaf = (l: RegistryLeaf): IgaNavLeaf => ({
  id: l.id,
  label: l.label,
  href: l.route,
  icon: iconFor(l.icon),
  badge: l.requiresAction ? BADGES[l.id] : undefined,
});

const primary = (navData as { primary: RegistrySection[] }).primary;
const footer = (navData as { footer?: RegistryLeaf[] }).footer ?? [];

const toEntry = (entry: RegistryEntry): IgaNavEntry =>
  isRegistryGroup(entry)
    ? { id: entry.id, label: entry.label, icon: iconFor(entry.icon), children: entry.children.map(toLeaf) }
    : toLeaf(entry);

const adminSections: IgaNavSection[] = primary.map((section) => ({
  title: section.label,
  items: section.items.map(toEntry),
  divider: section.divider,
}));
const adminFooter: IgaNavLeaf[] = footer.map(toLeaf);

// ---- persona views (Reviewer / End user) -----------------------------
interface PersonaViewItem {
  id: string;
  label: string;
  route: string;
  icon: string;
}
interface PersonaView {
  label: string;
  description: string;
  items: PersonaViewItem[];
}
const personaViews = (navData as { personaViews: Record<string, PersonaView> }).personaViews;

function buildPersonaNav(key: 'reviewer' | 'endUser'): IgaPersonaNav {
  const view = personaViews[key];
  return {
    sections: [
      {
        title: view.label,
        items: view.items.map((it) => ({ id: it.id, label: it.label, href: it.route, icon: iconFor(it.icon) })),
      },
    ],
    footer: [],
  };
}

/** Sidebar nav per persona. Admin uses the full primary nav (groups + footer). */
export const navForPersona: Record<Persona, IgaPersonaNav> = {
  admin: { sections: adminSections, footer: adminFooter },
  reviewer: buildPersonaNav('reviewer'),
  endUser: buildPersonaNav('endUser'),
};

/** The apps-switcher entries (top bar). */
export const PERSONAS: {
  id: Persona;
  label: string;
  description: string;
  dashboardHref: string;
  icon: ComponentType<{ sx?: object }>;
}[] = [
  { id: 'admin', label: 'Admin', description: 'Full governance console', dashboardHref: '/iga/dashboard', icon: AdminPanelSettingsOutlined },
  { id: 'reviewer', label: 'Reviewer', description: personaViews.reviewer.description, dashboardHref: personaViews.reviewer.items[0].route, icon: FactCheckOutlined },
  { id: 'endUser', label: 'End user', description: personaViews.endUser.description, dashboardHref: personaViews.endUser.items[0].route, icon: PersonOutline },
];
