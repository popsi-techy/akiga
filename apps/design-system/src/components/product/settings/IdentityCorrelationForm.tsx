'use client';

import * as React from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import PersonSearchOutlined from '@mui/icons-material/PersonSearchOutlined';
import {
  Button,
  Drawer,
  Input,
  Select,
  SettingsRow,
  SettingsStack,
  Switch,
  Tooltip,
  useToast,
} from '@ds/components';
import { listApplications } from '@/data/directory';
import {
  CORRELATION_MODE_OPTIONS,
  CORRELATION_STRATEGY_OPTIONS,
  addCorrelationStrategy,
  applicationHasCorrelation,
  createCorrelationConfig,
  emptyCorrelationDraft,
  getCorrelationConfig,
  updateCorrelationConfig,
  type CorrelationConfigDraft,
  type CorrelationMatchingMode,
  type CorrelationStrategyKind,
} from '@/data/identity-correlation';

export function IdentityCorrelationDrawer({
  open,
  configId,
  onClose,
  onSaved,
}: {
  open: boolean;
  configId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const editing = configId !== null;
  const [draft, setDraft] = React.useState<CorrelationConfigDraft>(emptyCorrelationDraft);
  const [apps, setApps] = React.useState<{ id: string; name: string }[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [missing, setMissing] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setMissing(false);
    setApps(listApplications());
    if (!configId) {
      setDraft(emptyCorrelationDraft());
      return;
    }
    const existing = getCorrelationConfig(configId);
    if (!existing) {
      setMissing(true);
      return;
    }
    setDraft({
      applicationId: existing.applicationId,
      matchingMode: existing.matchingMode,
      confidenceThreshold: existing.confidenceThreshold,
      strategies: existing.strategies,
      autoLink: existing.autoLink,
      manualOverride: existing.manualOverride,
      autoCreate: existing.autoCreate,
    });
  }, [open, configId]);

  const appTaken = Boolean(
    draft.applicationId && applicationHasCorrelation(draft.applicationId, configId ?? undefined),
  );
  const enabledMatchers = draft.strategies.filter((s) => s.enabled).length;
  const confidenceOk = draft.confidenceThreshold >= 1 && draft.confidenceThreshold <= 100;
  const canSave = Boolean(draft.applicationId) && !appTaken && enabledMatchers > 0 && confidenceOk;

  const appOptions = apps.map((a) => ({
    value: a.id,
    label: a.name,
    disabled: applicationHasCorrelation(a.id, configId ?? undefined),
  }));

  const modeHelp =
    CORRELATION_MODE_OPTIONS.find((o) => o.value === draft.matchingMode)?.description ?? '';
  const canAddMatcher = draft.strategies.length < CORRELATION_STRATEGY_OPTIONS.length;

  const save = () => {
    setSubmitted(true);
    if (!canSave) return;
    if (editing && configId) {
      updateCorrelationConfig(configId, draft);
      toast.success('Correlation configuration saved');
    } else {
      createCorrelationConfig(draft);
      toast.success('Correlation configuration created');
    }
    onSaved();
    onClose();
  };

  const usedKinds = (exceptId: string) =>
    new Set(draft.strategies.filter((s) => s.id !== exceptId).map((s) => s.kind));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={editing ? 'Edit configuration' : 'Create configuration'}
      subtitle={
        editing
          ? 'Change how this application matches discovered accounts to identities.'
          : 'Link discovered accounts in one application to the right identity.'
      }
      icon={<PersonSearchOutlined sx={{ fontSize: 22 }} />}
      footer={
        missing ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={submitted && !canSave}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        )
      }
    >
      {missing ? (
        <p className="text-body-sm text-text-secondary">
          This configuration was removed, or the link is out of date.
        </p>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-h5 text-text-primary">Basic details</h3>
            <Select
              label="Application"
              required
              placeholder="Select application"
              options={appOptions}
              value={draft.applicationId}
              error={
                submitted && !draft.applicationId
                  ? 'Choose an application.'
                  : submitted && appTaken
                    ? 'This application already has a configuration.'
                    : undefined
              }
              onChange={(applicationId) => setDraft({ ...draft, applicationId })}
            />
            <Select
              label="Matching mode"
              required
              options={CORRELATION_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={draft.matchingMode}
              helperText={modeHelp}
              onChange={(matchingMode) =>
                setDraft({ ...draft, matchingMode: matchingMode as CorrelationMatchingMode })
              }
            />
            <Input
              label="Confidence threshold"
              required
              type="number"
              value={String(draft.confidenceThreshold)}
              hint="Matches below this score are ignored."
              endAdornment={<span className="text-body-sm text-text-secondary">%</span>}
              inputProps={{ min: 1, max: 100, 'aria-label': 'Confidence threshold' }}
              error={submitted && !confidenceOk ? 'Enter a value from 1 to 100.' : undefined}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isNaN(n)) return;
                setDraft({ ...draft, confidenceThreshold: n });
              }}
            />
          </div>

          <div>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-h5 text-text-primary">Matchers</h3>
                <p className="mt-1 text-caption text-text-secondary">
                  Attributes compared on the account and the identity. Priority is the order chained
                  mode tries them.
                </p>
              </div>
              <Button
                variant="secondary"
                size="xs"
                startIcon={<AddOutlined />}
                disabled={!canAddMatcher}
                onClick={() =>
                  setDraft({ ...draft, strategies: addCorrelationStrategy(draft.strategies) })
                }
              >
                Add
              </Button>
            </div>
            {submitted && enabledMatchers === 0 ? (
              <p className="mb-3 text-caption text-danger">Enable at least one matcher.</p>
            ) : null}
            <SettingsStack>
              {draft.strategies.map((strategy) => {
                const taken = usedKinds(strategy.id);
                const meta = CORRELATION_STRATEGY_OPTIONS.find((o) => o.value === strategy.kind);
                return (
                  <div key={strategy.id} className="space-y-3 rounded-md bg-subtle px-4 py-3">
                    <Select
                      size="sm"
                      fullWidth
                      label="Match on"
                      options={CORRELATION_STRATEGY_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                        disabled: taken.has(o.value),
                      }))}
                      value={strategy.kind}
                      helperText={meta?.description}
                      onChange={(kind) =>
                        setDraft({
                          ...draft,
                          strategies: draft.strategies.map((s) =>
                            s.id === strategy.id
                              ? { ...s, kind: kind as CorrelationStrategyKind }
                              : s,
                          ),
                        })
                      }
                    />
                    <div className="flex items-end gap-3">
                      <div className="w-[120px]">
                        <Input
                          size="sm"
                          label="Priority"
                          type="number"
                          value={String(strategy.priority)}
                          inputProps={{ min: 1, max: 99, 'aria-label': 'Priority' }}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isNaN(n)) return;
                            setDraft({
                              ...draft,
                              strategies: draft.strategies.map((s) =>
                                s.id === strategy.id ? { ...s, priority: Math.max(1, n) } : s,
                              ),
                            });
                          }}
                        />
                      </div>
                      <div className="flex h-10 flex-1 items-center justify-end gap-2 pb-0.5">
                        <Switch
                          checked={strategy.enabled}
                          onChange={(_, checked) =>
                            setDraft({
                              ...draft,
                              strategies: draft.strategies.map((s) =>
                                s.id === strategy.id ? { ...s, enabled: checked } : s,
                              ),
                            })
                          }
                          inputProps={{ 'aria-label': `Enable ${meta?.label ?? 'matcher'}` }}
                        />
                        <Tooltip title="Remove matcher">
                          <button
                            type="button"
                            aria-label="Remove matcher"
                            disabled={draft.strategies.length === 1}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                strategies: draft.strategies.filter((s) => s.id !== strategy.id),
                              })
                            }
                            className="rounded-md p-1 text-icon-subtle transition-colors hover:bg-surface-hover hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle disabled:pointer-events-none disabled:opacity-40"
                          >
                            <DeleteOutline sx={{ fontSize: 18 }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                );
              })}
            </SettingsStack>
          </div>

          <div>
            <h3 className="mb-4 text-h5 text-text-primary">When a match is found</h3>
            <SettingsStack>
              <SettingsRow
                surface="subtle"
                title="Enable automatic account linking"
                description="Link the account when a match is at or above the threshold."
              >
                <Switch
                  checked={draft.autoLink}
                  onChange={(_, checked) => setDraft({ ...draft, autoLink: checked })}
                  inputProps={{ 'aria-label': 'Enable automatic account linking' }}
                />
              </SettingsRow>
              <SettingsRow
                surface="subtle"
                title="Allow manual correlation overrides"
                description="Admins can still link or unlink accounts after automatic matching."
              >
                <Switch
                  checked={draft.manualOverride}
                  onChange={(_, checked) => setDraft({ ...draft, manualOverride: checked })}
                  inputProps={{ 'aria-label': 'Allow manual correlation overrides' }}
                />
              </SettingsRow>
              <SettingsRow
                surface="subtle"
                title="Create identities for unmatched accounts"
                description="If no matcher succeeds, create a new identity from the account."
              >
                <Switch
                  checked={draft.autoCreate}
                  onChange={(_, checked) => setDraft({ ...draft, autoCreate: checked })}
                  inputProps={{ 'aria-label': 'Create identities for unmatched accounts' }}
                />
              </SettingsRow>
            </SettingsStack>
          </div>
        </div>
      )}
    </Drawer>
  );
}
