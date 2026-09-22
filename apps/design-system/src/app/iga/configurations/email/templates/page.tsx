import { redirect } from 'next/navigation';

/**
 * The starter gallery is gone: emails are now a fixed catalogue configured in place, so
 * there is no "start from a template" step. Anything still pointing here lands on the list.
 */
export default function EmailTemplateGalleryPage() {
  redirect('/iga/configurations/email');
}
