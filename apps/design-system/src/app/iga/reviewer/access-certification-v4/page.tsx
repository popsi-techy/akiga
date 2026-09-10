'use client';

import { AccessCertificationReview } from '../access-certification/AccessCertificationReview';

/**
 * V4 — same campaign as V1–V3; bulk work lives in a selection band above the table.
 *
 * The band is in document flow: count, Select all, and labelled actions on one
 * row, and the table shifts down when it appears. Nothing floats over the header
 * or the rows.
 */
export default function AccessCertificationReviewV4Page() {
  return <AccessCertificationReview bulkSurface="bar" />;
}
