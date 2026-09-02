'use client';

import { AccessCertificationReview } from '../access-certification/AccessCertificationReview';

/**
 * V3 — same campaign as V1 and V2; bulk work lives in the page toolbar.
 *
 * A Bulk action menu sits beside Filter and stays there, inert until the table
 * has a selection. Nothing floats over the rows and nothing appears mid-task,
 * so the toolbar never reflows under the pointer.
 */
export default function AccessCertificationReviewV3Page() {
  return <AccessCertificationReview bulkSurface="toolbar" />;
}
