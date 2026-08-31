'use client';

import { AccessCertificationReview } from '../access-certification/page';

/** V2 — same campaign as V1; bulk work lives in a bottom SelectionDock. */
export default function AccessCertificationReviewV2Page() {
  return <AccessCertificationReview bulkSurface="dock" />;
}
