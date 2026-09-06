'use client';

import { AccessCertificationReview } from '../access-certification/AccessCertificationReview';

/**
 * V3 — same campaign as V1 and V2; bulk work lives in the page toolbar.
 *
 * A Bulk action menu joins Filter only after a row is selected. Nothing
 * floats over the rows, and the toolbar does not advertise a disabled control
 * when there is nothing to act on.
 */
export default function AccessCertificationReviewV3Page() {
  return <AccessCertificationReview bulkSurface="toolbar" />;
}
