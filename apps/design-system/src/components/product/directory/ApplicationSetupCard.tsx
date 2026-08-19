'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button } from '@ds/components';
import {
  APP_SETUP_STEPS,
  appBlockingSteps,
  isAppSetupStepDone,
  isRequiredAppSetupStep,
  type AppSetupStepId,
} from '@/data/application-setup';
import type { OnboardedApplication } from '@/data/applications-store';
import { NextStepsCard, type NextStep } from '../NextStepsCard';

interface Step extends NextStep {
  tab: string;
}

/**
 * What an onboarded application still needs before IGA can reach it.
 *
 * Same job as EmergencySetupCard: replaces the overview summary while the
 * application is in setup, because integration cards would report nothing
 * useful until the connector exists.
 */
export function ApplicationSetupCard({
  app,
  onGoToTab,
  onEditBasics,
  onConnect,
}: {
  app: OnboardedApplication;
  onGoToTab: (tab: string) => void;
  onEditBasics: () => void;
  onConnect?: () => void;
}) {
  const EXTRAS: Record<
    AppSetupStepId,
    { hint: string; cta: string; tab: string; done: boolean }
  > = {
    basic: {
      hint: 'The name and description shown wherever this application appears in IGA.',
      cta: 'Edit details',
      tab: 'overview',
      done: isAppSetupStepDone('basic', app),
    },
    authorization: {
      hint: 'How IGA signs in — nothing else can be tested until this is connected.',
      cta: 'Add authorization',
      tab: 'provisioning',
      done: isAppSetupStepDone('authorization', app),
    },
    events: {
      hint: 'The API calls IGA makes once it can sign in — import, update, deactivate.',
      cta: 'Configure events',
      tab: 'provisioning',
      done: isAppSetupStepDone('events', app),
    },
    owners: {
      hint: 'Who answers for this application when access is reviewed.',
      cta: 'Add owners',
      tab: 'owners',
      done: isAppSetupStepDone('owners', app),
    },
  };

  const steps: Step[] = APP_SETUP_STEPS.map((step) => ({
    id: step.id,
    label: step.label,
    required: isRequiredAppSetupStep(step.id),
    ...EXTRAS[step.id],
  }));

  const blocking = appBlockingSteps(app);
  const canConnect = blocking.length === 0;

  return (
    <NextStepsCard
      title="Recommended next steps to connect this application"
      steps={steps}
      onStep={(id) => {
        if (id === 'basic') {
          onEditBasics();
          return;
        }
        onGoToTab(steps.find((s) => s.id === id)?.tab ?? 'overview');
      }}
      footer={
        canConnect && onConnect ? (
          <div
            role="status"
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] px-3 py-2.5"
          >
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <InfoOutlined
                sx={{ fontSize: 18, color: 'var(--ds-color-status-info-fg)' }}
                className="mt-0.5 shrink-0"
                aria-hidden
              />
              <p className="text-body-sm text-[var(--ds-color-status-info-fg)]">
                Required steps are complete. You can connect this application now.
              </p>
            </div>
            <Button onClick={onConnect}>Connect</Button>
          </div>
        ) : undefined
      }
      stepCtaVariant={canConnect ? 'secondary' : 'primary'}
    />
  );
}
