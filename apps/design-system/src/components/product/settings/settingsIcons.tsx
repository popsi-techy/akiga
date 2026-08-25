import * as React from 'react';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import PlaylistAddCheckOutlined from '@mui/icons-material/PlaylistAddCheckOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import LanguageOutlined from '@mui/icons-material/LanguageOutlined';

/** Outlined glyphs for the System Settings hub. Entitlement destinations use shield. */
export const SYSTEM_SETTINGS_ICONS: Record<string, React.ReactNode> = {
  mfa: <SecurityOutlined />,
  'access-request': <AssignmentOutlined />,
  'micro-certification': <FactCheckOutlined />,
  'custom-attributes': <TuneOutlined />,
  'entitlement-types': <ShieldOutlined />,
  'identity-correlation': <PersonSearchOutlined />,
  'role-mining': <InsightsOutlined />,
  'provisioning-task': <PlaylistAddCheckOutlined />,
  'email-templates': <EmailOutlined />,
  'notification-routing': <AltRouteOutlined />,
  'sso-oauth': <LoginOutlined />,
  'locale-regional': <LanguageOutlined />,
};
