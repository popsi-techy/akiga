'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { DetailNotFound } from '@/components/product/directory';
import {
  ForWhomStep,
  PreviewJustificationDock,
  PreviewStep,
  RequestWizardChrome,
  SelectItemsStep,
  requestTypeCopy,
} from '@/components/product/access-requests';
import type { AccessRequest } from '@/data/access-request-types';
import {
  CURRENT_END_USER,
  getReviewRequest,
  requestItems,
  submitAccessRequest,
} from '@/data/access-requests';

const LIST = '/iga/enduser/access-requests';

type Step = 'for-whom' | 'items' | 'preview';

function parseStep(raw: string | null): Step {
  if (raw === 'items' || raw === 'preview' || raw === 'for-whom') return raw;
  return 'for-whom';
}

export default function EndUserAccessRequestWizardPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const step = parseStep(search.get('step'));
  const [request, setRequest] = React.useState<AccessRequest | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setRequest(getReviewRequest(params.id));
        setLoaded(true);
      } catch {
        setLoadError(true);
        setLoaded(true);
      }
    }, 220);
    return () => window.clearTimeout(t);
  }, [params.id]);

  useSetBreadcrumbs([
    { label: 'Access Requests', href: LIST },
    { label: request ? `Request ${request.reference}` : 'New Request' },
  ]);

  const go = (next: Step) => router.push(`${LIST}/${params.id}?step=${next}`);

  if (!loaded) {
    return (
      <div className="flex h-full flex-col gap-4" aria-busy="true" aria-live="polite">
        <div className="h-10 w-72 animate-pulse rounded-md bg-subtle" />
        <div className="h-40 animate-pulse rounded-xl bg-subtle" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-h3 text-text-primary">Couldn’t load this request</h1>
        <p className="mt-2 text-body text-text-secondary">Refresh the page or return to the list and try again.</p>
      </div>
    );
  }

  if (!request) {
    return <DetailNotFound title="Request not found" backHref={LIST} backLabel="Back to Access Requests" />;
  }

  const draft = request.status === 'draft';
  const items = requestItems(request);
  const copy = requestTypeCopy(request.type);
  const otherReady =
    request.beneficiaryKind !== 'other' ||
    (Boolean(request.requestedForId) && request.requestedForId !== CURRENT_END_USER.id);
  const selfOrOther = Boolean(request.beneficiaryKind);
  const forWhomReady = selfOrOther && (request.beneficiaryKind === 'self' || otherReady);
  const activeStep: Step = draft ? step : 'preview';

  const back = () => {
    if (activeStep === 'preview' && draft) return go('items');
    if (activeStep === 'items') return go('for-whom');
    router.push(LIST);
  };

  const submit = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      const next = submitAccessRequest(request.id, request.businessJustification, request.justificationReason);
      setSubmitting(false);
      if (!next) {
        toast.error(copy.submitBlocked);
        return;
      }
      setRequest(next);
      toast.success(`${next.reference} submitted for approval.`);
      router.push(LIST);
    }, 320);
  };

  return (
    <RequestWizardChrome
      reference={request.reference}
      step={activeStep === 'preview' ? undefined : activeStep === 'for-whom' ? 1 : 2}
      stepCount={activeStep === 'preview' ? undefined : 2}
      requestedForName={activeStep === 'for-whom' ? undefined : request.requestedForName}
      primaryLabel={
        draft
          ? activeStep === 'for-whom'
            ? copy.selectLabel
            : activeStep === 'items'
              ? 'Preview & Submit'
              : undefined
          : undefined
      }
      primaryDisabled={
        activeStep === 'for-whom' ? !forWhomReady : activeStep === 'items' ? items.length === 0 : false
      }
      primaryDisabledReason={
        activeStep === 'for-whom' && !forWhomReady
          ? 'Choose who this request is for.'
          : activeStep === 'items' && items.length === 0
            ? copy.continueEmpty
            : undefined
      }
      onBack={back}
      onPrimary={
        draft
          ? () => {
              if (activeStep === 'for-whom') go('items');
              else if (activeStep === 'items') go('preview');
            }
          : undefined
      }
      dock={
        activeStep === 'preview' ? (
          <PreviewJustificationDock
            request={request}
            onChange={setRequest}
            onSubmit={draft ? submit : undefined}
            submitting={submitting}
            readOnly={!draft}
          />
        ) : undefined
      }
    >
      {activeStep === 'for-whom' && <ForWhomStep request={request} onChange={setRequest} />}
      {activeStep === 'items' && <SelectItemsStep request={request} onChange={setRequest} />}
      {activeStep === 'preview' && <PreviewStep request={request} />}
    </RequestWizardChrome>
  );
}
