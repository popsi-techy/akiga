import type { ToastApi } from '@ds/components';
import {
  eaSetupCompletionNotice,
  getEmergencyAccess,
  type EASetupStepId,
} from '@/data/emergency-access';

/**
 * Fires the setup-progress toast when a checklist step just became done.
 * Returns true when it did, so the caller can skip its ordinary "saved" toast.
 */
export function toastEASetupStep(
  toast: ToastApi,
  eaId: string,
  completedId: EASetupStepId,
  wasDoneBefore: boolean,
): boolean {
  const ea = getEmergencyAccess(eaId);
  if (!ea) return false;
  const notice = eaSetupCompletionNotice(completedId, ea, wasDoneBefore);
  if (!notice) return false;
  toast.success(notice.message, {
    title: notice.title,
    duration: notice.title === 'Required steps complete' ? 8000 : 6000,
  });
  return true;
}
