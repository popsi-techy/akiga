/**
 * Notification templates service — built-in catalog + a custom-template store
 * (localStorage `iga.notificationTemplates.v1`) and the variable vocabulary that
 * can be inserted into subject/body. Screens use these, not localStorage directly.
 */
import type { NotifTemplate } from './automation-types';

const STORE_KEY = 'iga.notificationTemplates.v1';
const hasWindow = () => typeof window !== 'undefined';

/** Variables offered by the "Insert variable" control. */
export const TEMPLATE_VARIABLES: { token: string; label: string }[] = [
  { token: '{{requester.name}}', label: 'Requester name' },
  { token: '{{requester.email}}', label: 'Requester email' },
  { token: '{{approver.name}}', label: 'Approver name' },
  { token: '{{resource}}', label: 'Requested resource' },
  { token: '{{policy.name}}', label: 'Policy name' },
];

/** Built-in, non-editable starting points. */
export const BUILTIN_TEMPLATES: NotifTemplate[] = [
  {
    id: 'tpl-approver',
    name: 'New Approval Request Assigned',
    subject: 'New approval request for {{resource}}',
    body: '<p>Hi {{approver.name}},</p><p>{{requester.name}} has requested access to {{resource}}. Please review and approve or reject the request.</p>',
  },
  {
    id: 'tpl-request-approved',
    name: 'Request Approved',
    subject: 'Your access request for {{resource}} was approved',
    body: '<p>Hi {{requester.name}},</p><p>Your request for {{resource}} under {{policy.name}} has been approved by {{approver.name}}.</p>',
  },
  {
    id: 'tpl-request-rejected',
    name: 'Request Rejected',
    subject: 'Your access request for {{resource}} was rejected',
    body: '<p>Hi {{requester.name}},</p><p>Your request for {{resource}} under {{policy.name}} has been rejected by {{approver.name}}.</p>',
  },
  {
    id: 'tpl-requester',
    name: 'Requester Notification',
    subject: 'Update on your access request',
    body: '<p>Hi {{requester.name}},</p><p>There is an update on your request for {{resource}} under {{policy.name}}.</p>',
  },
];

export function listCustomTemplates(): NotifTemplate[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { templates: NotifTemplate[] };
    return parsed?.templates ?? [];
  } catch {
    return [];
  }
}

/** Save a copy as a reusable custom template; returns it with a stable id. */
export function saveCustomTemplate(t: NotifTemplate): NotifTemplate {
  const saved: NotifTemplate = {
    ...t,
    id: t.id?.startsWith('tpl-custom-') ? t.id : `tpl-custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  };
  if (!hasWindow()) return saved;
  const list = listCustomTemplates().filter((x) => x.id !== saved.id);
  window.localStorage.setItem(STORE_KEY, JSON.stringify({ templates: [...list, saved] }));
  return saved;
}

/** Default config for a fresh Notification node (Email on, Slack off). */
export function defaultNotificationConfig() {
  return {
    email: { enabled: true, template: { ...BUILTIN_TEMPLATES[0] } },
    slack: { enabled: false, template: { name: '', body: '' } },
  };
}

/** Strip tags for emptiness checks on HTML bodies. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}
