'use client';

import * as React from 'react';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import { ChipPicker, SettingsRow, SettingsStack, useToast } from '@ds/components';
import { SingleSelectDrawer } from '@/components/product/automation/SingleSelectDrawer';
import { listApprovalPolicies, getApprovalPolicy } from '@/data/approval-policies';
import { getAppApprovalPolicy, setAppApprovalPolicy } from '@/data/app-approval-policy';
import { getApprovalHierarchy } from '@/data/governance';

/**
 * Which approval policy governs requests for this application — exactly one, or
 * none. One settings row: ChipPicker is Add until a policy is assigned, then
 * the policy name and a pencil in one capsule.
 */
export function ApplicationApprovalPolicyTab({ applicationId }: { applicationId: string }) {
  const toast = useToast();
  const [policyId, setPolicyId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    setPolicyId(getAppApprovalPolicy(applicationId));
  }, [applicationId]);

  const assign = (id: string | null) => {
    setPolicyId(id);
    setAppApprovalPolicy(applicationId, id);
  };

  const policies = React.useMemo(() => listApprovalPolicies(), []);
  const policy = policyId ? getApprovalPolicy(policyId) : null;

  return (
    <div className="w-full max-w-3xl">
      <SettingsStack>
        <SettingsRow
          surface="subtle"
          title="Approval policy"
          description={
            policy?.description ||
            'Choose which policy routes access requests for this application.'
          }
        >
          <ChipPicker
            items={policy ? [{ id: policy.id, name: policy.policyName }] : []}
            addLabel="Add policy"
            editLabel={
              policy
                ? `Approval policy: ${policy.policyName}. Edit.`
                : 'Add approval policy'
            }
            onClick={() => setPickerOpen(true)}
          />
        </SettingsRow>
      </SettingsStack>

      <SingleSelectDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select approval policy"
        subtitle="One policy decides every access request for this application."
        icon={<RuleOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        items={policies.map((p) => {
          const levels = getApprovalHierarchy(p.id)?.levels.length ?? 0;
          return {
            id: p.id,
            primary: p.policyName,
            secondary: [
              p.status === 'active' ? 'Active' : 'Draft',
              `${levels} approval ${levels === 1 ? 'level' : 'levels'}`,
              p.description,
            ]
              .filter(Boolean)
              .join(' · '),
          };
        })}
        selectedId={policyId ?? undefined}
        onSelect={(id) => {
          assign(id);
          toast.success(`“${getApprovalPolicy(id)?.policyName ?? 'Policy'}” now governs this application`);
        }}
        searchPlaceholder="Search approval policies"
        confirmLabel="Assign policy"
      />
    </div>
  );
}

export default ApplicationApprovalPolicyTab;
