import * as React from 'react';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import LinkOffOutlined from '@mui/icons-material/LinkOffOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CorporateFareOutlined from '@mui/icons-material/CorporateFareOutlined';
import PublicOutlined from '@mui/icons-material/PublicOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import FormatListNumberedOutlined from '@mui/icons-material/FormatListNumberedOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';

/**
 * The icon vocabulary for `InfoRow` label columns.
 *
 * `InfoRow.icon` is required, and this is where the answer comes from. Choosing an
 * icon per call site is how "App Accounts" ends up as a person on one page and a
 * key on the next — the point of an icon column is that the same concept looks the
 * same everywhere, so the eye can find a row without reading it.
 *
 * Where a concept already has an icon in the product's navigation
 * (`registries/product/navigation.json`), that icon wins: Entitlements is a shield
 * in the sidebar, so it is a shield here too.
 *
 * All entries are outlined at 18px — the size `InfoRow`'s label column is built
 * for. (Card *headers* are the filled exception; see `check:icons`.)
 */
const px = { fontSize: 18 } as const;

export const infoIcon = {
  // Access catalog — mirrors the sidebar's icons for the same nouns.
  application: <AppsOutlined sx={px} />,
  account: <ManageAccountsOutlined sx={px} />,
  orphanAccount: <LinkOffOutlined sx={px} />,
  entitlement: <ShieldOutlined sx={px} />,
  technicalRole: <LaptopOutlined sx={px} />,
  businessRole: <BusinessOutlined sx={px} />,
  policy: <PolicyOutlined sx={px} />,

  // People and responsibility.
  person: <PersonOutline sx={px} />,
  people: <PeopleOutlined sx={px} />,
  owner: <AdminPanelSettingsOutlined sx={px} />,
  reviewer: <FactCheckOutlined sx={px} />,
  group: <GroupsOutlined sx={px} />,

  // Identity attributes.
  email: <MailOutline sx={px} />,
  jobTitle: <BadgeOutlined sx={px} />,
  department: <CorporateFareOutlined sx={px} />,
  location: <PublicOutlined sx={px} />,

  // State and measurement.
  risk: <WarningAmberOutlined sx={px} />,
  status: <TaskAltOutlined sx={px} />,
  outcome: <TaskAltOutlined sx={px} />,
  trigger: <BoltOutlined sx={px} />,
  duration: <TimerOutlined sx={px} />,
  steps: <FormatListNumberedOutlined sx={px} />,
  type: <CategoryOutlined sx={px} />,
  item: <InventoryOutlined sx={px} />,

  // Time.
  started: <ScheduleOutlined sx={px} />,
  completed: <EventOutlined sx={px} />,
  submitted: <HistoryOutlined sx={px} />,
  /** Record lifecycle — when a thing came into being, and when it last changed. */
  created: <CalendarTodayOutlined sx={px} />,
  updated: <HistoryOutlined sx={px} />,
} satisfies Record<string, React.ReactNode>;

export type InfoIconName = keyof typeof infoIcon;
